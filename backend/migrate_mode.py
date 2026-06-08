from database import engine, text

def add_mode_column():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE interviews ADD COLUMN mode VARCHAR(50) DEFAULT 'Practice'"))
            print("Successfully added mode column.")
        except Exception as e:
            if 'Duplicate column name' in str(e):
                print("Column 'mode' already exists.")
            else:
                print(f"Error: {e}")

if __name__ == "__main__":
    add_mode_column()
