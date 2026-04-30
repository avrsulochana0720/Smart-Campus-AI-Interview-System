from passlib.context import CryptContext
import sys

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)
    print(f"Context initialized. Schemes: {pwd_context.schemes()}")
    hashed = pwd_context.hash("password123")
    print(f"Success: {hashed[:10]}...")
except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
