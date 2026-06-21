package com.traveldiary.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.traveldiary.entity.Photo;

import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PhotoResponse {

    public UUID id;
    public Integer dayNumber;
    public String url;
    public String urlMed;
    public String urlThumb;
    public Integer width;
    public Integer height;
    public boolean wide;
    public Integer sortOrder;
    public String caption;

    public static PhotoResponse from(Photo p) {
        var r = new PhotoResponse();
        r.id = p.getId();
        r.dayNumber = p.getDayNumber();
        r.url = p.getUrl();
        r.urlMed = p.getUrlMed();
        r.urlThumb = p.getUrlThumb();
        r.width = p.getWidth();
        r.height = p.getHeight();
        r.wide = p.isWide();
        r.sortOrder = p.getSortOrder();
        r.caption = p.getCaption();
        return r;
    }
}
