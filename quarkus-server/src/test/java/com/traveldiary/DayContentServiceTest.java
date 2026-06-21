package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.traveldiary.dto.UpdateDayContentRequest;
import com.traveldiary.entity.DayContent;
import com.traveldiary.entity.Photo;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.exception.NotFoundException;
import com.traveldiary.itinerary.ItineraryDays;
import com.traveldiary.service.DayContentService;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
class DayContentServiceTest {

    @Inject
    DayContentService dayContentService;

    @Inject
    EntityManager em;

    @BeforeEach
    @Transactional
    void reset() {
        em.createQuery("DELETE FROM Photo").executeUpdate();
        em.createQuery("DELETE FROM DayContent").executeUpdate();
    }

    @Test
    void listSummaries_alwaysReturnsAllDays() {
        var publicSummaries = dayContentService.listSummaries(true);
        assertThat(publicSummaries).hasSize(ItineraryDays.COUNT);
        assertThat(publicSummaries.get(0).dayNumber).isEqualTo(1);
        assertThat(publicSummaries.get(14).dayNumber).isEqualTo(15);
    }

    @Test
    @Transactional
    void listSummaries_publicView_hidesHeroThumbForUnpublished() {
        var dc = new DayContent();
        dc.setDayNumber(5);
        dc.setPublished(false);
        em.persist(dc);

        var p = persistPhoto(5);
        em.flush();

        var publicView = dayContentService.listSummaries(true);
        var entry = publicView.stream().filter(s -> s.dayNumber == 5).findFirst().orElseThrow();
        assertThat(entry.published).isFalse();
        assertThat(entry.photoCount).isEqualTo(1);
        assertThat(entry.heroThumbUrl).isNull();
    }

    @Test
    @Transactional
    void listSummaries_adminView_includesHeroThumbForUnpublished() {
        var dc = new DayContent();
        dc.setDayNumber(6);
        dc.setPublished(false);
        em.persist(dc);
        var p = persistPhoto(6);
        em.flush();

        var adminView = dayContentService.listSummaries(false);
        var entry = adminView.stream().filter(s -> s.dayNumber == 6).findFirst().orElseThrow();
        assertThat(entry.heroThumbUrl).isEqualTo(p.getUrlThumb());
    }

    @Test
    @Transactional
    void listSummaries_publishedWithoutHeroPhotoId_usesFirstPhoto() {
        var dc = new DayContent();
        dc.setDayNumber(7);
        dc.setPublished(true);
        em.persist(dc);
        var first = persistPhoto(7);
        var second = persistPhoto(7);
        second.setSortOrder(1);
        em.merge(second);
        em.flush();

        var entry = dayContentService.listSummaries(true).stream()
                .filter(s -> s.dayNumber == 7).findFirst().orElseThrow();
        assertThat(entry.heroThumbUrl).isEqualTo(first.getUrlThumb());
    }

    @Test
    @Transactional
    void findPublished_unpublished_throwsNotFound() {
        var dc = new DayContent();
        dc.setDayNumber(8);
        dc.setPublished(false);
        em.persist(dc);

        assertThrows(NotFoundException.class, () -> dayContentService.findPublished(8));
    }

    @Test
    @Transactional
    void update_heroPhotoFromAnotherDay_throws() {
        var foreign = persistPhoto(9);
        em.flush();

        var req = new UpdateDayContentRequest();
        req.setHeroPhotoId(foreign.getId());

        assertThrows(BadRequestException.class, () -> dayContentService.update(10, req));
    }

    @Test
    void findPublished_outOfRange_throwsBadRequest() {
        assertThrows(BadRequestException.class, () -> dayContentService.findPublished(0));
        assertThrows(BadRequestException.class, () -> dayContentService.findPublished(16));
    }

    private Photo persistPhoto(int dayNumber) {
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
        return p;
    }
}
