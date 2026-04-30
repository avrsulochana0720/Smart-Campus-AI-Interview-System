from database import engine
from sqlalchemy import text

# Add missing columns to resumes table
with engine.connect() as conn:
    # Check if columns exist first
    result = conn.execute(text("DESCRIBE resumes"))
    existing_columns = [row[0] for row in result]
    
    print(f"Existing columns: {existing_columns}")
    
    # Add missing columns
    if 'name' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN name VARCHAR(255)"))
        print("Added 'name' column")
    
    if 'education' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN education VARCHAR(255)"))
        print("Added 'education' column")
    
    if 'tags' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN tags VARCHAR(255)"))
        print("Added 'tags' column")
    
    conn.commit()
    print("Database schema updated successfully")
