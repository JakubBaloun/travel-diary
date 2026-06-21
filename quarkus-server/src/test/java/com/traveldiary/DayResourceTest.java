package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.traveldiary.entity.DayContent;
import com.traveldiary.entity.Photo;

import java.time.Instant;
import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.Matchers.hasSize;

@QuarkusTest
class DayResourceTest {

    @Inject
    EntityManager em;

    String readerToken;

    @BeforeEach
    @Transactional
    void resetAndSeed() {
        em.createQuery("DELETE FROM Photo").executeUpdate();
        em.createQuery("DELETE FROM DayContent").executeUpdate();
        readerToken = TestTokens.readerToken();

        // Day 1: published with 2 photos (hero set)
        var published = new DayContent();
        published.setDayNumber(1);
        published.setStory("Boston ahoj");
        published.setPublished(true);
        published.setHighlight(true);
        em.persist(published);

        var photo1 = photo(1, 0, "https://b2/photos/a.jpg");
        var photo2 = photo(1, 1, "https://b2/photos/b.jpg");
        em.persist(photo1);
        em.persist(photo2);
        em.flush();

        published.setHeroPhotoId(photo2.getId());
        em.merge(published);

        // Day 2: has content + photos but unpublished
        var draft = new DayContent();
        draft.setDayNumber(2);
        draft.setStory("rozepsáno");
        draft.setPublished(false);
        em.persist(draft);
        em.persist(photo(2, 0, "https://b2/photos/c.jpg"));
    }

    @Test
    void summary_withoutAuth_returns401() {
        given().when().get("/api/days/summary")
                .then().statusCode(401);
    }

    @Test
    void summary_withReader_returnsFifteenEntries() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/summary")
                .then().statusCode(200)
                .body("$", hasSize(15))
                .body("[0].dayNumber", is(1))
                .body("[14].dayNumber", is(15));
    }

    @Test
    void summary_publicView_hidesHeroThumbForUnpublishedDay() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/summary")
                .then().statusCode(200)
                .body("find { it.dayNumber == 2 }.published", is(false))
                .body("find { it.dayNumber == 2 }.photoCount", is(1))
                .body("find { it.dayNumber == 2 }.heroThumbUrl", nullValue());
    }

    @Test
    void summary_publicView_returnsHeroThumbForPublishedDay() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/summary")
                .then().statusCode(200)
                .body("find { it.dayNumber == 1 }.published", is(true))
                .body("find { it.dayNumber == 1 }.heroThumbUrl", equalTo("https://b2/photos/b-thumb.jpg"));
    }

    @Test
    void getDay_unpublished_returns404() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/2")
                .then().statusCode(404);
    }

    @Test
    void getDay_published_returnsContentAndPhotos() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/1")
                .then().statusCode(200)
                .body("dayNumber", is(1))
                .body("story", is("Boston ahoj"))
                .body("published", is(true))
                .body("highlight", is(true))
                .body("heroPhotoId", notNullValue())
                .body("photos", hasSize(2))
                .body("photos[0].sortOrder", is(0));
    }

    @Test
    void getDay_outOfRange_returns400() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/16")
                .then().statusCode(400);
    }

    @Test
    void getDay_zero_returns400() {
        given().auth().oauth2(readerToken)
                .when().get("/api/days/0")
                .then().statusCode(400);
    }

    private static Photo photo(int dayNumber, int sortOrder, String baseUrl) {
        var p = new Photo();
        p.setDayNumber(dayNumber);
        p.setUrl(baseUrl);
        p.setUrlMed(baseUrl.replace(".jpg", "-med.jpg"));
        p.setUrlThumb(baseUrl.replace(".jpg", "-thumb.jpg"));
        p.setWidth(1800);
        p.setHeight(1200);
        p.setSortOrder(sortOrder);
        return p;
    }
}
