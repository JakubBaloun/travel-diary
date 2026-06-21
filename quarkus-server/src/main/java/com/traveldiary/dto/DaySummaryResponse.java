package com.traveldiary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DaySummaryResponse {

    public Integer dayNumber;
    public boolean published;
    public boolean highlight;
    public Integer photoCount;
    /** Null for non-published days — readers must not see thumbs of unpublished content. */
    public String heroThumbUrl;
}
