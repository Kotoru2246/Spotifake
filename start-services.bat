@echo off
REM Start Spotifake Hybrid Services (Windows)
REM
REM This script starts both the Essentia.js Node service and Python FastAPI backend
REM Requirements: Node.js and Python must be installed and in PATH

echo.
echo ========================================
echo  Spotifake Hybrid Architecture Launcher
echo ========================================
echo.

REM Check if Node.js is installed
where /q node
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where /q python
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

REM Get script directory
set SCRIPT_DIR=%~dp0

echo [1/4] Checking Essentia Service directory...
if not exist "%SCRIPT_DIR%EssentiaService\" (
    echo [ERROR] EssentiaService directory not found
    pause
    exit /b 1
)

echo [2/4] Checking BackendAI directory...
if not exist "%SCRIPT_DIR%BackendAI\" (
    echo [ERROR] BackendAI directory not found
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Starting Services...
echo ========================================
echo.

REM Start Essentia Service in new window
echo [3/4] Starting Essentia.js Service (Node.js)...
echo        Port: 3000
start "Essentia.js Service" cmd /k "cd /d "%SCRIPT_DIR%EssentiaService" && npm install --silent && npm start"

REM Wait for Essentia service to start
timeout /t 5 /nobreak

REM Start Python Backend in new window
echo [4/4] Starting Python FastAPI Backend...
echo        Port: 8000
start "FastAPI Backend" cmd /k "cd /d "%SCRIPT_DIR%BackendAI" && python -m pip install -q -r requirements.txt && python start_backend.py"

echo.
echo ========================================
echo  Services Launched!
echo ========================================
echo.
echo [INFO] Two windows should have opened:
echo   1. "Essentia.js Service" - Node.js service on http://localhost:3000
echo   2. "FastAPI Backend" - Python backend on http://localhost:8000
echo.
echo [NEXT] Open another terminal to test:
echo   curl http://localhost:3000/health
echo   curl http://localhost:8000/health
echo.
echo [API DOCS] Once running, visit:
echo   FastAPI Docs: http://localhost:8000/docs
echo   Essentia API: http://localhost:3000/
echo.
echo [STOP] To stop services, close the two windows
echo.
pause
