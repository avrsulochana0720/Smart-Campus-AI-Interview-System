from database import engine
from sqlalchemy import text

# Update resumes table schema
with engine.connect() as conn:
    # Check current columns
    result = conn.execute(text("DESCRIBE resumes"))
    existing_columns = [row[0] for row in result]
    
    print(f"Existing columns: {existing_columns}")
    
    # Add candidate_type column if it doesn't exist
    if 'candidate_type' not in existing_columns:
        conn.execute(text("ALTER TABLE resumes ADD COLUMN candidate_type VARCHAR(20)"))
        print("Added 'candidate_type' column")
    
    # Optionally drop the tags column if it exists
    if 'tags' in existing_columns:
        conn.execute(text("ALTER TABLE resumes DROP COLUMN tags"))
        print("Dropped 'tags' column")
    
    conn.commit()
    print("Database schema updated successfully")
