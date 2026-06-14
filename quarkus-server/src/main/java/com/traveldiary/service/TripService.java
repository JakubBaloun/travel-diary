package com.traveldiary.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;

import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.dto.UpdateTripRequest;
import com.traveldiary.entity.Trip;
import com.traveldiary.exception.NotFoundException;

@ApplicationScoped
@Transactional
public class TripService {

    @Inject
    EntityManager em;

    public List<Trip> findAll() {
        return em.createQuery("SELECT t FROM Trip t ORDER BY t.startDate DESC", Trip.class)
                .getResultList();
    }

    public Trip findOne(UUID id) {
        var trip = em.createQuery(
                "SELECT t FROM Trip t LEFT JOIN FETCH t.days d WHERE t.id = :id ORDER BY d.dayNumber ASC",
                Trip.class
        ).setParameter("id", id).getResultStream().findFirst().orElse(null);
        if (trip == null) throw new NotFoundException("Trip not found");
        return trip;
    }

    public Trip findBySlug(String slug) {
        var trip = em.createQuery(
                "SELECT t FROM Trip t LEFT JOIN FETCH t.days d WHERE t.slug = :slug ORDER BY d.dayNumber ASC",
                Trip.class
        ).setParameter("slug", slug).getResultStream().findFirst().orElse(null);
        if (trip == null) throw new NotFoundException("Trip not found");
        return trip;
    }

    public Trip create(CreateTripRequest dto) {
        var trip = new Trip();
        trip.setTitle(dto.getTitle());
        trip.setSlug(dto.getSlug());
        trip.setDescription(dto.getDescription());
        trip.setCoverPhotoUrl(dto.getCoverPhotoUrl());
        trip.setStartDate(dto.getStartDate());
        trip.setEndDate(dto.getEndDate());
        em.persist(trip);
        return trip;
    }

    public Trip update(UUID id, UpdateTripRequest dto) {
        var trip = em.find(Trip.class, id);
        if (trip == null) throw new NotFoundException("Trip not found");

        if (dto.getTitle() != null) trip.setTitle(dto.getTitle());
        if (dto.getSlug() != null) trip.setSlug(dto.getSlug());
        if (dto.getDescription() != null) trip.setDescription(dto.getDescription());
        if (dto.getCoverPhotoUrl() != null) trip.setCoverPhotoUrl(dto.getCoverPhotoUrl());
        if (dto.getStartDate() != null) trip.setStartDate(java.time.LocalDate.parse(dto.getStartDate()));
        if (dto.getEndDate() != null) trip.setEndDate(java.time.LocalDate.parse(dto.getEndDate()));

        em.merge(trip);
        return trip;
    }

    public void remove(UUID id) {
        var trip = em.find(Trip.class, id);
        if (trip == null) throw new NotFoundException("Trip not found");
        em.remove(trip);
    }
}
