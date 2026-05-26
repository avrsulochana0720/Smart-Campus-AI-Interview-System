#!/usr/bin/env python
"""
Nuclear option: Completely drop database and recreate fresh
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

# Root connection (no database selected)
ROOT_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/"

try:
    # Step 1: Drop database completely using root connection
    engine = create_engine(ROOT_URL)
    with engine.connect() as conn:
        print("Dropping database...")
        conn.execution_options(isolation_level="AUTOCOMMIT")
        conn.execute(text(f"DROP DATABASE IF EXISTS {DB_NAME}"))
        print("✓ Database dropped")
        
        print("Creating fresh database...")
        conn.execute(text(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
        print("✓ Database created")
        conn.commit()
    
    # Step 2: Reconnect and create tables
    print("\nCreating tables...")
    db_url = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    db_engine = create_engine(db_url)
    
    from database import Base
    from models import User, Resume, Interview, InterviewQuestion
    
    Base.metadata.create_all(bind=db_engine)
    print("✓ Tables created successfully!")
    
    print("\n✓✓✓ Database initialization complete! ✓✓✓")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
