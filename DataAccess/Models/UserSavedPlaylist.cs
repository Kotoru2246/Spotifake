using System;

namespace DataAccess.Models
{
    public class UserSavedPlaylist
    {
        public Guid SavedID { get; set; }
        public Guid UserID { get; set; }
        public Guid PlaylistID { get; set; }
        public DateTime SavedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Playlist Playlist { get; set; } = null!;
    }
}
