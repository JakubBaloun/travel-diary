package com.traveldiary.dto;

public class UpdatePhotoRequest {

    private String caption;
    private Boolean wide;
    private boolean clearCaption;

    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }

    public Boolean getWide() { return wide; }
    public void setWide(Boolean wide) { this.wide = wide; }

    public boolean isClearCaption() { return clearCaption; }
    public void setClearCaption(boolean clearCaption) { this.clearCaption = clearCaption; }
}
