package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.UUID;

import io.smallrye.common.annotation.Blocking;

import com.traveldiary.auth.AdminAuth;
import com.traveldiary.dto.PhotoResponse;
import com.traveldiary.dto.UpdatePhotoRequest;
import com.traveldiary.service.PhotoService;
import com.traveldiary.service.UploadService;

@Path("/api/admin/photos")
@AdminAuth
@Blocking
public class PhotoAdminResource {

    @Inject
    PhotoService photoService;

    @Inject
    UploadService uploadService;

    @PATCH
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Object update(@PathParam("id") UUID id, UpdatePhotoRequest dto) {
        return PhotoResponse.from(photoService.update(id, dto));
    }

    @DELETE
    @Path("/{id}")
    public void remove(@PathParam("id") UUID id) {
        var removed = photoService.remove(id);
        uploadService.deletePhoto(removed.getUrl());
    }
}
