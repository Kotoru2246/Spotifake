package com.spotifake.model;

public class User {
    private String id;
    private String username;
    private String email;
    private String passwordHash;
    private String role;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private String subscriptionTier;
    private boolean isIncognito;
    private String accountStatus;
    private boolean isEmailVerified;
    private String nationality;
    private String gender;
    private String dateOfBirth;
    private boolean isDeleted;
    private boolean isPremium;
    private boolean isArtist;
    private String createdAt;
    private String updatedAt;

    public User() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getSubscriptionTier() { return subscriptionTier; }
    public void setSubscriptionTier(String subscriptionTier) { this.subscriptionTier = subscriptionTier; }

    public boolean isIncognito() { return isIncognito; }
    public void setIncognito(boolean incognito) { isIncognito = incognito; }

    public String getAccountStatus() { return accountStatus; }
    public void setAccountStatus(String accountStatus) { this.accountStatus = accountStatus; }

    public boolean isEmailVerified() { return isEmailVerified; }
    public void setEmailVerified(boolean emailVerified) { isEmailVerified = emailVerified; }

    public String getNationality() { return nationality; }
    public void setNationality(String nationality) { this.nationality = nationality; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public boolean isDeleted() { return isDeleted; }
    public void setDeleted(boolean deleted) { isDeleted = deleted; }

    public boolean isPremium() { return isPremium; }
    public boolean getIsPremium() { return isPremium; }
    public void setPremium(boolean premium) { isPremium = premium; }
    public void setIsPremium(boolean premium) { isPremium = premium; }

    public boolean isArtist() { return isArtist; }
    public void setArtist(boolean isArtist) { this.isArtist = isArtist; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
