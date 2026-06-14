package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import com.traveldiary.auth.JwtAuth;
import com.traveldiary.service.TripService;

@Path("/api/trips")
@JwtAuth
public class TripResource {

    @Inject
    TripService tripService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Object findAll() {
        return tripService.findAll();
    }

    @GET
    @Path("/{slug}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object findBySlug(@PathParam("slug") String slug) {
        return tripService.findBySlug(slug);
    }
}
