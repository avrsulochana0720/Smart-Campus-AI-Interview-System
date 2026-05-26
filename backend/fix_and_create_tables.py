#!/usr/bin/env python
"""
Fix InnoDB tablespace corruption and create tables
"""
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "smart_campus_interview")

SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as conn:
        print("Attempting to fix InnoDB tablespace corruption...")
        
        # Enable autocommit mode
        conn.execution_options(isolation_level="AUTOCOMMIT")
        
        # List all tables
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        print(f"Found tables: {tables}")
        
        # Drop all tables with CASCADE
        if tables:
            conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            for table in tables:
                try:
                    conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
                    print(f"✓ Dropped table: {table}")
                except Exception as e:
                    print(f"✗ Error dropping {table}: {e}")
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        
        # Create tables from models
        print("\nCreating new tables...")
        from database import Base
        from models import User, Resume, Interview, InterviewQuestion
        
        Base.metadata.create_all(bind=engine)
        print("✓ All tables created successfully!")
        
        # Verify
        result = conn.execute(text("SHOW TABLES"))
        new_tables = [row[0] for row in result]
        print(f"\n✓✓ Final tables: {new_tables}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
