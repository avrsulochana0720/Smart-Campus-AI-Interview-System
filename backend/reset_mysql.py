import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from models import User, Resume, Interview, InterviewQuestion, Answer, InterviewReport, ProctoringLog

def force_reset():
    print("WARNING: This will drop ALL tables in the MySQL database.")
    try:
        # Drop all tables
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        
        # Create all tables
        print("Creating all tables from current models...")
        Base.metadata.create_all(bind=engine)
        
        print("\n[SUCCESS] Database schema has been reset and synchronized with models.py")
    except Exception as e:
        print(f"\n[ERROR] Failed to reset database: {e}")

if __name__ == "__main__":
    force_reset()
