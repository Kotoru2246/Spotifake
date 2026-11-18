@echo off
setlocal EnableDelayedExpansion

title Spotifake - Server Firewall Setup

echo ============================================================
echo   Spotifake - Windows Firewall Server Port Setup
echo ============================================================
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Administrative privileges required to configure firewall rules.
    echo [INFO] Requesting elevation...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo [1/3] Configuring Inbound Windows Firewall Rules...
echo.

REM Port 8000: Spotifake Web Backend & Stream
echo   [*] Configuring Port 8000 (Spotifake Web Backend & Stream)...
netsh advfirewall firewall delete rule name="Spotifake Web Backend (8000)" >nul 2>&1
netsh advfirewall firewall add rule name="Spotifake Web Backend (8000)" dir=in action=allow protocol=TCP localport=8000 >nul
if %errorLevel% equ 0 (
    echo       [OK] Port 8000 TCP inbound allowed.
) else (
    echo       [ERROR] Failed to add rule for Port 8000.
)

REM Port 9000: Spotifake Admin Dashboard
echo   [*] Configuring Port 9000 (Spotifake Admin Dashboard)...
netsh advfirewall firewall delete rule name="Spotifake Admin Dashboard (9000)" >nul 2>&1
netsh advfirewall firewall add rule name="Spotifake Admin Dashboard (9000)" dir=in action=allow protocol=TCP localport=9000 >nul
if %errorLevel% equ 0 (
    echo       [OK] Port 9000 TCP inbound allowed.
) else (
    echo       [ERROR] Failed to add rule for Port 9000.
)

REM Port 5000: Playlist Downloader & BackendAI
echo   [*] Configuring Port 5000 (Playlist Downloader & BackendAI)...
netsh advfirewall firewall delete rule name="Spotifake Downloader & AI (5000)" >nul 2>&1
netsh advfirewall firewall add rule name="Spotifake Downloader & AI (5000)" dir=in action=allow protocol=TCP localport=5000 >nul
if %errorLevel% equ 0 (
    echo       [OK] Port 5000 TCP inbound allowed.
) else (
    echo       [ERROR] Failed to add rule for Port 5000.
)

REM Port 3000: Essentia Audio Classifier
echo   [*] Configuring Port 3000 (Essentia Audio Classifier)...
netsh advfirewall firewall delete rule name="Spotifake Essentia Audio Classifier (3000)" >nul 2>&1
netsh advfirewall firewall add rule name="Spotifake Essentia Audio Classifier (3000)" dir=in action=allow protocol=TCP localport=3000 >nul
if %errorLevel% equ 0 (
    echo       [OK] Port 3000 TCP inbound allowed.
) else (
    echo       [ERROR] Failed to add rule for Port 3000.
)

echo.
echo [2/3] Local Network Interfaces & IPv4 Addresses:
echo ------------------------------------------------------------
powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object InterfaceAlias, IPAddress | Format-Table -AutoSize"
echo ------------------------------------------------------------

echo.
echo [3/3] Server Firewall Configuration Complete!
echo Other devices on your Wi-Fi, LAN, or VPN can now access:
echo   - Web App UI:   http://<Detected-IP>:8000
echo   - Downloader:   http://<Detected-IP>:5000/downloader
echo   - Essentia:     http://<Detected-IP>:3000/health
echo.
pause
