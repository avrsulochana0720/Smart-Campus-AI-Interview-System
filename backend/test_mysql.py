import pymysql
import sys

try:
    conn = pymysql.connect(
        host='localhost',
        user='root',
        password='',
        port=3306
    )
    print("Successfully connected to MySQL!")
    conn.close()
except Exception as e:
    print(f"Failed to connect: {e}")
    sys.exit(1)
