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
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TripAdminResourceTest {

    @Inject
    TripService tripService;

    String adminToken;
    String readerToken;
    UUID tripId;

    @BeforeAll
    @Transactional
    void setUp() {
        adminToken = TestTokens.adminToken();
        readerToken = TestTokens.readerToken();

        var trip = new CreateTripRequest();
        trip.setTitle("Admin Test Trip");
        trip.setSlug("admin-test-trip");
        trip.setStartDate(LocalDate.of(2025, 9, 1));
        trip.setEndDate(LocalDate.of(2025, 9, 5));
        var created = tripService.create(trip);
        tripId = created.getId();
    }

    @Test
    @Order(1)
    void create_requiresAdminAuth() {
        given()
                .auth().oauth2(readerToken)
                .contentType("application/json")
                .body("{\"title\":\"x\",\"slug\":\"x\",\"startDate\":\"2025-01-01\",\"endDate\":\"2025-01-02\"}")
                .when().post("/api/admin/trips")
                .then()
                .statusCode(401);
    }

    @Test
    @Order(2)
    void create_withAdmin_createsTrip() {
        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"title\":\"New Trip\",\"slug\":\"new-trip\",\"startDate\":\"2025-10-01\",\"endDate\":\"2025-10-05\"}")
                .when().post("/api/admin/trips")
                .then()
                .statusCode(200)
                .body("title", is("New Trip"));
    }

    @Test
    @Order(3)
    void findOne_returnsTrip() {
        given()
                .auth().oauth2(adminToken)
                .when().get("/api/admin/trips/" + tripId)
                .then()
                .statusCode(200)
                .body("title", is("Admin Test Trip"));
    }

    @Test
    @Order(4)
    void update_updatesTrip() {
        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"title\":\"Updated Admin Trip\"}")
                .when().patch("/api/admin/trips/" + tripId)
                .then()
                .statusCode(200)
                .body("title", is("Updated Admin Trip"));
    }

    @Test
    @Order(5)
    void delete_removesTrip() {
        var dto = new CreateTripRequest();
        dto.setTitle("Delete Me");
        dto.setSlug("delete-me-trip");
        dto.setStartDate(LocalDate.of(2025, 11, 1));
        dto.setEndDate(LocalDate.of(2025, 11, 2));
        var created = tripService.create(dto);

        given()
                .auth().oauth2(adminToken)
                .when().delete("/api/admin/trips/" + created.getId())
                .then()
                .statusCode(204);
    }
}
