@echo off
REM =====================================================
REM  Spotifake - Start Spring Boot Backend
REM =====================================================
cd /d "%~dp0BackendSpringBoot"
if not exist "target\spotifake-backend-2.0.0.jar" (
    call run_mvn.cmd package -DskipTests
)
call start_springboot.cmd
