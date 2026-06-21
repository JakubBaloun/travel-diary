package com.traveldiary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DayResponse {

    public Integer dayNumber;
    public String story;
    public boolean published;
    public boolean highlight;
    public UUID heroPhotoId;
    public List<PhotoResponse> photos;
}
