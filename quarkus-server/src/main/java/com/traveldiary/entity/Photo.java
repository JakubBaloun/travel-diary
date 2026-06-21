package com.traveldiary.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

@Entity
@Table(name = "photo", indexes = {
    @Index(columnList = "dayNumber, sortOrder")
})
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Photo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "dayNumber", nullable = false)
    private Integer dayNumber;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(name = "urlMed", nullable = false, length = 500)
    private String urlMed;

    @Column(name = "urlThumb", nullable = false, length = 500)
    private String urlThumb;

    @Column(nullable = false)
    private Integer width;

    @Column(nullable = false)
    private Integer height;

    @Column(nullable = false)
    private boolean wide = false;

    @Column(name = "sortOrder", nullable = false)
    private Integer sortOrder = 0;

    @Column(length = 500)
    private String caption;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getUrlMed() { return urlMed; }
    public void setUrlMed(String urlMed) { this.urlMed = urlMed; }

    public String getUrlThumb() { return urlThumb; }
    public void setUrlThumb(String urlThumb) { this.urlThumb = urlThumb; }

    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }

    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }

    public boolean isWide() { return wide; }
    public void setWide(boolean wide) { this.wide = wide; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public Instant getCreatedAt() { return createdAt; }
}
