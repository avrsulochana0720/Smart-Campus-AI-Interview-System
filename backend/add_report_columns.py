import sys
from database import engine
from sqlalchemy import text, inspect

def run_migration():
    try:
        inspector = inspect(engine)
        if not inspector.has_table('interviews'):
            print("ERROR: Table 'interviews' does not exist.")
            return False
            
        columns = [c['name'] for c in inspector.get_columns('interviews')]
        print(f"Current columns in 'interviews' table: {columns}")
        
        with engine.begin() as conn:
            # Check and add 'report_path'
            if 'report_path' not in columns:
                print("Adding 'report_path' column...")
                conn.execute(text("ALTER TABLE interviews ADD COLUMN report_path VARCHAR(500) NULL"))
                print("OK: 'report_path' column added.")
            else:
                print("INFO: 'report_path' column already exists.")
                
            # Check and add 'report_url'
            if 'report_url' not in columns:
                print("Adding 'report_url' column...")
                conn.execute(text("ALTER TABLE interviews ADD COLUMN report_url VARCHAR(500) NULL"))
                print("OK: 'report_url' column added.")
            else:
                print("INFO: 'report_url' column already exists.")
                
        print("Database migration completed successfully.")
        return True
    except Exception as e:
        print(f"Error running database migration: {e}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
