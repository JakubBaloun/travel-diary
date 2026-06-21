package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.traveldiary.dto.UpdatePhotoRequest;
import com.traveldiary.entity.DayContent;
import com.traveldiary.entity.Photo;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.service.PhotoService;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
class PhotoServiceTest {

    @Inject
    PhotoService photoService;

    @Inject
    EntityManager em;

    @BeforeEach
    @Transactional
    void reset() {
        em.createQuery("DELETE FROM Photo").executeUpdate();
        em.createQuery("DELETE FROM DayContent").executeUpdate();
    }

    @Test
    @Transactional
    void reorder_setsSortOrderToMatchListPosition() {
        var a = persistPhoto(1, 0);
        var b = persistPhoto(1, 1);
        var c = persistPhoto(1, 2);

        photoService.reorder(1, List.of(c.getId(), a.getId(), b.getId()));
        em.flush();
        em.clear();

        var after = photoService.listByDay(1);
        assertThat(after).extracting(Photo::getId)
                .containsExactly(c.getId(), a.getId(), b.getId());
        assertThat(after).extracting(Photo::getSortOrder)
                .containsExactly(0, 1, 2);
    }

    @Test
    @Transactional
    void reorder_mismatchedCount_throws() {
        var a = persistPhoto(1, 0);
        persistPhoto(1, 1);

        assertThrows(BadRequestException.class,
                () -> photoService.reorder(1, List.of(a.getId())));
    }

    @Test
    @Transactional
    void reorder_idFromOtherDay_throws() {
        var a = persistPhoto(1, 0);
        var foreign = persistPhoto(2, 0);

        assertThrows(BadRequestException.class,
                () -> photoService.reorder(1, List.of(a.getId(), foreign.getId())));
    }

    @Test
    @Transactional
    void remove_clearsHeroReferenceOnDayContent() {
        var photo = persistPhoto(3, 0);
        var dc = new DayContent();
        dc.setDayNumber(3);
        dc.setHeroPhotoId(photo.getId());
        em.persist(dc);
        em.flush();

        photoService.remove(photo.getId());
        em.flush();
        em.clear();

        var reloaded = em.find(DayContent.class, 3);
        assertThat(reloaded.getHeroPhotoId()).isNull();
    }

    @Test
    @Transactional
    void update_clearCaption_setsNull() {
        var photo = persistPhoto(4, 0);
        photo.setCaption("hello");
        em.merge(photo);

        var req = new UpdatePhotoRequest();
        req.setClearCaption(true);
        photoService.update(photo.getId(), req);
        em.flush();
        em.clear();

        var reloaded = em.find(Photo.class, photo.getId());
        assertThat(reloaded.getCaption()).isNull();
    }

    private Photo persistPhoto(int dayNumber, int sortOrder) {
        var p = new Photo();
        p.setDayNumber(dayNumber);
        var url = "https://b2/photos/" + UUID.randomUUID() + ".jpg";
        p.setUrl(url);
        p.setUrlMed(url.replace(".jpg", "-m.jpg"));
        p.setUrlThumb(url.replace(".jpg", "-t.jpg"));
        p.setWidth(1800);
        p.setHeight(1200);
        p.setSortOrder(sortOrder);
        em.persist(p);
        return p;
    }
}
