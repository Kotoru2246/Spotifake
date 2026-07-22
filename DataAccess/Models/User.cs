using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
    public class User
    {
        public Guid UserID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "user";        // "user", "artist", "admin"
        public string DisplayName { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public string SubscriptionTier { get; set; } = "Free";
        public bool IsIncognito { get; set; }
        public string AccountStatus { get; set; } = "Active";
        public bool IsEmailVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public List<Playlist> Playlists { get; set; } = new();
        public List<UserSession> Sessions { get; set; } = new();
        public ArtistProfile? ArtistProfile { get; set; }
        public List<AdminAuditLog> AdminActions { get; set; } = new();
    }
}
