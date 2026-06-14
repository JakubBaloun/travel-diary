package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;

import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.service.TripService;

import java.time.LocalDate;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TripResourceTest {

    @Inject
    TripService tripService;

    String readerToken;

    @BeforeAll
    @Transactional
    void setUp() {
        readerToken = TestTokens.readerToken();

        var trip = new CreateTripRequest();
        trip.setTitle("Resource Test Trip");
        trip.setSlug("resource-test-trip");
        trip.setDescription("Test");
        trip.setStartDate(LocalDate.of(2025, 8, 1));
        trip.setEndDate(LocalDate.of(2025, 8, 5));
        tripService.create(trip);
    }

    @Test
    @Order(1)
    void findAll_requiresAuth() {
        given()
                .when().get("/api/trips")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void findAll_withValidToken_returnsTrips() {
        given()
                .auth().oauth2(readerToken)
                .when().get("/api/trips")
                .then()
                .statusCode(200);
    }

    @Test
    @Order(3)
    void findBySlug_returnsTrip() {
        given()
                .auth().oauth2(readerToken)
                .when().get("/api/trips/resource-test-trip")
                .then()
                .statusCode(200)
                .body("title", is("Resource Test Trip"));
    }

    @Test
    @Order(4)
    void findBySlug_notFound_returns404() {
        given()
                .auth().oauth2(readerToken)
                .when().get("/api/trips/nonexistent")
                .then()
                .statusCode(404);
    }
}
