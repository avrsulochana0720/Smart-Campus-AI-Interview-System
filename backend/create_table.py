import os
from dotenv import load_dotenv
import sqlalchemy
from sqlalchemy import create_engine, text

load_dotenv()
DB_HOST=os.getenv('DB_HOST', 'localhost')
DB_PORT=os.getenv('DB_PORT', '3306')
DB_USER=os.getenv('DB_USER', 'root')
DB_PASSWORD=os.getenv('DB_PASSWORD', '')
DB_NAME=os.getenv('DB_NAME', 'smart_campus_interview')

engine = create_engine(f'mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

with engine.connect() as conn:
    conn.execute(text("CREATE TABLE IF NOT EXISTS scheduled_interviews (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, job_role VARCHAR(200) NOT NULL, company VARCHAR(200) NOT NULL, scheduled_time DATETIME NOT NULL, status VARCHAR(50) DEFAULT 'scheduled', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id));"))
    conn.commit()
    print("Table created successfully")
