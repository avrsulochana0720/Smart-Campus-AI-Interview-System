import sqlite3

def check_database(db_name):
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\n=== Database: {db_name} ===")
    print(f"Tables: {tables}\n")
    
    # Show structure of each table
    for table in tables:
        print(f"--- Table: {table} ---")
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
        print()
    
    conn.close()

if __name__ == "__main__":
    check_database("app_users.db")
    try:
        check_database("smart_campus_interview.db")
    except Exception as e:
        print(f"Error checking smart_campus_interview.db: {e}")
    try:
        check_database("users.db")
    except Exception as e:
        print(f"Error checking users.db: {e}")
