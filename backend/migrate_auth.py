from database import engine, text

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(50) DEFAULT NULL;"))
            print("Added phone_number column")
        except Exception as e:
            print(f"phone_number column might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN auth_method VARCHAR(50) DEFAULT 'email';"))
            print("Added auth_method column")
        except Exception as e:
            print(f"auth_method column might already exist: {e}")
            
        conn.commit()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
