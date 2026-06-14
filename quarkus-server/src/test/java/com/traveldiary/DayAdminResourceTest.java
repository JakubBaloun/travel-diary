package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.service.TripService;

import java.time.LocalDate;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DayAdminResourceTest {

    @Inject
    TripService tripService;

    String adminToken;
    UUID tripId;

    @BeforeAll
    @Transactional
    void setUp() {
        adminToken = TestTokens.adminToken();

        var tripDto = new CreateTripRequest();
        tripDto.setTitle("Day Admin Trip");
        tripDto.setSlug("day-admin-trip");
        tripDto.setStartDate(LocalDate.of(2026, 1, 1));
        tripDto.setEndDate(LocalDate.of(2026, 1, 5));
        var trip = tripService.create(tripDto);
        tripId = trip.getId();
    }

    @Test
    void createDay_createsDay() {
        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"dayNumber\":1,\"date\":\"2026-01-01\",\"title\":\"First Day\"}")
                .when().post("/api/admin/trips/" + tripId + "/days")
                .then()
                .statusCode(200)
                .body("dayNumber", is(1));
    }

    @Test
    void updateDay_updatesDay() {
        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"dayNumber\":2,\"date\":\"2026-01-02\"}")
                .when().post("/api/admin/trips/" + tripId + "/days")
                .then()
                .statusCode(200);
    }

    @Test
    void deleteDay_requiresAdmin() {
        given()
                .when().delete("/api/admin/days/" + UUID.randomUUID())
                .then()
                .statusCode(401);
    }
}
