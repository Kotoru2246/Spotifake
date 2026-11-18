@echo off
title Spotifake Backend Server
echo =====================================================
echo  Spotifake - Starting Spring Boot Backend
echo =====================================================
echo.

if exist "spotifake-backend-2.0.0.jar" (
    java -jar spotifake-backend-2.0.0.jar
) else if exist "BackendSpringBoot\target\spotifake-backend-2.0.0.jar" (
    java -jar BackendSpringBoot\target\spotifake-backend-2.0.0.jar
) else if exist "target\spotifake-backend-2.0.0.jar" (
    java -jar target\spotifake-backend-2.0.0.jar
) else (
    echo [ERROR] spotifake-backend-2.0.0.jar was not found!
    echo Current folder contains:
    dir /b
)
echo.
pause
