# Multi-stage Dockerfile for Spotifake Spring Boot Backend
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and package
COPY src ./src
RUN mvn clean package -DskipTests

# Production runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create directory for uploads and database
RUN mkdir -p /app/uploads /app/music

# Copy built JAR artifact from builder
COPY --from=builder /build/target/spotifake-backend-2.0.0.jar app.jar

# Expose Player (8000), Admin (9000) and metrics (8081) ports
EXPOSE 8000 9000 8081

# Set environment variables
ENV SPRING_PROFILES_ACTIVE=prod \
    SPRING_THYMELEAF_PREFIX=classpath:/templates/ \
    SPRING_DATASOURCE_URL=jdbc:sqlite:/app/backendai.db \
    APP_DB_PATH=/app/backendai.db

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
