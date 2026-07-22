using System;

namespace DataAccess.Models
{
    /// <summary>
    /// Tracks every song play by users for recommendations and analytics
    /// This will eventually sync to MongoDB for big data analytics
    /// </summary>
    public class UserListeningHistory
    {
        public Guid HistoryID { get; set; } = Guid.NewGuid();

        // Foreign Keys
        public Guid UserID { get; set; }
        public Guid SongID { get; set; }

        // Listening Details
        public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
        public int SecondsListened { get; set; }
        public bool IsSkipped { get; set; } = false;
        public bool IsCompleted { get; set; } = false;

        // Device & Session Info
        public string? DeviceType { get; set; }
        public string? SessionID { get; set; }
        public string? Quality { get; set; }
        public bool IsOffline { get; set; } = false;

        // Navigation Properties
        public User? User { get; set; }
        public Song? Song { get; set; }

        // Helper Property
        public double ListeningPercentage =>
            SecondsListened > 0 ? (double)SecondsListened / (Song?.DurationSeconds ?? 1) * 100 : 0;
    }
}