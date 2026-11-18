@echo off
if not defined JAVA_HOME (
    if exist "C:\Users\jacky\.tools\jdk\jdk21.0.12_12" set "JAVA_HOME=C:\Users\jacky\.tools\jdk\jdk21.0.12_12"
)
if not defined M2_HOME (
    if exist "C:\Users\jacky\.tools\mvn\apache-maven-3.9.6" set "M2_HOME=C:\Users\jacky\.tools\mvn\apache-maven-3.9.6"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
if defined M2_HOME set "PATH=%M2_HOME%\bin;%PATH%"
call mvn %*
