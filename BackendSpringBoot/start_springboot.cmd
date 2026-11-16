@echo off
set "JAVA_HOME=C:\Users\jacky\.tools\jdk\jdk21.0.12_12"
set "PATH=%JAVA_HOME%\bin;%PATH%"
java -Dspring.config.additional-location=file:./src/main/resources/application.properties -jar target\spotifake-backend-2.0.0.jar
