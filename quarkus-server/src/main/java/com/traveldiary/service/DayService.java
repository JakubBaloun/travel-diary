package com.traveldiary.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.UUID;

import com.traveldiary.dto.CreateDayRequest;
import com.traveldiary.dto.UpdateDayRequest;
import com.traveldiary.entity.Day;
import com.traveldiary.exception.NotFoundException;

@ApplicationScoped
@Transactional
public class DayService {

    @Inject
    EntityManager em;

    public Day findByTripIdAndDayNumber(UUID tripId, int dayNumber) {
        var day = em.createQuery(
                "SELECT d FROM Day d LEFT JOIN FETCH d.entries e WHERE d.tripId = :tripId AND d.dayNumber = :dayNumber ORDER BY e.sortOrder ASC",
                Day.class
        ).setParameter("tripId", tripId)
         .setParameter("dayNumber", dayNumber)
         .getResultStream()
         .findFirst()
         .orElse(null);

        if (day == null) throw new NotFoundException("Day not found");
        return day;
    }

    public Day create(UUID tripId, CreateDayRequest dto) {
        var day = new Day();
        day.setTripId(tripId);
        day.setDayNumber(dto.getDayNumber());
        day.setDate(dto.getDate());
        day.setTitle(dto.getTitle());
        day.setSummary(dto.getSummary());
        day.setCoverPhotoUrl(dto.getCoverPhotoUrl());
        em.persist(day);
        return day;
    }

    public Day update(UUID id, UpdateDayRequest dto) {
        var day = em.find(Day.class, id);
        if (day == null) throw new NotFoundException("Day not found");

        if (dto.getDayNumber() != null) day.setDayNumber(dto.getDayNumber());
        if (dto.getDate() != null) day.setDate(java.time.LocalDate.parse(dto.getDate()));
        if (dto.getTitle() != null) day.setTitle(dto.getTitle());
        if (dto.getSummary() != null) day.setSummary(dto.getSummary());
        if (dto.getCoverPhotoUrl() != null) day.setCoverPhotoUrl(dto.getCoverPhotoUrl());

        em.merge(day);
        return day;
    }

    public void remove(UUID id) {
        var day = em.find(Day.class, id);
        if (day == null) throw new NotFoundException("Day not found");
        em.remove(day);
    }
}
