# Build stage: Maven + JDK 21 -> Quarkus fast-jar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -q dependency:go-offline

COPY src ./src
RUN mvn -B -q -DskipTests package

# Runtime stage: slim JRE 21 with the Quarkus fast-jar layout
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

ENV LANG=C.UTF-8 \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75 -Djava.net.preferIPv4Stack=true"

COPY --from=build /workspace/target/quarkus-app/lib/      ./lib/
COPY --from=build /workspace/target/quarkus-app/*.jar     ./
COPY --from=build /workspace/target/quarkus-app/app/      ./app/
COPY --from=build /workspace/target/quarkus-app/quarkus/  ./quarkus/

EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar quarkus-run.jar"]
