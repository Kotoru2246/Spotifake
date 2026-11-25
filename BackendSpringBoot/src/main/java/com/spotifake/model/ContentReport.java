package com.spotifake.model;

public class ContentReport {
    private int id;
    private String itemType; // "Song", "User", "Artist"
    private int itemId;
    private String itemTitle;
    private String reason; // "Copyright/DMCA", "Explicit Content", "Broken Audio", "Spam", "Impersonation"
    private String description;
    private String status; // "Pending", "Resolved", "Dismissed", "ActionTaken"
    private String reportedBy;
    private String createdAt;
    private String resolvedBy;
    private String resolutionNotes;

    public ContentReport() {}

    public ContentReport(int id, String itemType, int itemId, String itemTitle, String reason, String description, String status, String reportedBy, String createdAt, String resolvedBy, String resolutionNotes) {
        this.id = id;
        this.itemType = itemType;
        this.itemId = itemId;
        this.itemTitle = itemTitle;
        this.reason = reason;
        this.description = description;
        this.status = status;
        this.reportedBy = reportedBy;
        this.createdAt = createdAt;
        this.resolvedBy = resolvedBy;
        this.resolutionNotes = resolutionNotes;
    }

    private String songId = "";

    public String getSongId() { return songId; }
    public void setSongId(String songId) { this.songId = songId != null ? songId : ""; }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getItemType() { return itemType; }
    public void setItemType(String itemType) { this.itemType = itemType; }

    public int getItemId() { return itemId; }
    public void setItemId(int itemId) { this.itemId = itemId; }

    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(String resolvedBy) { this.resolvedBy = resolvedBy; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
