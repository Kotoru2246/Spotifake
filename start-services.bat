@echo off
REM Start Spotifake Hybrid Services (Windows)
REM
REM This script starts both the Essentia.js service and Spring Boot backend

echo.
echo ========================================
echo  Spotifake Hybrid Architecture Launcher
echo ========================================
echo.

REM Check if Node.js is installed (for EssentiaService)
where /q node
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH ^(required for EssentiaService^)
    echo Please install Node.js from https://nodejs.org/
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

echo [2/4] Checking BackendSpringBoot directory...
if not exist "%SCRIPT_DIR%BackendSpringBoot\" (
    echo [ERROR] BackendSpringBoot directory not found
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Starting Services...
echo ========================================
echo.

REM Start Essentia Service in new window
echo [3/4] Starting Essentia.js Service...
echo        Port: 3000
start "Essentia.js Service" cmd /k "cd /d "%SCRIPT_DIR%EssentiaService" && npm install --silent && npm start"

REM Wait for Essentia service to start
timeout /t 5 /nobreak

REM Start Spring Boot Backend in new window
echo [4/4] Starting Spring Boot Backend...
echo        Port: 8000
start "Spring Boot Backend" cmd /k "cd /d "%SCRIPT_DIR%BackendSpringBoot" && call start_springboot.cmd"

echo.
echo ========================================
echo  Services Launched!
echo ========================================
echo.
echo [INFO] Two windows should have opened:
echo   1. "Essentia.js Service" - Essentia service on http://localhost:3000
echo   2. "Spring Boot Backend" - Spotifake backend on http://localhost:8000
echo.
echo [NEXT] Open another terminal to test:
echo   curl http://localhost:3000/health
echo   curl http://localhost:8000/
echo.
echo [STOP] To stop services, close the two windows
echo.
pause
