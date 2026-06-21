import sqlite3
conn = sqlite3.connect('backend_dev.db')
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = c.fetchall()
print('Tables:', tables)

if ('interviews',) in tables:
    c.execute('PRAGMA table_info(interviews)')
    print('Columns in interviews:', [r[1] for r in c.fetchall()])
    c.execute('SELECT job_role, COUNT(*) FROM interviews GROUP BY job_role')
    print('Roles:', c.fetchall())
