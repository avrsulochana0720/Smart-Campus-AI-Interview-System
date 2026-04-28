"""
Database migration script to add new tables for complete interview flow
"""
from database import engine, Base
from models import ProctoringLog, InterviewReport, JobRole
import sys

def migrate_database():
    """Create new tables for the complete interview flow"""
    try:
        print("Starting database migration...")
        
        # Create new tables
        ProctoringLog.__table__.create(engine, checkfirst=True)
        InterviewReport.__table__.create(engine, checkfirst=True)
        JobRole.__table__.create(engine, checkfirst=True)
        
        print("✅ Database migration completed successfully!")
        print("New tables created:")
        print("  - proctoring_logs")
        print("  - interview_reports")
        print("  - job_roles")
        
        return True
        
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        return False

if __name__ == "__main__":
    success = migrate_database()
    sys.exit(0 if success else 1)
