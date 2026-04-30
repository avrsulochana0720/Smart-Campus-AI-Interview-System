from sqlalchemy import text
from database import engine

def update_schema():
    """Add impact, system, and motive columns to resumes table"""
    print("Updating database schema...")
    try:
        with engine.connect() as conn:
            # Check existing columns
            result = conn.execute(text("PRAGMA table_info(resumes)"))
            columns = [row[1] for row in result.fetchall()]
            print(f"Current columns: {columns}")
            
            # Add missing columns
            new_columns = {
                'impact': 'TEXT',
                'system': 'TEXT',
                'motive': 'TEXT'
            }
            
            for col_name, col_type in new_columns.items():
                if col_name not in columns:
                    print(f"Adding column {col_name}...")
                    conn.execute(text(f"ALTER TABLE resumes ADD COLUMN {col_name} {col_type}"))
                    print(f"Column {col_name} added.")
                else:
                    print(f"Column {col_name} already exists.")
            
            conn.commit()
            print("Database schema updated successfully!")
            return True
    except Exception as e:
        print(f"Error updating schema: {e}")
        return False

if __name__ == "__main__":
    update_schema()
