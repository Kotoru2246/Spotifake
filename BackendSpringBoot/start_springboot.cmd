@echo off
where java >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Users\jacky\.tools\jdk\jdk21.0.12_12" (
        set "JAVA_HOME=C:\Users\jacky\.tools\jdk\jdk21.0.12_12"
        set "PATH=%JAVA_HOME%\bin;%PATH%"
    ) else (
        echo [ERROR] Java not found. Please install Java 21:
        echo        Run in PowerShell: winget install EclipseAdoptium.Temurin.21.JRE
        echo.
        pause
        exit /b 1
    )
)
java -Dspring.config.additional-location=file:./src/main/resources/application.properties -jar target\spotifake-backend-2.0.0.jar
