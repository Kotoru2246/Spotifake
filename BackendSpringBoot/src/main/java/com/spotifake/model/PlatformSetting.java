package com.spotifake.model;

public class PlatformSetting {
    private String key;
    private String value;
    private String description;
    private String category;
    private String updatedAt;

    public PlatformSetting() {}

    public PlatformSetting(String key, String value, String description, String category, String updatedAt) {
        this.key = key;
        this.value = value;
        this.description = description;
        this.category = category;
        this.updatedAt = updatedAt;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
