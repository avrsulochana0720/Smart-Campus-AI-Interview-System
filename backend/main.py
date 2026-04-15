from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import engine, get_db, Base
from models import User, Interview
import PyPDF2
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Function to create access token
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# OAuth2 scheme for token
oauth2_scheme = HTTPBearer()

# Function to get current user from token
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        if email is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Create FastAPI app
app = FastAPI()

# Pydantic model for user registration
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

# Pydantic model for login request
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Pydantic model for user response
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

# Pydantic model for interview request
class InterviewRequest(BaseModel):
    user_id: int
    job_role: str
    company: str

# Pydantic model for interview response
class InterviewResponse(BaseModel):
    id: int
    user_id: int
    job_role: str
    company: str
    status: str

# Pydantic model for answer request
class AnswerRequest(BaseModel):
    interview_id: int
    question: str
    answer: str

# Create tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# Register API endpoint
@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Truncate password to 72 bytes (bcrypt limit)
    password_bytes = user.password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    truncated_password = password_bytes.decode('utf-8', errors='ignore')

    # Hash the password
    hashed_password = pwd_context.hash(truncated_password)

    # Create new user
    new_user = User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# Login API endpoint
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Truncate password to 72 bytes (bcrypt limit)
    password_bytes = user.password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    truncated_password = password_bytes.decode('utf-8', errors='ignore')

    # Verify password
    if not pwd_context.verify(truncated_password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Create access token
    access_token = create_access_token(data={"sub": db_user.email, "user_id": db_user.id})

    return {"access_token": access_token, "token_type": "bearer"}

# Get all users endpoint (protected with JWT)
@app.get("/users", response_model=list[UserResponse])
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI Backend"}

# Upload resume endpoint
@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)

    # Save the uploaded file
    file_location = f"{upload_dir}/{file.filename}"
    with open(file_location, "wb") as buffer:
        buffer.write(await file.read())

    # Extract text from PDF
    extracted_text = ""
    try:
        with open(file_location, "rb") as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page in pdf_reader.pages:
                extracted_text += page.extract_text()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")

    # Return filename and first 500 characters
    return {
        "filename": file.filename,
        "text_preview": extracted_text[:500]
    }

# Start interview endpoint
@app.post("/start-interview", response_model=InterviewResponse)
def start_interview(interview: InterviewRequest, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(User).filter(User.id == interview.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create new interview
    new_interview = Interview(
        user_id=interview.user_id,
        job_role=interview.job_role,
        company=interview.company,
        status="started"
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)

    return new_interview

# Get question endpoint
@app.get("/get-question/{interview_id}")
def get_question(interview_id: int, db: Session = Depends(get_db)):
    # Get interview
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Return dummy question based on job role
    job_role = interview.job_role.lower()
    if "python" in job_role or "developer" in job_role:
        question = "Explain OOP concepts in Python"
    elif "javascript" in job_role:
        question = "What is the difference between let, const, and var in JavaScript?"
    elif "java" in job_role:
        question = "Explain the difference between ArrayList and LinkedList in Java"
    elif "react" in job_role:
        question = "What is the difference between useEffect and useLayoutEffect in React?"
    else:
        question = "Tell me about yourself and your experience"

    return {"question": question}

# Submit answer endpoint
@app.post("/submit-answer")
def submit_answer(answer: AnswerRequest, db: Session = Depends(get_db)):
    # Check if interview exists
    interview = db.query(Interview).filter(Interview.id == answer.interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Generate dummy score and feedback
    score = 8
    feedback = "Good answer but improve explanation"

    # Generate next question based on score
    if score > 7:
        next_question = "Explain advanced Python decorators with real-world examples"
    else:
        next_question = "What is the difference between a list and a tuple in Python?"

    return {
        "message": "Answer received",
        "score": score,
        "feedback": feedback,
        "next_question": next_question
    }

# Interview report endpoint
@app.get("/report/{interview_id}")
def get_report(interview_id: int, db: Session = Depends(get_db)):
    # Check if interview exists
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Dummy data for report
    questions_answers = [
        {
            "question": "Explain OOP concepts in Python",
            "answer": "Object-oriented programming is a paradigm based on objects...",
            "score": 8
        },
        {
            "question": "What is the difference between a list and a tuple in Python?",
            "answer": "Lists are mutable, tuples are immutable...",
            "score": 7
        },
        {
            "question": "Explain advanced Python decorators",
            "answer": "Decorators are functions that modify other functions...",
            "score": 9
        }
    ]

    # Calculate average score
    total_score = sum(qa["score"] for qa in questions_answers)
    average_score = total_score / len(questions_answers)

    return {
        "interview_id": interview_id,
        "job_role": interview.job_role,
        "company": interview.company,
        "questions_answers": questions_answers,
        "average_score": average_score
    }
