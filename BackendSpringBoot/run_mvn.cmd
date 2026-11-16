@echo off
set "JAVA_HOME=C:\Users\jacky\.tools\jdk\jdk21.0.12_12"
set "M2_HOME=C:\Users\jacky\.tools\mvn\apache-maven-3.9.6"
set "PATH=%JAVA_HOME%\bin;%M2_HOME%\bin;%PATH%"
call mvn %*
