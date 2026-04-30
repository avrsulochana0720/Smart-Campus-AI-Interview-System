import bcrypt
from passlib.context import CryptContext

# Monkeypatch bcrypt to truncate passwords to 72 bytes to avoid ValueError in newer versions
original_hashpw = bcrypt.hashpw
def hashed_hashpw(password, salt):
    if isinstance(password, str):
        password = password.encode('utf-8')
    if len(password) > 72:
        password = password[:72]
    return original_hashpw(password, salt)
bcrypt.hashpw = hashed_hashpw

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)
    print("Context initialized.")
    hashed = pwd_context.hash("password123")
    print(f"Success: {hashed[:10]}...")
    
    long_pwd = "a" * 100
    hashed_long = pwd_context.hash(long_pwd)
    print(f"Long Success: {hashed_long[:10]}...")
except Exception as e:
    print(f"Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
