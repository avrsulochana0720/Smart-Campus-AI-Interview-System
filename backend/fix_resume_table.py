"""
Migration script to add missing columns to resumes table
"""
from sqlalchemy import text
from database import engine

def fix_resume_table():
    """Add missing columns to resumes table"""
    try:
        with engine.connect() as conn:
            # Check if columns exist
            result = conn.execute(text("PRAGMA table_info(resumes)"))
            columns = [row[1] for row in result.fetchall()]
            
            # Add model_used column if missing
            if 'model_used' not in columns:
                print("Adding model_used column to resumes table...")
                conn.execute(text("ALTER TABLE resumes ADD COLUMN model_used VARCHAR(50)"))
                conn.commit()
                print("✅ model_used column added successfully!")
            else:
                print("✅ Column model_used already exists in resumes table")
            
            # Add confidence_scores column if missing
            if 'confidence_scores' not in columns:
                print("Adding confidence_scores column to resumes table...")
                conn.execute(text("ALTER TABLE resumes ADD COLUMN confidence_scores TEXT"))
                conn.commit()
                print("✅ confidence_scores column added successfully!")
            else:
                print("✅ Column confidence_scores already exists in resumes table")
            
            # Add classification_details column if missing
            if 'classification_details' not in columns:
                print("Adding classification_details column to resumes table...")
                conn.execute(text("ALTER TABLE resumes ADD COLUMN classification_details TEXT"))
                conn.commit()
                print("✅ classification_details column added successfully!")
            else:
                print("✅ Column classification_details already exists in resumes table")
            
            return True
            
    except Exception as e:
        print(f"❌ Error fixing resume table: {e}")
        return False

if __name__ == "__main__":
    success = fix_resume_table()
    exit(0 if success else 1)
