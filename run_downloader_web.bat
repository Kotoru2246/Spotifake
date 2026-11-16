@echo off
echo ============================================================
echo   Spotifake Auto-Downloader Web Service
echo   Listening on: http://0.0.0.0:5000/downloader
echo ============================================================
echo.
.\.venv\Scripts\python.exe -m uvicorn BackendAI.main:app --host 0.0.0.0 --port 5000

