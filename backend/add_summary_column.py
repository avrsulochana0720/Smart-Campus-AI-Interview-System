from database import engine
from sqlalchemy import text

def add_summary_column():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE interviews ADD COLUMN summary TEXT"))
            conn.commit()
            print("Successfully added summary column to interviews table.")
    except Exception as e:
        print(f"Error or column might already exist: {e}")

if __name__ == "__main__":
    add_summary_column()
