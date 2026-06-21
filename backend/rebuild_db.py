import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "smart_campus_interview")

ROOT_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/"
DB_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def rebuild():
    try:
        # Step 1: Drop and recreate database
        print("Connecting to MySQL root...")
        root_engine = create_engine(ROOT_URL)
        with root_engine.connect() as conn:
            conn.execution_options(isolation_level="AUTOCOMMIT")
            print(f"Dropping database if exists: {DB_NAME}")
            conn.execute(text(f"DROP DATABASE IF EXISTS {DB_NAME}"))
            print("Database dropped.")
            
            print(f"Creating fresh database: {DB_NAME}")
            conn.execute(text(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            print("Database created.")
            
        # Step 2: Create all tables
        print("\nReconnecting to fresh database...")
        db_engine = create_engine(DB_URL)
        
        from database import Base
        from models import User, Resume, Interview, InterviewQuestion, Answer, InterviewReport, ProctoringLog, ScheduledInterview, PDFDocument, PDFChunk, JSONDocument, JSONEntry, Assessment, Feedback, Company, JobRoleTemplate, QuestionBank, Batch, Integration, SystemSettings
        
        print("Recreating database tables...")
        Base.metadata.create_all(bind=db_engine)
        print("Tables created.")
        
        # Step 3: Run migrations to add missing columns
        print("\nApplying database migrations...")
        from migrate_db import migrate
        migrate()
        
        # Step 4: Run report columns migration
        print("\nApplying report columns migration...")
        from add_report_columns import run_migration
        run_migration()
        
        # Step 5: Seed database
        print("\nSeeding database with mock data...")
        from seed_data import seed_db
        seed_db()
        print("Database seeded successfully.")
        
        print("\n=== Database Rebuild Successful ===")
        return True
    except Exception as e:
        print(f"Error rebuilding database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = rebuild()
    sys.exit(0 if success else 1)
