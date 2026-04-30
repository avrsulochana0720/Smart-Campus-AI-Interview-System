from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
try:
    long_password = "a" * 100
    hashed = pwd_context.hash(long_password)
    print("Success")
except Exception as e:
    print(f"Error: {str(e)}")
