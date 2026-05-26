@echo off
set PORT=8000
set HOST=0.0.0.0

if not exist "%~dp0venv\" (
    python -m venv "%~dp0venv"
)
"%~dp0venv\Scripts\python.exe" -m pip install --upgrade pip
"%~dp0venv\Scripts\python.exe" -m pip install -r "%~dp0requirements.txt"
"%~dp0venv\Scripts\python.exe" -m uvicorn main:app --reload --host %HOST% --port %PORT%
