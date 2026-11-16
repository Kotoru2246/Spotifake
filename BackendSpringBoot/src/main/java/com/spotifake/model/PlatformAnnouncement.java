package com.spotifake.model;

public class PlatformAnnouncement {
    private int id;
    private String title;
    private String message;
    private String level; // "info", "warning", "promo", "success"
    private String targetRole; // "all", "user", "artist", "premium"
    private boolean active;
    private String createdAt;

    public PlatformAnnouncement() {}

    public PlatformAnnouncement(int id, String title, String message, String level, String targetRole, boolean active, String createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.level = level;
        this.targetRole = targetRole;
        this.active = active;
        this.createdAt = createdAt;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
