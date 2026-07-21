using System;

namespace DataAccess.Models
{
    /// <summary>
    /// User follows another user (for artist discovery and social features)
    /// </summary>
    public class UserFollowing
    {
        public Guid FollowingID { get; set; } = Guid.NewGuid();

        // Foreign Keys
        public Guid FollowerUserID { get; set; }
        public Guid FollowedUserID { get; set; }

        // Metadata
        public DateTime FollowedAt { get; set; } = DateTime.UtcNow;
        public bool IsMuted { get; set; } = false;
        public string? Notes { get; set; }

        // Navigation Properties
        public User? FollowerUser { get; set; }
        public User? FollowedUser { get; set; }
    }
}