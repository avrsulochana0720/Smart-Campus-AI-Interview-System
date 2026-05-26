#!/usr/bin/env python
"""
Force reset MySQL database - removes locked tables and recreates schema
"""
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

# Load env
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "smart_campus_interview")

# Connection URL
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def force_reset():
    """Force reset database by dropping and recreating"""
    try:
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # Get inspector to see what tables exist
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"Found {len(tables)} tables: {tables}")
        
        # Drop all tables
        with engine.connect() as conn:
            # Disable foreign key checks
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            
            for table in tables:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
                    print(f"✓ Dropped table: {table}")
                except Exception as e:
                    print(f"✗ Failed to drop {table}: {e}")
            
            # Re-enable foreign key checks
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
            conn.commit()
        
        print("\n✓ Database reset complete!")
        
        # Now create tables
        from database import Base
        from models import User, Resume, Interview, InterviewQuestion
        
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully!")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    success = force_reset()
    sys.exit(0 if success else 1)
