package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.traveldiary.dto.CreateDayRequest;
import com.traveldiary.dto.CreateEntryRequest;
import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.dto.UpdateEntryRequest;
import com.traveldiary.enums.EntryType;
import com.traveldiary.exception.NotFoundException;
import com.traveldiary.service.DayService;
import com.traveldiary.service.EntryService;
import com.traveldiary.service.TripService;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
@Transactional
class EntryServiceTest {

    @Inject
    EntryService entryService;

    @Inject
    DayService dayService;

    @Inject
    TripService tripService;

    @Inject
    EntityManager em;

    UUID dayId;

    @BeforeEach
    void setUp() {
        var tripDto = new CreateTripRequest();
        tripDto.setTitle("Entry Trip");
        tripDto.setSlug("entry-trip");
        tripDto.setStartDate(LocalDate.of(2025, 7, 1));
        tripDto.setEndDate(LocalDate.of(2025, 7, 3));
        var trip = tripService.create(tripDto);

        var dayDto = new CreateDayRequest();
        dayDto.setDayNumber(1);
        dayDto.setDate(LocalDate.of(2025, 7, 1));
        var day = dayService.create(trip.getId(), dayDto);
        dayId = day.getId();
    }

    @AfterEach
    void tearDown() {
        em.createQuery("DELETE FROM Entry").executeUpdate();
        em.createQuery("DELETE FROM Day").executeUpdate();
        em.createQuery("DELETE FROM Trip").executeUpdate();
    }

    @Test
    void create_textEntry_saves() {
        var dto = new CreateEntryRequest();
        dto.setType(EntryType.text);
        dto.setContent("Hello World");
        dto.setSortOrder(0);

        var entry = entryService.create(dayId, dto);
        assertThat(entry.getId()).isNotNull();
        assertThat(entry.getContent()).isEqualTo("Hello World");
    }

    @Test
    void create_photoEntry_saves() {
        var dto = new CreateEntryRequest();
        dto.setType(EntryType.photo);
        dto.setPhotoUrl("https://example.com/photo.jpg");
        dto.setCaption("A photo");
        dto.setSortOrder(1);

        var entry = entryService.create(dayId, dto);
        assertThat(entry.getType()).isEqualTo(EntryType.photo);
        assertThat(entry.getPhotoUrl()).isEqualTo("https://example.com/photo.jpg");
    }

    @Test
    void update_updatesEntry() {
        var dto = new CreateEntryRequest();
        dto.setType(EntryType.text);
        dto.setContent("Original");
        var entry = entryService.create(dayId, dto);

        var updateDto = new UpdateEntryRequest();
        updateDto.setContent("Updated");
        var updated = entryService.update(entry.getId(), updateDto);
        assertThat(updated.getContent()).isEqualTo("Updated");
    }

    @Test
    void remove_deletesEntryAndReturnsIt() {
        var dto = new CreateEntryRequest();
        dto.setType(EntryType.text);
        dto.setContent("To delete");
        var entry = entryService.create(dayId, dto);

        var removed = entryService.remove(entry.getId());
        assertThat(removed.getId()).isEqualTo(entry.getId());

        assertThrows(NotFoundException.class, () ->
                entryService.remove(entry.getId()));
    }
}
