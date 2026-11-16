package com.spotifake.model;

public class ArtistRequest {
    private String requestId;
    private String userId;
    private String stageName;
    private String status;
    private String cvFileName;
    private byte[] cvFileData;
    private String demoFileName;
    private byte[] demoFileData;
    private String adminNotes;
    private String createdAt;
    private String resolvedAt;
    private User user;

    public ArtistRequest() {}

    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getStageName() { return stageName; }
    public void setStageName(String stageName) { this.stageName = stageName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCvFileName() { return cvFileName; }
    public void setCvFileName(String cvFileName) { this.cvFileName = cvFileName; }

    public byte[] getCvFileData() { return cvFileData; }
    public void setCvFileData(byte[] cvFileData) { this.cvFileData = cvFileData; }

    public String getDemoFileName() { return demoFileName; }
    public void setDemoFileName(String demoFileName) { this.demoFileName = demoFileName; }

    public byte[] getDemoFileData() { return demoFileData; }
    public void setDemoFileData(byte[] demoFileData) { this.demoFileData = demoFileData; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(String resolvedAt) { this.resolvedAt = resolvedAt; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
