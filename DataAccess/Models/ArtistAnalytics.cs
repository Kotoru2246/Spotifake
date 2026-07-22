using System;

namespace DataAccess.Models
{
    /// <summary>
    /// Daily analytics for artists
    /// Aggregated from UserListeningHistory
    /// Synced daily to MongoDB for historical analysis
    /// </summary>
    public class ArtistAnalytics
    {
        public Guid AnalyticsID { get; set; } = Guid.NewGuid();

        // Foreign Key
        public Guid ArtistID { get; set; }

        // Time Period (daily snapshot)
        public DateTime Date { get; set; } = DateTime.UtcNow.Date;

        // Listening Metrics
        public int TotalPlays { get; set; } = 0;
        public int UniqueListeners { get; set; } = 0;
        public double AverageDurationListened { get; set; } = 0;
        public double SkipRate { get; set; } = 0;
        public double CompletionRate { get; set; } = 0;

        // Follower Metrics
        public int NewFollowers { get; set; } = 0;
        public int TotalFollowers { get; set; } = 0;

        // Engagement
        public int NewFavorites { get; set; } = 0;
        public int PlaylistAdditions { get; set; } = 0;

        // Geography
        public string? TopCountry { get; set; }
        public string? TopCity { get; set; }

        // Revenue
        public decimal EstimatedRevenue { get; set; } = 0m;

        // Navigation Properties
        public ArtistProfile? Artist { get; set; }
    }
}