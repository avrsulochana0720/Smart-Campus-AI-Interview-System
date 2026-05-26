# Running the backend server (development)

Quick steps to run the FastAPI backend on Windows (development):

PowerShell (recommended):

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\run_server.ps1
```

Command prompt / double-clickable batch:

```bat
cd backend
.\run_server.bat
```

Manual (cross-platform):

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# or: source venv/bin/activate  # macOS / Linux
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Notes:
- The scripts create a `venv` inside `backend` if one does not exist and install `requirements.txt`.
- If PowerShell blocks script execution, run PowerShell as Administrator and set `ExecutionPolicy` or use the provided command which bypasses policy for this script.
- Database fallback: if the app cannot connect to your configured MySQL server, it will automatically fall back to a local SQLite file `backend_dev.db` so the server can start for development. To use MySQL, provide a `.env` with `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` and ensure your MySQL server is running.

Example `.env` (place in `backend/`):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=smart_campus_interview
```
