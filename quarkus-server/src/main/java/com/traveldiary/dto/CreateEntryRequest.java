package com.traveldiary.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import com.traveldiary.enums.EntryType;

public class CreateEntryRequest {

    @NotNull
    private EntryType type;

    private String content;

    @Size(max = 500)
    private String photoUrl;

    @Size(max = 500)
    private String caption;

    private Integer sortOrder;

    public EntryType getType() { return type; }
    public void setType(EntryType type) { this.type = type; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
