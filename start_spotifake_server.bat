@echo off
setlocal EnableDelayedExpansion

title Spotifake - Dedicated Server Launcher

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/4] Detecting Local Network IPv4 Address...
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "((Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -ExpandProperty IPv4Address | Select-Object -ExpandProperty IPAddress -First 1), (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -match 'Wi-Fi|Ethernet' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -ExpandProperty IPAddress -First 1), '127.0.0.1' | Where-Object { $_ } | Select-Object -First 1)"`) do (
    set "SERVER_IP=%%i"
)

if "%SERVER_IP%"=="" set "SERVER_IP=127.0.0.1"

cls
echo ===============================================================================
echo   ____              _   _  __       _          ____                              
echo  / ___| _ __   ___ | |_(_)/ _| __ _| | _____  / ___|  ___ _ ____   _____ _ __    
echo  \___ \| '_ \ / _ \| __| | |_ / _` | |/ / _ \ \___ \ / _ \ '__\ \ / / _ \ '__|   
echo   ___) | |_) | (_) | |_| |  _| (_| |   <  __/  ___) |  __/ |   \ V /  __/ |      
echo  |____/| .__/ \___/ \__|_|_|  \__,_|_|\_\___| |____/ \___|_|    \_/ \___|_|      
echo        |_|                                                                       
echo ===============================================================================
echo.
echo   Dedicated Music Server is Online!
echo.
echo   [Web App & Stream]   : http://%SERVER_IP%:8000
echo   [Downloader Web UI]  : http://%SERVER_IP%:5000/downloader
echo   [Essentia Health]    : http://%SERVER_IP%:3000/health
echo.
echo   * Connect other phones, laptops, and tablets on the same Wi-Fi / VPN to
echo     the URLs listed above!
echo   * Run setup_server_firewall.bat once as Admin if devices cannot connect.
echo.
echo ===============================================================================
echo.

echo [2/4] Starting Essentia Audio Classifier in background (Port 3000)...
start "Spotifake Essentia Service" cmd /k "cd /d "%SCRIPT_DIR%EssentiaService" && npm start"

echo [3/4] Starting Playlist Downloader Service in background (Port 5000)...
start "Spotifake Downloader & AI" cmd /k "cd /d "%SCRIPT_DIR%" && .\.venv\Scripts\python.exe -m uvicorn BackendAI.main:app --host 0.0.0.0 --port 5000"

echo [4/4] Starting Spotifake Spring Boot Web Backend (Port 8000)...
echo.
cd /d "%SCRIPT_DIR%BackendSpringBoot"
if not exist "target\spotifake-backend-2.0.0.jar" (
    echo [INFO] spotifake-backend-2.0.0.jar not found. Building now...
    call run_mvn.cmd package -DskipTests
)
call start_springboot.cmd
