package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.nio.file.Files;

import io.smallrye.common.annotation.Blocking;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import com.traveldiary.auth.AdminAuth;
import com.traveldiary.dto.PhotoResponse;
import com.traveldiary.dto.ReorderPhotosRequest;
import com.traveldiary.dto.UpdateDayContentRequest;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.service.DayContentService;
import com.traveldiary.service.PhotoService;
import com.traveldiary.service.UploadService;

@Path("/api/admin/days")
@AdminAuth
@Blocking
public class DayAdminResource {

    @Inject
    DayContentService dayContentService;

    @Inject
    PhotoService photoService;

    @Inject
    UploadService uploadService;

    @GET
    @Path("/summary")
    @Produces(MediaType.APPLICATION_JSON)
    public Object summary() {
        return dayContentService.listSummaries(false);
    }

    @GET
    @Path("/{dayNumber}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object findOne(@PathParam("dayNumber") int dayNumber) {
        return dayContentService.findForAdmin(dayNumber);
    }

    @PUT
    @Path("/{dayNumber}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Object update(@PathParam("dayNumber") int dayNumber, UpdateDayContentRequest dto) {
        return dayContentService.update(dayNumber, dto);
    }

    @POST
    @Path("/{dayNumber}/photos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Object uploadPhoto(
            @PathParam("dayNumber") int dayNumber,
            @RestForm("photo") FileUpload photoFile,
            @RestForm("caption") String caption
    ) {
        if (photoFile == null || photoFile.size() == 0) {
            throw new BadRequestException("Fotka je povinná.");
        }
        UploadService.UploadResult uploaded;
        try {
            uploaded = uploadService.uploadPhoto(
                    Files.readAllBytes(photoFile.uploadedFile()),
                    photoFile.contentType(),
                    photoFile.fileName()
            );
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            throw new BadRequestException("Upload selhal: " + e.getMessage());
        }
        return PhotoResponse.from(photoService.create(dayNumber, uploaded, caption));
    }

    @PUT
    @Path("/{dayNumber}/photos/order")
    @Consumes(MediaType.APPLICATION_JSON)
    public void reorder(@PathParam("dayNumber") int dayNumber, @Valid ReorderPhotosRequest dto) {
        photoService.reorder(dayNumber, dto.getOrder());
    }
}
