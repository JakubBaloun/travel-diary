package com.traveldiary.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public class ReorderPhotosRequest {

    @NotNull
    private List<UUID> order;

    public List<UUID> getOrder() { return order; }
    public void setOrder(List<UUID> order) { this.order = order; }
}
