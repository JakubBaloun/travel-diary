package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.nio.file.Files;
import java.util.Map;

import org.jboss.resteasy.reactive.multipart.FileUpload;

import com.traveldiary.auth.AdminAuth;
import com.traveldiary.service.UploadService;
import com.traveldiary.exception.BadRequestException;

import org.jboss.resteasy.reactive.RestForm;

@Path("/api/admin/upload")
@AdminAuth
public class UploadResource {

    @Inject
    UploadService uploadService;

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    public Response upload(@RestForm("photo") FileUpload file) {
        if (file == null || file.size() == 0) {
            throw new BadRequestException("Photo file is required");
        }

        try {
            var url = uploadService.uploadPhoto(
                    Files.readAllBytes(file.uploadedFile()),
                    file.contentType(),
                    file.fileName()
            );
            return Response.ok(Map.of("url", url)).build();
        } catch (Exception e) {
            throw new BadRequestException("Failed to upload photo: " + e.getMessage());
        }
    }
}
