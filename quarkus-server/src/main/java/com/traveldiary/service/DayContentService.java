package com.traveldiary.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import com.traveldiary.dto.DayResponse;
import com.traveldiary.dto.DaySummaryResponse;
import com.traveldiary.dto.PhotoResponse;
import com.traveldiary.dto.UpdateDayContentRequest;
import com.traveldiary.entity.DayContent;
import com.traveldiary.entity.Photo;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.exception.NotFoundException;
import com.traveldiary.itinerary.ItineraryDays;

@ApplicationScoped
@Transactional
public class DayContentService {

    @Inject
    EntityManager em;

    @Inject
    PhotoService photoService;

    /** Public reader view — 404 if day is not published. */
    public DayResponse findPublished(int dayNumber) {
        ItineraryDays.validate(dayNumber);
        var dc = em.find(DayContent.class, dayNumber);
        if (dc == null || !dc.isPublished()) {
            throw new NotFoundException("Den ještě není zveřejněný");
        }
        return toResponse(dc, photoService.listByDay(dayNumber));
    }

    /** Admin view — returns content regardless of published flag; synthesizes empty content for untouched days. */
    public DayResponse findForAdmin(int dayNumber) {
        ItineraryDays.validate(dayNumber);
        var dc = em.find(DayContent.class, dayNumber);
        if (dc == null) {
            dc = new DayContent();
            dc.setDayNumber(dayNumber);
        }
        return toResponse(dc, photoService.listByDay(dayNumber));
    }

    public DayResponse update(int dayNumber, UpdateDayContentRequest req) {
        ItineraryDays.validate(dayNumber);
        var dc = em.find(DayContent.class, dayNumber);
        if (dc == null) {
            dc = new DayContent();
            dc.setDayNumber(dayNumber);
            em.persist(dc);
        }
        if (req.getStory() != null) {
            dc.setStory(req.getStory().isBlank() ? null : req.getStory());
        }
        if (req.getPublished() != null) dc.setPublished(req.getPublished());
        if (req.getHighlight() != null) dc.setHighlight(req.getHighlight());
        if (req.isClearHeroPhoto()) {
            dc.setHeroPhotoId(null);
        } else if (req.getHeroPhotoId() != null) {
            var photo = em.find(Photo.class, req.getHeroPhotoId());
            if (photo == null || !photo.getDayNumber().equals(dayNumber)) {
                throw new BadRequestException("Hero photo nepatří k tomuto dni");
            }
            dc.setHeroPhotoId(req.getHeroPhotoId());
        }
        return toResponse(dc, photoService.listByDay(dayNumber));
    }

    /**
     * Summary for all {@link ItineraryDays#COUNT} days. If {@code publicView}, {@code heroThumbUrl}
     * is null for non-published days so readers cannot guess B2 URLs.
     */
    public List<DaySummaryResponse> listSummaries(boolean publicView) {
        var contents = em.createQuery("SELECT dc FROM DayContent dc", DayContent.class).getResultList();
        var photos = em.createQuery(
                "SELECT p FROM Photo p ORDER BY p.dayNumber ASC, p.sortOrder ASC, p.createdAt ASC",
                Photo.class).getResultList();

        var contentByDay = new HashMap<Integer, DayContent>();
        for (var c : contents) contentByDay.put(c.getDayNumber(), c);

        var photosByDay = new HashMap<Integer, List<Photo>>();
        for (var p : photos) {
            photosByDay.computeIfAbsent(p.getDayNumber(), k -> new ArrayList<>()).add(p);
        }

        var out = new ArrayList<DaySummaryResponse>(ItineraryDays.COUNT);
        for (int n = 1; n <= ItineraryDays.COUNT; n++) {
            var dc = contentByDay.get(n);
            var ps = photosByDay.getOrDefault(n, List.of());
            var resp = new DaySummaryResponse();
            resp.dayNumber = n;
            resp.published = dc != null && dc.isPublished();
            resp.highlight = dc != null && dc.isHighlight();
            resp.photoCount = ps.size();

            boolean showThumb = publicView ? resp.published : true;
            if (showThumb && !ps.isEmpty()) {
                Photo hero = null;
                if (dc != null && dc.getHeroPhotoId() != null) {
                    for (var p : ps) {
                        if (p.getId().equals(dc.getHeroPhotoId())) { hero = p; break; }
                    }
                }
                if (hero == null) hero = ps.get(0);
                resp.heroThumbUrl = hero.getUrlThumb();
            }
            out.add(resp);
        }
        return out;
    }

    private DayResponse toResponse(DayContent dc, List<Photo> photos) {
        var r = new DayResponse();
        r.dayNumber = dc.getDayNumber();
        r.story = dc.getStory();
        r.published = dc.isPublished();
        r.highlight = dc.isHighlight();
        r.heroPhotoId = dc.getHeroPhotoId();
        r.photos = photos.stream().map(PhotoResponse::from).toList();
        return r;
    }
}
