package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.InjectMock;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.traveldiary.entity.DayContent;
import com.traveldiary.entity.Photo;
import com.traveldiary.service.UploadService;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;

@QuarkusTest
class DayAdminResourceTest {

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
    void summary_admin_seesHeroThumbEvenForUnpublishedDay() {
        seedUnpublishedDayWithPhoto(3, "https://b2/photos/x.jpg");

        given().auth().oauth2(adminToken)
                .when().get("/api/admin/days/summary")
                .then().statusCode(200)
                .body("find { it.dayNumber == 3 }.published", is(false))
                .body("find { it.dayNumber == 3 }.heroThumbUrl",
                        equalTo("https://b2/photos/x-thumb.jpg"));
    }

    @Test
    void summary_reader_isForbidden() {
        given().auth().oauth2(readerToken)
                .when().get("/api/admin/days/summary")
                .then().statusCode(401);
    }

    @Test
    void updateDay_createsContentRow() {
        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"story\":\"prvni den\",\"published\":true,\"highlight\":false}")
                .when().put("/api/admin/days/4")
                .then().statusCode(200)
                .body("dayNumber", is(4))
                .body("story", is("prvni den"))
                .body("published", is(true));
    }

    @Test
    void updateDay_reader_returns401() {
        given().auth().oauth2(readerToken)
                .contentType("application/json")
                .body("{\"published\":true}")
                .when().put("/api/admin/days/4")
                .then().statusCode(401);
    }

    @Test
    void updateDay_setHeroToForeignDayPhoto_returns400() {
        var foreignPhotoId = seedPhotoForDay(5);

        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"heroPhotoId\":\"" + foreignPhotoId + "\"}")
                .when().put("/api/admin/days/6")
                .then().statusCode(400);
    }

    @Test
    void uploadPhoto_multipart_persistsPhotoEntity() {
        Mockito.when(uploadService.uploadPhoto(any(), any(), any()))
                .thenReturn(new UploadService.UploadResult(
                        "https://b2/photos/new.jpg",
                        "https://b2/photos/new-m.jpg",
                        "https://b2/photos/new-t.jpg",
                        1800, 1200));

        given().auth().oauth2(adminToken)
                .multiPart("photo", "test.jpg", new byte[]{1, 2, 3}, "image/jpeg")
                .multiPart("caption", "Paul Revere statue")
                .when().post("/api/admin/days/7/photos")
                .then().statusCode(200)
                .body("dayNumber", is(7))
                .body("url", equalTo("https://b2/photos/new.jpg"))
                .body("urlMed", equalTo("https://b2/photos/new-m.jpg"))
                .body("urlThumb", equalTo("https://b2/photos/new-t.jpg"))
                .body("width", is(1800))
                .body("caption", equalTo("Paul Revere statue"))
                .body("sortOrder", is(0));
    }

    @Test
    void uploadPhoto_withoutFile_returns400() {
        given().auth().oauth2(adminToken)
                .multiPart("caption", "no photo")
                .when().post("/api/admin/days/7/photos")
                .then().statusCode(400);
    }

    @Test
    void uploadPhoto_reader_returns401() {
        given().auth().oauth2(readerToken)
                .multiPart("photo", "test.jpg", new byte[]{1}, "image/jpeg")
                .when().post("/api/admin/days/7/photos")
                .then().statusCode(401);
    }

    @Test
    void reorder_setsSortOrderAtomic() {
        var a = seedPhotoForDay(8);
        var b = seedPhotoForDay(8);
        var c = seedPhotoForDay(8);

        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"order\":[\"" + c + "\",\"" + a + "\",\"" + b + "\"]}")
                .when().put("/api/admin/days/8/photos/order")
                .then().statusCode(204);

        given().auth().oauth2(adminToken)
                .when().get("/api/admin/days/8")
                .then().statusCode(200)
                .body("photos", hasSize(3))
                .body("photos[0].id", equalTo(c.toString()))
                .body("photos[1].id", equalTo(a.toString()))
                .body("photos[2].id", equalTo(b.toString()));
    }

    @Test
    void reorder_mismatchedCount_returns400() {
        var a = seedPhotoForDay(9);
        seedPhotoForDay(9);

        given().auth().oauth2(adminToken)
                .contentType("application/json")
                .body("{\"order\":[\"" + a + "\"]}")
                .when().put("/api/admin/days/9/photos/order")
                .then().statusCode(400);
    }

    @Transactional
    void seedUnpublishedDayWithPhoto(int dayNumber, String url) {
        var dc = new DayContent();
        dc.setDayNumber(dayNumber);
        dc.setPublished(false);
        em.persist(dc);
        var p = new Photo();
        p.setDayNumber(dayNumber);
        p.setUrl(url);
        p.setUrlMed(url.replace(".jpg", "-med.jpg"));
        p.setUrlThumb(url.replace(".jpg", "-thumb.jpg"));
        p.setWidth(1800);
        p.setHeight(1200);
        p.setSortOrder(0);
        em.persist(p);
    }

    @Transactional
    UUID seedPhotoForDay(int dayNumber) {
        var p = new Photo();
        p.setDayNumber(dayNumber);
        p.setUrl("https://b2/photos/seed-" + UUID.randomUUID() + ".jpg");
        p.setUrlMed("https://b2/photos/seed-m.jpg");
        p.setUrlThumb("https://b2/photos/seed-t.jpg");
        p.setWidth(1800);
        p.setHeight(1200);
        // sortOrder: append to end
        var max = em.createQuery(
                "SELECT COALESCE(MAX(p.sortOrder), -1) FROM Photo p WHERE p.dayNumber = :n",
                Integer.class).setParameter("n", dayNumber).getSingleResult();
        p.setSortOrder(max + 1);
        em.persist(p);
        em.flush();
        return p.getId();
    }
}
