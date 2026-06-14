package com.traveldiary.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

import com.traveldiary.enums.EntryType;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "entry", indexes = {
    @Index(columnList = "dayId, sortOrder")
})
public class Entry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "dayId", nullable = false)
    private UUID dayId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntryType type;

    @Column(columnDefinition = "text")
    private String content;

    @Column(length = 500)
    private String photoUrl;

    @Column(length = 500)
    private String caption;

    @Column(name = "sortOrder")
    private Integer sortOrder = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dayId", insertable = false, updatable = false)
    @JsonIgnore
    private Day day;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getDayId() { return dayId; }
    public void setDayId(UUID dayId) { this.dayId = dayId; }

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

    public Instant getCreatedAt() { return createdAt; }

    public Day getDay() { return day; }
    public void setDay(Day day) { this.day = day; }
}
