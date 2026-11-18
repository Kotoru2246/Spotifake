@echo off
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Users\jacky\.tools\jdk\jdk21.0.12_12" (
        set "JAVA_HOME=C:\Users\jacky\.tools\jdk\jdk21.0.12_12"
        set "PATH=%JAVA_HOME%\bin;%PATH%"
    ) else (
        echo.
        echo ============================================================
        echo [ERROR] Java 21 was not found on this computer!
        echo.
        echo To install Java 21, open PowerShell and run:
        echo    winget install EclipseAdoptium.Temurin.21.JRE
        echo ============================================================
        echo.
        pause
        exit /b 1
    )
)

set "CONFIG_OPT="
if exist "src\main\resources\application.properties" (
    set "CONFIG_OPT=-Dspring.config.additional-location=file:./src/main/resources/application.properties"
)

echo Starting Spotifake Spring Boot Server...
java %CONFIG_OPT% -jar target\spotifake-backend-2.0.0.jar
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Backend exited with error code %ERRORLEVEL%.
)
pause
