# Root-level Dockerfile for Render deployment
# Build context is the repo root

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY jyoti-sales-backend/pom.xml .
RUN mvn -B dependency:go-offline -q
COPY jyoti-sales-backend/src ./src
RUN mvn -B clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
