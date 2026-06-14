package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectSpy;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.Mockito;

import com.traveldiary.service.UploadService;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UploadResourceTest {

    String adminToken;
    String readerToken;

    @InjectSpy
    UploadService uploadService;

    @BeforeAll
    void setUp() {
        adminToken = TestTokens.adminToken();
        readerToken = TestTokens.readerToken();
    }

    @Test
    void upload_requiresAdmin() {
        given()
                .auth().oauth2(readerToken)
                .when().post("/api/admin/upload")
                .then()
                .statusCode(401);
    }

    @Test
    void upload_withoutFile_returns400() {
        Mockito.doReturn("https://example.com/photo.jpg").when(uploadService)
                .uploadPhoto(Mockito.any(), Mockito.any(), Mockito.any());

        given()
                .auth().oauth2(adminToken)
                .when().post("/api/admin/upload")
                .then()
                .statusCode(400);
    }

    @Test
    void upload_withFile_returnsUrl() {
        Mockito.doReturn("https://example.com/photo.jpg").when(uploadService)
                .uploadPhoto(Mockito.any(), Mockito.any(), Mockito.any());

        given()
                .auth().oauth2(adminToken)
                .multiPart("photo", "test.jpg", "fake-image-content".getBytes(), "image/jpeg")
                .when().post("/api/admin/upload")
                .then()
                .statusCode(200)
                .body("url", notNullValue());
    }
}
