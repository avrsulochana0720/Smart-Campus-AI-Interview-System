param(
    [string]$Port = "8000",
    [string]$Host = "0.0.0.0"
)

$venv = Join-Path $PSScriptRoot "venv"
if (-not (Test-Path $venv)) {
    python -m venv $venv
}

# Ensure pip and requirements are installed
& "$venv\Scripts\python.exe" -m pip install --upgrade pip
& "$venv\Scripts\python.exe" -m pip install -r "$PSScriptRoot\requirements.txt"

# Run uvicorn
& "$venv\Scripts\python.exe" -m uvicorn main:app --reload --host $Host --port $Port
