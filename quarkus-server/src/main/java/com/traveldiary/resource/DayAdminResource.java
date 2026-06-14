package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.nio.file.Files;
import java.util.UUID;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import com.traveldiary.auth.AdminAuth;
import com.traveldiary.dto.CreateEntryRequest;
import com.traveldiary.dto.UpdateDayRequest;
import com.traveldiary.enums.EntryType;
import com.traveldiary.exception.BadRequestException;
import com.traveldiary.service.DayService;
import com.traveldiary.service.EntryService;
import com.traveldiary.service.UploadService;

@Path("/api/admin/days")
@AdminAuth
public class DayAdminResource {

    @Inject
    DayService dayService;

    @Inject
    EntryService entryService;

    @Inject
    UploadService uploadService;

    @PATCH
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object update(@PathParam("id") UUID id, UpdateDayRequest dto) {
        return dayService.update(id, dto);
    }

    @DELETE
    @Path("/{id}")
    public void remove(@PathParam("id") UUID id) {
        dayService.remove(id);
    }

    @POST
    @Path("/{dayId}/entries")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Object createEntryJson(@PathParam("dayId") UUID dayId, CreateEntryRequest dto) {
        if (dto.getType() == null) {
            throw new BadRequestException("Entry type is required");
        }
        if (dto.getType() == EntryType.photo
                && (dto.getPhotoUrl() == null || dto.getPhotoUrl().isBlank())) {
            throw new BadRequestException("Photo file is required for photo entries");
        }
        return entryService.create(dayId, dto);
    }

    @POST
    @Path("/{dayId}/entries")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Object createEntry(
            @PathParam("dayId") UUID dayId,
            @RestForm("type") EntryType type,
            @RestForm("content") String content,
            @RestForm("photoUrl") String photoUrl,
            @RestForm("caption") String caption,
            @RestForm("sortOrder") Integer sortOrder,
            @RestForm("photo") FileUpload photoFile
    ) {
        var dto = new CreateEntryRequest();
        dto.setType(type);
        dto.setContent(content);
        dto.setPhotoUrl(photoUrl);
        dto.setCaption(caption);
        dto.setSortOrder(sortOrder);

        if (dto.getType() == null) {
            throw new BadRequestException("Entry type is required");
        }
        if (dto.getType() == EntryType.photo) {
            if (photoFile == null || photoFile.size() == 0) {
                throw new BadRequestException("Photo file is required for photo entries");
            }
            try {
                var url = uploadService.uploadPhoto(
                        Files.readAllBytes(photoFile.uploadedFile()),
                        photoFile.contentType(),
                        photoFile.fileName()
                );
                dto.setPhotoUrl(url);
            } catch (Exception e) {
                throw new BadRequestException("Failed to upload photo: " + e.getMessage());
            }
        }

        return entryService.create(dayId, dto);
    }
}
