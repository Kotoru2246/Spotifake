package com.spotifake.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.ArrayList;
import java.util.List;

public class Album {
    private String id;
    private String title;
    private String artistId;
    private String description;
    private String coverArtUrl;
    @JsonIgnore
    private byte[] coverArtData;
    private String createdAt;
    private boolean isDeleted;
    private int songCount;
    private long totalStreams;
    private List<Song> songs = new ArrayList<>();

    public Album() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtistId() { return artistId; }
    public void setArtistId(String artistId) { this.artistId = artistId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCoverArtUrl() { return coverArtUrl; }
    public void setCoverArtUrl(String coverArtUrl) { this.coverArtUrl = coverArtUrl; }

    public byte[] getCoverArtData() { return coverArtData; }
    public void setCoverArtData(byte[] coverArtData) { this.coverArtData = coverArtData; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public int getSongCount() { return songCount; }
    public void setSongCount(int songCount) { this.songCount = songCount; }

    public long getTotalStreams() { return totalStreams; }
    public void setTotalStreams(long totalStreams) { this.totalStreams = totalStreams; }

    public List<Song> getSongs() { return songs; }
    public void setSongs(List<Song> songs) { this.songs = songs; }
}
