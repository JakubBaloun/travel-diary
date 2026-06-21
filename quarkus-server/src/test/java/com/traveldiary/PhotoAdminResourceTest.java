package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.traveldiary.entity.Photo;
import com.traveldiary.service.UploadService;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.nullValue;

@QuarkusTest
class PhotoAdminResourceTest {

    @Inject
    EntityManager em;

    @InjectMock
    UploadService uploadService;

    String adminToken;
    String readerToken;

    @BeforeEach
    @Transactional
    void reset() {
        em.createQuery("DELETE FROM Photo").executeUpdate();
        em.createQuery("DELETE FROM DayContent").executeUpdate();
        adminToken = TestTokens.adminToken();
        readerToken = TestTokens.readerToken();
    }

    @Test
    void updatePhoto_setsCaptionAndWide() {
        var id = seedPhoto(1);

        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"caption\":\"sunset\",\"wide\":true}")
                .when().patch("/api/admin/photos/" + id)
                .then().statusCode(200)
                .body("caption", equalTo("sunset"))
                .body("wide", is(true));
    }

    @Test
    void updatePhoto_clearCaption() {
        var id = seedPhoto(1);

        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"caption\":\"first\"}")
                .when().patch("/api/admin/photos/" + id)
                .then().statusCode(200)
                .body("caption", equalTo("first"));

        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"clearCaption\":true}")
                .when().patch("/api/admin/photos/" + id)
                .then().statusCode(200)
                .body("caption", nullValue());
    }

    @Test
    void deletePhoto_callsUploadServiceCleanup() {
        var id = seedPhoto(1);

        given().auth().oauth2(adminToken)
                .when().delete("/api/admin/photos/" + id)
                .then().statusCode(204);

        Mockito.verify(uploadService).deletePhoto(Mockito.contains("/photos/"));
    }

    @Test
    void deletePhoto_reader_returns401() {
        var id = seedPhoto(1);

        given().auth().oauth2(readerToken)
                .when().delete("/api/admin/photos/" + id)
                .then().statusCode(401);
    }

    @Transactional
    UUID seedPhoto(int dayNumber) {
        var p = new Photo();
        p.setDayNumber(dayNumber);
        var url = "https://b2/photos/" + UUID.randomUUID() + ".jpg";
        p.setUrl(url);
        p.setUrlMed(url.replace(".jpg", "-m.jpg"));
        p.setUrlThumb(url.replace(".jpg", "-t.jpg"));
        p.setWidth(1800);
        p.setHeight(1200);
        p.setSortOrder(0);
        em.persist(p);
        em.flush();
        return p.getId();
    }
}
