package com.traveldiary.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

@Entity
@Table(name = "dayContent")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DayContent {

    @Id
    @Column(name = "dayNumber", nullable = false)
    private Integer dayNumber;

    @Column(columnDefinition = "text")
    private String story;

    @Column(nullable = false)
    private boolean published = false;

    @Column(nullable = false)
    private boolean highlight = false;

    @Column(name = "heroPhotoId")
    private UUID heroPhotoId;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }

    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }

    public String getStory() { return story; }
    public void setStory(String story) { this.story = story; }

    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }

    public boolean isHighlight() { return highlight; }
    public void setHighlight(boolean highlight) { this.highlight = highlight; }

    public UUID getHeroPhotoId() { return heroPhotoId; }
    public void setHeroPhotoId(UUID heroPhotoId) { this.heroPhotoId = heroPhotoId; }

    public Instant getUpdatedAt() { return updatedAt; }
}
