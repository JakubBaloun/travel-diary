package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import com.traveldiary.dto.CreateDayRequest;
import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.service.DayService;
import com.traveldiary.service.TripService;

import java.time.LocalDate;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EntryAdminResourceTest {

    @Inject
    TripService tripService;

    @Inject
    DayService dayService;

    String adminToken;
    UUID dayId;

    @BeforeAll
    @Transactional
    void setUp() {
        adminToken = TestTokens.adminToken();

        var tripDto = new CreateTripRequest();
        tripDto.setTitle("Entry Admin Trip");
        tripDto.setSlug("entry-admin-trip");
        tripDto.setStartDate(LocalDate.of(2026, 2, 1));
        tripDto.setEndDate(LocalDate.of(2026, 2, 3));
        var trip = tripService.create(tripDto);

        var dayDto = new CreateDayRequest();
        dayDto.setDayNumber(1);
        dayDto.setDate(LocalDate.of(2026, 2, 1));
        var day = dayService.create(trip.getId(), dayDto);
        dayId = day.getId();
    }

    @Test
    void createTextEntry_createsEntry() {
        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"type\":\"text\",\"content\":\"Test entry\"}")
                .when().post("/api/admin/days/" + dayId + "/entries")
                .then()
                .statusCode(200)
                .body("content", is("Test entry"));
    }

    @Test
    void createPhotoEntry_withoutFile_returns400() {
        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"type\":\"photo\"}")
                .when().post("/api/admin/days/" + dayId + "/entries")
                .then()
                .statusCode(400);
    }

    @Test
    void updateEntry_updatesContent() {
        var createResp = given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"type\":\"text\",\"content\":\"Original\"}")
                .when().post("/api/admin/days/" + dayId + "/entries")
                .then()
                .statusCode(200)
                .extract().path("id");

        given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"content\":\"Updated\"}")
                .when().patch("/api/admin/entries/" + createResp)
                .then()
                .statusCode(200)
                .body("content", is("Updated"));
    }

    @Test
    void deleteEntry_removesEntry() {
        var createResp = given()
                .auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"type\":\"text\",\"content\":\"Delete me\"}")
                .when().post("/api/admin/days/" + dayId + "/entries")
                .then()
                .statusCode(200)
                .extract().path("id");

        given()
                .auth().oauth2(adminToken)
                .when().delete("/api/admin/entries/" + createResp)
                .then()
                .statusCode(204);
    }
}
