package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.traveldiary.dto.CreateDayRequest;
import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.dto.UpdateDayRequest;
import com.traveldiary.exception.NotFoundException;
import com.traveldiary.service.DayService;
import com.traveldiary.service.TripService;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
@Transactional
class DayServiceTest {

    @Inject
    DayService dayService;

    @Inject
    TripService tripService;

    @Inject
    EntityManager em;

    UUID tripId;

    @BeforeEach
    void setUp() {
        var dto = new CreateTripRequest();
        dto.setTitle("Trip for Days");
        dto.setSlug("trip-for-days");
        dto.setStartDate(LocalDate.of(2025, 6, 1));
        dto.setEndDate(LocalDate.of(2025, 6, 5));
        var trip = tripService.create(dto);
        tripId = trip.getId();
    }

    @AfterEach
    void tearDown() {
        em.createQuery("DELETE FROM Entry").executeUpdate();
        em.createQuery("DELETE FROM Day").executeUpdate();
        em.createQuery("DELETE FROM Trip").executeUpdate();
    }

    @Test
    void create_savesDay() {
        var dto = new CreateDayRequest();
        dto.setDayNumber(1);
        dto.setDate(LocalDate.of(2025, 6, 1));
        dto.setTitle("Day One");

        var day = dayService.create(tripId, dto);
        assertThat(day.getId()).isNotNull();
        assertThat(day.getDayNumber()).isEqualTo(1);
    }

    @Test
    void findByTripIdAndDayNumber_returnsDay() {
        var createDto = new CreateDayRequest();
        createDto.setDayNumber(2);
        createDto.setDate(LocalDate.of(2025, 6, 2));
        dayService.create(tripId, createDto);

        var day = dayService.findByTripIdAndDayNumber(tripId, 2);
        assertThat(day).isNotNull();
        assertThat(day.getDayNumber()).isEqualTo(2);
    }

    @Test
    void findByTripIdAndDayNumber_notFound_throws() {
        assertThrows(NotFoundException.class, () ->
                dayService.findByTripIdAndDayNumber(tripId, 999));
    }

    @Test
    void update_updatesDay() {
        var createDto = new CreateDayRequest();
        createDto.setDayNumber(3);
        createDto.setDate(LocalDate.of(2025, 6, 3));
        var day = dayService.create(tripId, createDto);

        var updateDto = new UpdateDayRequest();
        updateDto.setTitle("Updated Day");
        var updated = dayService.update(day.getId(), updateDto);
        assertThat(updated.getTitle()).isEqualTo("Updated Day");
    }

    @Test
    void remove_deletesDay() {
        var createDto = new CreateDayRequest();
        createDto.setDayNumber(4);
        createDto.setDate(LocalDate.of(2025, 6, 4));
        var day = dayService.create(tripId, createDto);

        dayService.remove(day.getId());
        assertThrows(NotFoundException.class, () ->
                dayService.findByTripIdAndDayNumber(tripId, 4));
    }
}
