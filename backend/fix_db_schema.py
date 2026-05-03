import sqlite3
import os

db_path = 'app_users.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Fix users table
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'name' not in columns:
            print("Adding 'name' column to 'users'...")
            cursor.execute("ALTER TABLE users ADD COLUMN name TEXT DEFAULT 'User'")
        
        # Fix interviews table
        cursor.execute("PRAGMA table_info(interviews)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'summary' not in columns:
            print("Adding 'summary' column to 'interviews'...")
            cursor.execute("ALTER TABLE interviews ADD COLUMN summary TEXT")
        
        conn.commit()
        print("Schema update completed successfully.")
            
    except Exception as e:
        print(f"Error checking/updating table: {e}")
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")
