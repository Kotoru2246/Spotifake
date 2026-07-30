using System;

namespace DataAccess.Models
{
    public class UserSavedAlbum
    {
        public Guid SavedID { get; set; }
        public Guid UserID { get; set; }
        public Guid AlbumID { get; set; }
        public DateTime SavedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Album Album { get; set; } = null!;
    }
}
