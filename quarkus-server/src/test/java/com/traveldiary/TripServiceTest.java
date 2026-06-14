package com.traveldiary;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.dto.UpdateTripRequest;
import com.traveldiary.exception.NotFoundException;
import com.traveldiary.service.TripService;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
@Transactional
class TripServiceTest {

    @Inject
    TripService tripService;

    @Inject
    EntityManager em;

    UUID tripId;

    @BeforeEach
    void setUp() {
        var dto = new CreateTripRequest();
        dto.setTitle("Test Trip");
        dto.setSlug("test-trip");
        dto.setDescription("A test trip");
        dto.setStartDate(LocalDate.of(2025, 1, 1));
        dto.setEndDate(LocalDate.of(2025, 1, 10));
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
    void findAll_returnsTrips() {
        var trips = tripService.findAll();
        assertThat(trips).isNotEmpty();
        assertThat(trips.getFirst().getTitle()).isEqualTo("Test Trip");
    }

    @Test
    void findBySlug_returnsTrip() {
        var trip = tripService.findBySlug("test-trip");
        assertThat(trip).isNotNull();
        assertThat(trip.getTitle()).isEqualTo("Test Trip");
    }

    @Test
    void findBySlug_notFound_throws() {
        assertThrows(NotFoundException.class, () ->
                tripService.findBySlug("nonexistent"));
    }

    @Test
    void findOne_returnsTrip() {
        var trip = tripService.findOne(tripId);
        assertThat(trip).isNotNull();
        assertThat(trip.getTitle()).isEqualTo("Test Trip");
    }

    @Test
    void findOne_notFound_throws() {
        assertThrows(NotFoundException.class, () ->
                tripService.findOne(UUID.randomUUID()));
    }

    @Test
    void update_updatesTrip() {
        var dto = new UpdateTripRequest();
        dto.setTitle("Updated Trip");
        var updated = tripService.update(tripId, dto);
        assertThat(updated.getTitle()).isEqualTo("Updated Trip");
    }

    @Test
    void remove_deletesTrip() {
        tripService.remove(tripId);
        assertThrows(NotFoundException.class, () ->
                tripService.findOne(tripId));
    }
}
