using System;

namespace DataAccess.Models
{
    public class ArtistProfile
    {
        public Guid ArtistID { get; set; }
        public Guid UserID { get; set; }
        public string StageName { get; set; } = string.Empty;
        public string Bio { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public bool Verified { get; set; } = false;
        public int FollowersCount { get; set; } = 0;
        public string Website { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}



--- VERSION ---

        public int FollowersCount { get; set; } = 0;
        public string Website { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

--- VERSION ---

        public bool Verified { get; set; } = false;
        public int FollowersCount { get; set; } = 0;
        public string Website { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";

        // New fields
        public DateTime? DateOfBirth { get; set; }
        public string Nationality { get; set; } = string.Empty;
        public bool IsDeleted { get; set; } = false;
        public string ProfileImageUrl { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;