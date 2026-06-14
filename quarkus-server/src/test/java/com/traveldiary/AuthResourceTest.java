package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
class AuthResourceTest {

    @Test
    void login_reader_valid_returnsToken() {
        given()
                .contentType("application/json")
                .body("{\"password\":\"test-reader-pass\"}")
                .when().post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue());
    }

    @Test
    void login_reader_invalid_returns401() {
        given()
                .contentType("application/json")
                .body("{\"password\":\"wrong\"}")
                .when().post("/api/auth/login")
                .then()
                .statusCode(401);
    }

    @Test
    void login_admin_valid_returnsToken() {
        given()
                .contentType("application/json")
                .body("{\"password\":\"test-admin-pass\"}")
                .when().post("/api/auth/admin/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue());
    }

    @Test
    void login_admin_invalid_returns401() {
        given()
                .contentType("application/json")
                .body("{\"password\":\"wrong\"}")
                .when().post("/api/auth/admin/login")
                .then()
                .statusCode(401);
    }
}
