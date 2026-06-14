package com.traveldiary.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.util.UUID;

import com.traveldiary.auth.AdminAuth;
import com.traveldiary.dto.UpdateEntryRequest;
import com.traveldiary.enums.EntryType;
import com.traveldiary.service.EntryService;
import com.traveldiary.service.UploadService;

@Path("/api/admin/entries")
@AdminAuth
public class EntryAdminResource {

    @Inject
    EntryService entryService;

    @Inject
    UploadService uploadService;

    @PATCH
    @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object update(@PathParam("id") UUID id, UpdateEntryRequest dto) {
        return entryService.update(id, dto);
    }

    @DELETE
    @Path("/{id}")
    public void remove(@PathParam("id") UUID id) {
        var entry = entryService.remove(id);

        if (entry.getType() == EntryType.photo && entry.getPhotoUrl() != null) {
            try {
                uploadService.deletePhoto(entry.getPhotoUrl());
            } catch (Exception e) {
                // silently ignore delete errors (same as original)
            }
        }
    }
}
