package com.spotifake.model;

public class Advertisement {
    private int id;
    private String title;
    private String sponsor;
    private String adType; // "audio", "banner"
    private String mediaUrl;
    private String clickUrl;
    private int impressions;
    private int clicks;
    private boolean active;
    private String createdAt;

    public Advertisement() {}

    public Advertisement(int id, String title, String sponsor, String adType, String mediaUrl, String clickUrl, int impressions, int clicks, boolean active, String createdAt) {
        this.id = id;
        this.title = title;
        this.sponsor = sponsor;
        this.adType = adType;
        this.mediaUrl = mediaUrl;
        this.clickUrl = clickUrl;
        this.impressions = impressions;
        this.clicks = clicks;
        this.active = active;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSponsor() { return sponsor; }
    public void setSponsor(String sponsor) { this.sponsor = sponsor; }

    public String getAdType() { return adType; }
    public void setAdType(String adType) { this.adType = adType; }

    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }

    public String getClickUrl() { return clickUrl; }
    public void setClickUrl(String clickUrl) { this.clickUrl = clickUrl; }

    public int getImpressions() { return impressions; }
    public void setImpressions(int impressions) { this.impressions = impressions; }

    public int getClicks() { return clicks; }
    public void setClicks(int clicks) { this.clicks = clicks; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public double getCtr() {
        if (impressions == 0) return 0.0;
        return Math.round(((double) clicks / impressions * 100.0) * 10.0) / 10.0;
    }
}
