# ============================================
# Stage 1: Build Spring Boot application
# ============================================
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

# Copy Maven wrapper and project configuration
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Make Maven wrapper executable
RUN chmod +x mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests -B


# ============================================
# Stage 2: Run Spring Boot application
# ============================================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy generated JAR
COPY --from=builder /app/target/*.jar app.jar

# Render's default port
EXPOSE 10000

# Start application
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT:-10000}"]
