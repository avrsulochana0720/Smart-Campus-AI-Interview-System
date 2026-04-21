from database import SessionLocal
from models import User

db = SessionLocal()
user = db.query(User).filter(User.email == 'avr1@gmail.com').first()
if user:
    print(f'User exists: {user.email}, ID: {user.id}')
    print(f'Password hash: {user.password}')
else:
    print('User not found')
db.close()
