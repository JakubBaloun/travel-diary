package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.UUID;

import com.traveldiary.auth.AdminAuth;
import com.traveldiary.dto.CreateDayRequest;
import com.traveldiary.dto.CreateTripRequest;
import com.traveldiary.dto.UpdateTripRequest;
import com.traveldiary.service.DayService;
import com.traveldiary.service.TripService;

@Path("/api/admin/trips")
@AdminAuth
public class TripAdminResource {

    @Inject
    TripService tripService;

    @Inject
    DayService dayService;

    @GET
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object findOne(@PathParam("id") UUID id) {
        return tripService.findOne(id);
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Object create(@Valid CreateTripRequest dto) {
        return tripService.create(dto);
    }

    @PATCH
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object update(@PathParam("id") UUID id, UpdateTripRequest dto) {
        return tripService.update(id, dto);
    }

    @DELETE
    @Path("/{id}")
    public void remove(@PathParam("id") UUID id) {
        tripService.remove(id);
    }

    @POST
    @Path("/{tripId}/days")
    @Produces(MediaType.APPLICATION_JSON)
    public Object createDay(@PathParam("tripId") UUID tripId, @Valid CreateDayRequest dto) {
        return dayService.create(tripId, dto);
    }
}
