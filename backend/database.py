from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database configuration from .env
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "smart_campus_interview")

# MySQL database URL
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Try to create a MySQL engine; if it fails, fall back to a local SQLite file for development.
try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    # Test connection immediately
    with engine.connect() as connection:
        print(f"Successfully connected to MySQL database: {DB_NAME}")
except Exception as e:
    print(f"WARNING: Failed to connect to MySQL: {e}")
    print("Falling back to local SQLite database for development (./backend_dev.db).")
    SQLITE_URL = f"sqlite:///./backend_dev.db"
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

# Create a session class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"Database connection test failed: {e}")
        return False
