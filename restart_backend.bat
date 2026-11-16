@echo off
REM =====================================================
REM  Spotifake - Clean Backend Restart (Spring Boot)
REM =====================================================

echo.
echo [1/2] Stopping any running backend processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul
echo       Done.

echo [2/2] Starting Spotifake Spring Boot backend on http://127.0.0.1:8000 ...
echo.
cd /d "%~dp0BackendSpringBoot"
if not exist "target\spotifake-backend-2.0.0.jar" (
    call run_mvn.cmd package -DskipTests
)
call start_springboot.cmd
