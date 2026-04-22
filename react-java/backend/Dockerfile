# Multi-stage build for Spring Boot application with Gradle
# Build stage
FROM gradle:8.5-jdk17 AS build
WORKDIR /app

# Copy Gradle files first to leverage Docker layer caching
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon

# Copy source code and build
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Runtime stage - Production-ready image
FROM eclipse-temurin:17-jre-jammy

# Install Font-render libraries (required for JasperReports) and gosu for user switching
RUN apt-get update && apt-get install -y \
    libfreetype6 \
    fontconfig \
    fonts-dejavu \
    libxrender1 \
    libxtst6 \
    libxi6 \
    gosu \
 && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r spring && useradd -r -g spring spring

# Set working directory
WORKDIR /app

# Copy the JAR file from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create directories and set ownership before switching to non-root user
RUN mkdir -p /app/files \
    && mkdir -p /app/uploads \
    && mkdir -p /app/logs/SYS \
    && mkdir -p /app/tmp \
    && mkdir -p /app/data \
    && chown -R spring:spring /app/files \
    && chown -R spring:spring /app/uploads \
    && chown -R spring:spring /app/logs \
    && chown -R spring:spring /app/data \
    && chmod -R 777 /app/tmp \
    && chown spring:spring app.jar

# Keep as root for entrypoint to fix permissions on mounted volumes
# Entrypoint will switch to spring user before running the app
USER root

# Expose port (adjust if your app uses different port)
EXPOSE 8080

# Run the application via entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]