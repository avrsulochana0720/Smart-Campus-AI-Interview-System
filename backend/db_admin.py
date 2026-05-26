import argparse
import sys
import os
from sqlalchemy import text
try:
    from tabulate import tabulate
except ImportError:
    def tabulate(data, headers, tablefmt=None):
        header_str = " | ".join(map(str, headers))
        separator = "-" * len(header_str)
        rows = [" | ".join(map(str, row)) for row in data]
        return f"\n{header_str}\n{separator}\n" + "\n".join(rows)

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
from models import User, Interview, Resume

def check_status():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("\n[ONLINE] Database Server")
            print(f"Connection URL: {engine.url}")
            return True
    except Exception as e:
        print("\n[OFFLINE] Database Server")
        print(f"Error: {e}")
        return False

def list_users():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("\nNo users found.")
            return
        
        data = [[u.id, u.name, u.email] for u in users]
        print("\n--- Registered Users ---")
        print(tabulate(data, headers=["ID", "Name", "Email"], tablefmt="grid"))
    finally:
        db.close()

def list_interviews():
    db = SessionLocal()
    try:
        interviews = db.query(Interview).all()
        if not interviews:
            print("\nNo interviews found.")
            return
        
        data = [[i.id, i.user_id, i.job_role, i.company, i.status] for i in interviews]
        print("\n--- Interview Sessions ---")
        print(tabulate(data, headers=["ID", "User ID", "Role", "Company", "Status"], tablefmt="grid"))
    finally:
        db.close()

def clean_db():
    confirm = input("\nWARNING: This will delete ALL data. Are you sure? (y/N): ")
    if confirm.lower() == 'y':
        print("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        print("Recreating tables...")
        Base.metadata.create_all(bind=engine)
        print("Done! Database is now empty and clean.")
    else:
        print("Operation cancelled.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Database Admin Utility")
    parser.add_argument("--status", action="store_true", help="Check database connection status")
    parser.add_argument("--users", action="store_true", help="List all users")
    parser.add_argument("--interviews", action="store_true", help="List all interviews")
    parser.add_argument("--clean", action="store_true", help="Wipe and reset the database")

    args = parser.parse_args()

    if args.status:
        check_status()
    elif args.users:
        list_users()
    elif args.interviews:
        list_interviews()
    elif args.clean:
        clean_db()
    else:
        # Default to status and summary
        if check_status():
            db = SessionLocal()
            u_count = db.query(User).count()
            i_count = db.query(Interview).count()
            r_count = db.query(Resume).count()
            print(f"\nSummary:")
            print(f"- Users: {u_count}")
            print(f"- Interviews: {i_count}")
            print(f"- Resumes: {r_count}")
            db.close()
        parser.print_help()
