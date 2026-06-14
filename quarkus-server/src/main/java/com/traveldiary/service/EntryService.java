package com.traveldiary.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.UUID;

import com.traveldiary.dto.CreateEntryRequest;
import com.traveldiary.dto.UpdateEntryRequest;
import com.traveldiary.entity.Entry;
import com.traveldiary.exception.NotFoundException;

@ApplicationScoped
@Transactional
public class EntryService {

    @Inject
    EntityManager em;

    public Entry create(UUID dayId, CreateEntryRequest dto) {
        var entry = new Entry();
        entry.setDayId(dayId);
        entry.setType(dto.getType());
        entry.setContent(dto.getContent());
        entry.setPhotoUrl(dto.getPhotoUrl());
        entry.setCaption(dto.getCaption());
        entry.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        em.persist(entry);
        return entry;
    }

    public Entry update(UUID id, UpdateEntryRequest dto) {
        var entry = em.find(Entry.class, id);
        if (entry == null) throw new NotFoundException("Entry not found");

        if (dto.getType() != null) entry.setType(dto.getType());
        if (dto.getContent() != null) entry.setContent(dto.getContent());
        if (dto.getPhotoUrl() != null) entry.setPhotoUrl(dto.getPhotoUrl());
        if (dto.getCaption() != null) entry.setCaption(dto.getCaption());
        if (dto.getSortOrder() != null) entry.setSortOrder(dto.getSortOrder());

        em.merge(entry);
        return entry;
    }

    public Entry remove(UUID id) {
        var entry = em.find(Entry.class, id);
        if (entry == null) throw new NotFoundException("Entry not found");
        em.remove(entry);
        return entry;
    }
}
