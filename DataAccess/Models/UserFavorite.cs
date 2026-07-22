using System;

namespace DataAccess.Models
{
    /// <summary>
    /// User's favorite/liked songs
    /// Quick access without querying listening history
    /// </summary>
    public class UserFavorite
    {
        public Guid FavoriteID { get; set; } = Guid.NewGuid();

        // Foreign Keys
        public Guid UserID { get; set; }
        public Guid SongID { get; set; }

        // Metadata
        public DateTime FavoritedAt { get; set; } = DateTime.UtcNow;
        public int Rating { get; set; } = 5;
        public string? Notes { get; set; }

        // Navigation Properties
        public User? User { get; set; }
        public Song? Song { get; set; }
    }
}