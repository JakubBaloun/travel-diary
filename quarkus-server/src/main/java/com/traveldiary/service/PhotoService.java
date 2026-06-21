package com.traveldiary.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import com.traveldiary.dto.UpdatePhotoRequest;
import com.traveldiary.entity.Photo;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.exception.NotFoundException;
import com.traveldiary.itinerary.ItineraryDays;

@ApplicationScoped
@Transactional
public class PhotoService {

    @Inject
    EntityManager em;

    public List<Photo> listByDay(int dayNumber) {
        return em.createQuery(
                "SELECT p FROM Photo p WHERE p.dayNumber = :n ORDER BY p.sortOrder ASC, p.createdAt ASC",
                Photo.class)
                .setParameter("n", dayNumber)
                .getResultList();
    }

    public Photo findById(UUID id) {
        var p = em.find(Photo.class, id);
        if (p == null) throw new NotFoundException("Fotka nenalezena");
        return p;
    }

    public Photo create(int dayNumber, UploadService.UploadResult upload, String caption) {
        ItineraryDays.validate(dayNumber);
        var maxOrder = em.createQuery(
                "SELECT COALESCE(MAX(p.sortOrder), -1) FROM Photo p WHERE p.dayNumber = :n",
                Integer.class)
                .setParameter("n", dayNumber)
                .getSingleResult();

        var p = new Photo();
        p.setDayNumber(dayNumber);
        p.setUrl(upload.url());
        p.setUrlMed(upload.urlMed());
        p.setUrlThumb(upload.urlThumb());
        p.setWidth(upload.width());
        p.setHeight(upload.height());
        p.setSortOrder(maxOrder + 1);
        p.setCaption(caption != null && !caption.isBlank() ? caption : null);
        em.persist(p);
        return p;
    }

    public Photo update(UUID id, UpdatePhotoRequest req) {
        var p = findById(id);
        if (req.getWide() != null) p.setWide(req.getWide());
        if (req.isClearCaption()) {
            p.setCaption(null);
        } else if (req.getCaption() != null) {
            p.setCaption(req.getCaption().isBlank() ? null : req.getCaption());
        }
        return p;
    }

    public void reorder(int dayNumber, List<UUID> order) {
        ItineraryDays.validate(dayNumber);
        var photos = listByDay(dayNumber);
        if (photos.size() != order.size()) {
            throw new BadRequestException(
                    "Pořadí musí obsahovat všechny fotky dne (očekáváno " + photos.size() + ", dostal " + order.size() + ")");
        }
        var idSet = new HashSet<UUID>();
        for (var p : photos) idSet.add(p.getId());
        for (var id : order) {
            if (!idSet.contains(id)) {
                throw new BadRequestException("Fotka " + id + " nepatří k tomuto dni");
            }
        }
        var photoById = new HashMap<UUID, Photo>();
        for (var p : photos) photoById.put(p.getId(), p);
        for (int i = 0; i < order.size(); i++) {
            photoById.get(order.get(i)).setSortOrder(i);
        }
    }

    /** Returns the removed photo so caller can clean up B2 objects (3 variants). */
    public Photo remove(UUID id) {
        var p = findById(id);
        em.createQuery("UPDATE DayContent dc SET dc.heroPhotoId = NULL WHERE dc.heroPhotoId = :id")
                .setParameter("id", id)
                .executeUpdate();
        em.remove(p);
        return p;
    }
}
