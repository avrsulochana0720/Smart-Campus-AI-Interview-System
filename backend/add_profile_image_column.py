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
    with engine.connect() as connection:
        connection.execute(text("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) NULL"))
        connection.commit()
        print("Successfully added profile_image column to MySQL")
except Exception as e:
    print(f"Failed to update MySQL: {e}")
    # Fallback to SQLite
    try:
        import sqlite3
        conn = sqlite3.connect('app_users.db')
        conn.execute('ALTER TABLE users ADD COLUMN profile_image TEXT')
        conn.commit()
        conn.close()
        print("Successfully added profile_image column to SQLite")
    except Exception as se:
        print(f"Failed to update SQLite: {se}")
