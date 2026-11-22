package com.spotifake.dto;

import com.spotifake.model.User;

public class AuthDto {
    public static class LoginRequest {
        private String username;
        private String password;

        public LoginRequest() {}
        public LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        @com.fasterxml.jackson.annotation.JsonAlias({"display_name", "displayName", "name"})
        private String displayName;

        public RegisterRequest() {}

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getDisplayName() { return displayName != null && !displayName.isBlank() ? displayName : username; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }
        public void setDisplay_name(String displayName) { this.displayName = displayName; }
    }

    public static class AuthResponse {
        private boolean success;
        private String message;
        private String token;
        private User user;

        public AuthResponse() {}
        public AuthResponse(boolean success, String message, String token, User user) {
            this.success = success;
            this.message = message;
            this.token = token;
            this.user = user;
        }

        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public User getUser() { return user; }
        public void setUser(User user) { this.user = user; }
    }

    public static class UpdateProfileRequest {
        private String displayName;
        private String bio;
        private String nationality;
        private String gender;
        private String dateOfBirth;

        public UpdateProfileRequest() {}

        public String getDisplayName() { return displayName; }
        public void setDisplayName(String displayName) { this.displayName = displayName; }

        public String getBio() { return bio; }
        public void setBio(String bio) { this.bio = bio; }

        public String getNationality() { return nationality; }
        public void setNationality(String nationality) { this.nationality = nationality; }

        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }

        public String getDateOfBirth() { return dateOfBirth; }
        public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    }

    public static class ChangePasswordRequest {
        private String oldPassword;
        private String newPassword;

        public ChangePasswordRequest() {}

        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}
