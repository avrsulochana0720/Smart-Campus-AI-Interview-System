#!/usr/bin/env python
"""
Fix MySQL tablespace corruption
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
        # Fix corrupted innodb
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        
        # Try to recover innodb
        print("Attempting to rebuild InnoDB...")
        conn.execute(text("ALTER TABLE mysql.innodb_table_stats engine=InnoDB"))
        conn.execute(text("ALTER TABLE mysql.innodb_index_stats engine=InnoDB"))
        
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
        conn.commit()
        
    print("✓ MySQL repair commands executed")
    print("\nNow restart MySQL in XAMPP Control Panel:")
    print("1. Click 'Stop' for MySQL")
    print("2. Click 'Start' for MySQL")
    print("3. Then run: python setup_mysql.py")
    
except Exception as e:
    print(f"Error: {e}")
