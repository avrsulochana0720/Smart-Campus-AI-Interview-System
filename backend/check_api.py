import sqlite3
import json

conn = sqlite3.connect('backend_dev.db')
c = conn.cursor()

c.execute("SELECT job_role, COUNT(*) as count FROM interviews GROUP BY job_role ORDER BY count DESC LIMIT 5")
role_stats = [{'role': row[0], 'count': row[1]} for row in c.fetchall()]

print("Backend query gives:", json.dumps(role_stats, indent=2))
