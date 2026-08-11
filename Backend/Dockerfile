# ============================================
# Stage 1: Build the Spring Boot application
# ============================================
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Copy Maven wrapper and project configuration first
# This improves Docker build caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Make Maven wrapper executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy application source
COPY src ./src

# Build the Spring Boot JAR
RUN ./mvnw clean package -DskipTests -B


# ============================================
# Stage 2: Run the Spring Boot application
# ============================================
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the generated JAR from the builder
COPY --from=builder /app/target/*.jar app.jar

# Render uses the PORT environment variable
EXPOSE 10000

# Start Spring Boot
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-10000}"]