import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv

# Add the current directory to path so we can import database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
from models import User, Resume, Interview, InterviewQuestion

def create_db_if_not_exists():
    """Creates the database if it doesn't exist using a root connection."""
    try:
        # Connect to MySQL without a database name first
        temp_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/"
        temp_engine = create_engine(temp_url)
        
        with temp_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}"))
            print(f"Database '{DB_NAME}' checked/created.")
    except Exception as e:
        print(f"Error creating database: {e}")
        return False
    return True

def create_tables():
    """Creates all tables based on SQLAlchemy models."""
    try:
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully!")
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False
    return True

if __name__ == "__main__":
    if create_db_if_not_exists():
        create_tables()
    else:
        print("Could not verify/create database. Please ensure XAMPP MySQL is running.")
