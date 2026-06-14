package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import com.traveldiary.dto.LoginRequest;
import com.traveldiary.service.AuthService;

import java.util.Map;

@Path("/api/auth")
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/login")
    @Produces(MediaType.APPLICATION_JSON)
    public Response login(@Valid LoginRequest dto) {
        var token = authService.loginReader(dto.getPassword());
        return Response.ok(Map.of("token", token)).build();
    }

    @POST
    @Path("/admin/login")
    @Produces(MediaType.APPLICATION_JSON)
    public Response adminLogin(@Valid LoginRequest dto) {
        var token = authService.loginAdmin(dto.getPassword());
        return Response.ok(Map.of("token", token)).build();
    }
}
