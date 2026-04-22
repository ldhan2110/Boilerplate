# Spring Boot Backend

## Prerequisites

- Java 17 or above
- Gradle (or use the Gradle wrapper)

## Setup

1. Clone the repository:
```bash
git clone http://10.0.0.201/ldhan2110999/springboot.git

cd springboot
```
2. (Optional) Configure application properties in `src/main/resources/application.properties`.

## Running the Application

Using Gradle wrapper:
```bash
./gradlew bootRun
```
Or using Gradle directly:
```bash
gradle bootRun
```
## Building the Application
To build the application, run:
```bash
./gradlew build
```
Or using Gradle directly:
```bash
gradle build
```
## Testing
To run tests, execute:
```bash
./gradlew test
```
Or using Gradle directly:
```bash
gradle test
```
## Accessing the Application
Once the application is running, you can access it at:
```
http://localhost:9000
```
    
## API Documentation
API documentation is available at:
```
http://localhost:9000/swagger-ui/index.html
```
## Database Configuration
Ensure your database is configured correctly in `src/main/resources/application.properties`. The default configuration uses an H2 in-memory database for development.
For production, you may want to configure a different database (e.g., MySQL, Postgre
greSQL) and update the connection properties accordingly.
## Environment Variables
You can set environment variables for sensitive information like database credentials. For example:
```bash
export SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/mydb
export SPRING_DATASOURCE_USERNAME=myuser
export SPRING_DATASOURCE_PASSWORD=mypassword
```
These can be set in your terminal or in your deployment environment.

## Jasper Reports
Download link: [Jasper Reports](https://community.jaspersoft.com/download-jaspersoft/community-edition/)

Version Compatibility: 7.0.3

If you are using Jasper Reports, ensure that the necessary dependencies are included in your `build.gradle
` file. You can generate reports using the provided templates and access them via the API endpoints.