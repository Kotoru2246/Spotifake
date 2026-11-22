@echo off
title Spotifake Mobile Stream - Cloudflare Tunnel
echo ========================================================
echo  Starting Spotifake Mobile Cloudflare Stream Tunnel...
echo ========================================================
echo.
echo Forwarding port 8000 to Cloudflare's secure public network...
echo Look for the https://....trycloudflare.com URL below:
echo.
rem cloudflared.exe lives outside the repo; override with the CLOUDFLARED env var.
if not defined CLOUDFLARED set "CLOUDFLARED=C:\Users\jacky\SpotifakeArchive\cloudflared.exe"
"%CLOUDFLARED%" tunnel --url http://127.0.0.1:8000
pause
