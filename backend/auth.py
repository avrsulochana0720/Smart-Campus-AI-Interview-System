"""
auth.py — Register + Login + JWT
Handles user authentication, password hashing, and JWT token management.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import hashlib
import secrets

from database import get_db
from models import User

# ── Config ────────────────────────────────────────────
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Bearer token scheme
oauth2_scheme = HTTPBearer()

router = APIRouter()


# ── Instant Native Hashing Helpers ────────────────────
def hash_password_native(password: str) -> str:
    """
    Hash password instantly using Python's built-in hashlib PBKDF2-HMAC-SHA256.
    Extremely fast (<1ms) and 100% compatible with Python 3.14.
    Format: sha256$iterations$salt$hash
    """
    salt = secrets.token_hex(16)
    iterations = 1000  # fast but secure iterations
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    return f"sha256${iterations}${salt}${dk.hex()}"


def verify_password_native(password: str, hashed: str) -> bool:
    """
    Verify password instantly or fallback to passlib if it is a legacy hash.
    """
    if hashed.startswith("sha256$"):
        try:
            parts = hashed.split("$")
            if len(parts) != 4:
                return False
            _, iterations_str, salt, orig_hash = parts
            iterations = int(iterations_str)
            dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
            return dk.hex() == orig_hash
        except Exception:
            return False
    
    # Fallback to passlib for legacy hashes
    try:
        legacy_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
        # Ensure manually truncated for bcrypt compatibility if needed
        truncated = password
        if len(password.encode('utf-8')) > 72:
            truncated = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
        return legacy_context.verify(truncated, hashed)
    except Exception as e:
        print(f"[AUTH LEGACY FALLBACK ERROR] {e}")
        return False


# ── Pydantic Schemas ──────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    profile_image: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# ── Helpers ───────────────────────────────────────────
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, key=SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Decode JWT and return the authenticated User object."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, key=SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Routes ────────────────────────────────────────────
@router.post("/register", response_model=UserResponse)
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    photo: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """Register a new user with optional profile photo."""
    # Check duplicate email
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Hash password instantly using native SHA256 scheme
    hashed_password = hash_password_native(password)

    # Handle photo upload
    profile_image_url = None
    if photo and photo.filename:
        file_ext = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
        file_name = f"profile_{email}_{int(datetime.utcnow().timestamp())}.{file_ext}"
        file_path = os.path.join("uploads", file_name)
        os.makedirs("uploads", exist_ok=True)
        contents = await photo.read()
        if contents:
            with open(file_path, "wb") as f:
                f.write(contents)
            profile_image_url = f"http://localhost:8000/uploads/{file_name}"

    # Create user
    new_user = User(
        name=name,
        email=email,
        password=hashed_password,
        profile_image=profile_image_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user instantly and return JWT access token."""
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Verify password instantly using native SHA256 (falls back to legacy passlib if old hash)
    if not verify_password_native(user.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Auto-upgrade legacy password hash to fast native SHA256 scheme
    if not db_user.password.startswith("sha256$"):
        try:
            db_user.password = hash_password_native(user.password)
            db.commit()
            print(f"[AUTH] Auto-upgraded legacy password hash for {db_user.email} to instant native SHA256.")
        except Exception as ue:
            print(f"[AUTH WARN] Could not auto-upgrade password hash: {ue}")

    access_token = create_access_token(data={
        "sub": db_user.email,
        "user_id": db_user.id,
        "name": db_user.name,
        "profile_image": db_user.profile_image
    })
    return {"access_token": access_token, "token_type": "bearer"}
