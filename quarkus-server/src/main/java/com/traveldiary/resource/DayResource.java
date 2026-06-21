package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import io.smallrye.common.annotation.Blocking;

import com.traveldiary.auth.JwtAuth;
import com.traveldiary.service.DayContentService;

@Path("/api/days")
@JwtAuth
@Blocking
public class DayResource {

    @Inject
    DayContentService dayContentService;

    /** Per-day status for the map. Non-published days never leak photo URLs. */
    @GET
    @Path("/summary")
    @Produces(MediaType.APPLICATION_JSON)
    public Object summary() {
        return dayContentService.listSummaries(true);
    }

    /** Full day with photos — only if published. */
    @GET
    @Path("/{dayNumber}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object findOne(@PathParam("dayNumber") int dayNumber) {
        return dayContentService.findPublished(dayNumber);
    }
}
