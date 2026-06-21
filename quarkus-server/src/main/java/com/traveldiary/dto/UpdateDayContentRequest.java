package com.traveldiary.dto;

import java.util.UUID;

public class UpdateDayContentRequest {

    private String story;
    private Boolean published;
    private Boolean highlight;
    private UUID heroPhotoId;
    private boolean clearHeroPhoto;

    public String getStory() { return story; }
    public void setStory(String story) { this.story = story; }

    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) { this.published = published; }

    public Boolean getHighlight() { return highlight; }
    public void setHighlight(Boolean highlight) { this.highlight = highlight; }

    public UUID getHeroPhotoId() { return heroPhotoId; }
    public void setHeroPhotoId(UUID heroPhotoId) { this.heroPhotoId = heroPhotoId; }

    public boolean isClearHeroPhoto() { return clearHeroPhoto; }
    public void setClearHeroPhoto(boolean clearHeroPhoto) { this.clearHeroPhoto = clearHeroPhoto; }
}
