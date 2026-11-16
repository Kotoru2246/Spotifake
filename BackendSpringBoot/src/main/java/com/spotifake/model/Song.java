package com.spotifake.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class Song {
    private String id;
    private String source;
    private String sourceId;
    private String title;
    private String artist;
    private String collabArtists;
    private String album;
    private String albumId;
    private long durationMs;
    private String uri;
    private int popularity;
    private String genreId;
    private String genre;
    private String mood;
    private String language;
    private double tempo;
    private double energy;
    private double danceability;
    private double valence;
    private double acousticness;
    private double instrumentalness;
    private int key;
    private int mode;
    private String tags;
    private String filePath;
    private byte[] fileData;
    private String storageUrl;
    private String coverArtUrl;
    private byte[] coverArtData;
    private String releaseDate;
    private String credits;
    private String lyrics;
    private String uploadedAt;
    private String userId;
    private long playCount;
    private boolean isDeleted;
    private boolean isHidden;

    public Song() {}

    public String getGenreId() { return genreId; }
    public void setGenreId(String genreId) { this.genreId = genreId; }


    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getSourceId() { return sourceId; }
    public void setSourceId(String sourceId) { this.sourceId = sourceId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getCollabArtists() { return collabArtists; }
    public void setCollabArtists(String collabArtists) { this.collabArtists = collabArtists; }

    public String getAlbum() { return album; }
    public void setAlbum(String album) { this.album = album; }

    public String getAlbumId() { return albumId; }
    public void setAlbumId(String albumId) { this.albumId = albumId; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public String getUri() { return uri; }
    public void setUri(String uri) { this.uri = uri; }

    public int getPopularity() { return popularity; }
    public void setPopularity(int popularity) { this.popularity = popularity; }

    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }

    public String getMood() { return mood; }
    public void setMood(String mood) { this.mood = mood; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public double getTempo() { return tempo; }
    public void setTempo(double tempo) { this.tempo = tempo; }

    public double getEnergy() { return energy; }
    public void setEnergy(double energy) { this.energy = energy; }

    public double getDanceability() { return danceability; }
    public void setDanceability(double danceability) { this.danceability = danceability; }

    public double getValence() { return valence; }
    public void setValence(double valence) { this.valence = valence; }

    public double getAcousticness() { return acousticness; }
    public void setAcousticness(double acousticness) { this.acousticness = acousticness; }

    public double getInstrumentalness() { return instrumentalness; }
    public void setInstrumentalness(double instrumentalness) { this.instrumentalness = instrumentalness; }

    public int getKey() { return key; }
    public void setKey(int key) { this.key = key; }

    public int getMode() { return mode; }
    public void setMode(int mode) { this.mode = mode; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    @JsonIgnore
    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public String getStorageUrl() { return storageUrl; }
    public void setStorageUrl(String storageUrl) { this.storageUrl = storageUrl; }

    public String getCoverArtUrl() { return coverArtUrl; }
    public void setCoverArtUrl(String coverArtUrl) { this.coverArtUrl = coverArtUrl; }

    @JsonIgnore
    public byte[] getCoverArtData() { return coverArtData; }
    public void setCoverArtData(byte[] coverArtData) { this.coverArtData = coverArtData; }

    public String getReleaseDate() { return releaseDate; }
    public void setReleaseDate(String releaseDate) { this.releaseDate = releaseDate; }

    public String getCredits() { return credits; }
    public void setCredits(String credits) { this.credits = credits; }

    public String getLyrics() { return lyrics; }
    public void setLyrics(String lyrics) { this.lyrics = lyrics; }

    public String getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(String uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public long getPlayCount() { return playCount; }
    public void setPlayCount(long playCount) { this.playCount = playCount; }
    public void setPlayCount(int playCount) { this.playCount = playCount; }


    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public boolean isHidden() { return isHidden; }
    public void setHidden(boolean hidden) { isHidden = hidden; }
}
