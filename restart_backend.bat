@echo off
REM =====================================================
REM  Spotifake - Clean Backend Restart
REM  Kills ALL old Python processes, then starts fresh.
REM =====================================================

echo.
echo [1/2] Stopping any running Python backend processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM python3.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Done.

echo [2/2] Starting FastAPI backend on http://127.0.0.1:8000 ...
echo.
python start_backend.py
