from database import engine
from sqlalchemy import text

# Add new classification columns to resumes table
with engine.connect() as conn:
    # Check current columns
    result = conn.execute(text("DESCRIBE resumes"))
    existing_columns = [row[0] for row in result]
    
    print(f"Existing columns: {existing_columns}")
    
    # Add new columns if they don't exist
    new_columns = [
        ("impact_score", "INT"),
        ("motive_score", "INT"),
        ("system_score", "INT"),
        ("classification_details", "TEXT")
    ]
    
    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            conn.execute(text(f"ALTER TABLE resumes ADD COLUMN {col_name} {col_type}"))
            print(f"Added '{col_name}' column")
    
    conn.commit()
    print("Database schema updated successfully")
