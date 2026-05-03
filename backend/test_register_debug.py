from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User
from passlib.context import CryptContext
import sys

# Hashing context
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./app_users.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_register():
    db = SessionLocal()
    try:
        email = "sulo8@gmail.com"
        name = "Reddy"
        password = "password123"
        
        print(f"Checking for {email}...")
        db_user = db.query(User).filter(User.email == email).first()
        if db_user:
            print("User already exists!")
            return

        print("Hashing password...")
        hashed = pwd_context.hash(password)
        
        print("Creating user...")
        new_user = User(name=name, email=email, password=hashed)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"SUCCESS! Created user with ID {new_user.id}")
        
    except Exception as e:
        print(f"FAILURE: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_register()
