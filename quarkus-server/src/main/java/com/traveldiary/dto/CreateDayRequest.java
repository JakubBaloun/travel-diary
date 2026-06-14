package com.traveldiary.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class CreateDayRequest {

    @NotNull
    private Integer dayNumber;

    @NotNull
    private LocalDate date;

    private String title;
    private String summary;
    private String coverPhotoUrl;

    public Integer getDayNumber() { return dayNumber; }
    public void setDayNumber(Integer dayNumber) { this.dayNumber = dayNumber; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getCoverPhotoUrl() { return coverPhotoUrl; }
    public void setCoverPhotoUrl(String coverPhotoUrl) { this.coverPhotoUrl = coverPhotoUrl; }
}
