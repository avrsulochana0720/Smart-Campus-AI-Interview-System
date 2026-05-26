# Database Server Guide

This project uses **MySQL** (via XAMPP or Docker) as the primary database. SQLite is no longer supported to ensure data consistency.

## 1. Running the Database Server

### Option A: Using XAMPP (Recommended for Windows)
1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**.
3. Ensure the port is `3306`.
4. Your `.env` file should look like this:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=smart_campus_interview
   ```

### Option B: Using Docker (Professional/Isolated)
If you have Docker installed, you can run a dedicated MySQL server with one command:
```bash
docker-compose up -d
```
This will start a MySQL 8.0 container configured exactly for this project.

---

## 2. Database Management Tools

We have provided a utility script to help you manage your database server.

### Initialize / Reset Database
To create the database and all required tables:
```bash
cd backend
python setup_mysql.py
```

### Database Admin CLI
We have created a new tool `db_admin.py` to view and manage your data:
```bash
cd backend
python db_admin.py --status    # Check connection status
python db_admin.py --users     # List all registered users
python db_admin.py --interviews # List all interviews
python db_admin.py --clean     # (CAUTION) Wipe and recreate all tables
```

---

## 3. Connection Troubleshooting
- **Connection Refused**: Ensure MySQL is started in XAMPP or Docker.
- **Access Denied**: Double check `DB_USER` and `DB_PASSWORD` in `.env`.
- **Database Not Found**: Run `python setup_mysql.py` to create the database.
