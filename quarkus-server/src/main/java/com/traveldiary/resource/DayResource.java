package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import com.traveldiary.auth.JwtAuth;
import com.traveldiary.service.DayService;
import com.traveldiary.service.TripService;

@Path("/api/trips/{slug}/days")
@JwtAuth
public class DayResource {

    @Inject
    DayService dayService;

    @Inject
    TripService tripService;

    @GET
    @Path("/{dayNumber}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object findByDayNumber(@PathParam("slug") String slug, @PathParam("dayNumber") int dayNumber) {
        var trip = tripService.findBySlug(slug);
        return dayService.findByTripIdAndDayNumber(trip.getId(), dayNumber);
    }
}
