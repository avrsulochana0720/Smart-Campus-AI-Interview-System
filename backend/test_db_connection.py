from database import test_connection

if __name__ == "__main__":
    print("Testing MySQL connection...")
    if test_connection():
        print("Success! Your FastAPI app can connect to MySQL (XAMPP).")
    else:
        print("Failure. Please check if XAMPP (MySQL) is running and your .env credentials are correct.")
