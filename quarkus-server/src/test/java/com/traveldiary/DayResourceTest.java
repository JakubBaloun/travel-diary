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

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class DayResourceTest {

    @Inject
    TripService tripService;

    @Inject
    DayService dayService;

    String readerToken;
    String tripSlug;

    @BeforeAll
    @Transactional
    void setUp() {
        readerToken = TestTokens.readerToken();

        var tripDto = new CreateTripRequest();
        tripDto.setTitle("Day Resource Trip");
        tripDto.setSlug("day-resource-trip");
        tripDto.setStartDate(LocalDate.of(2025, 12, 1));
        tripDto.setEndDate(LocalDate.of(2025, 12, 3));
        var trip = tripService.create(tripDto);
        tripSlug = trip.getSlug();

        var dayDto = new CreateDayRequest();
        dayDto.setDayNumber(1);
        dayDto.setDate(LocalDate.of(2025, 12, 1));
        dayDto.setTitle("Arrival Day");
        dayService.create(trip.getId(), dayDto);
    }

    @Test
    void findByDayNumber_requiresAuth() {
        given()
                .when().get("/api/trips/" + tripSlug + "/days/1")
                .then()
                .statusCode(401);
    }

    @Test
    void findByDayNumber_withToken_returnsDay() {
        given()
                .auth().oauth2(readerToken)
                .when().get("/api/trips/" + tripSlug + "/days/1")
                .then()
                .statusCode(200)
                .body("dayNumber", is(1))
                .body("title", is("Arrival Day"));
    }

    @Test
    void findByDayNumber_notFound_returns404() {
        given()
                .auth().oauth2(readerToken)
                .when().get("/api/trips/" + tripSlug + "/days/999")
                .then()
                .statusCode(404);
    }
}
