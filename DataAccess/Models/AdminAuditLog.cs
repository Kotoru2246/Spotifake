using System;

namespace DataAccess.Models
{
    public class AdminAuditLog
    {
        public Guid LogID { get; set; }
        public Guid AdminID { get; set; }
        public string Action { get; set; } = string.Empty;    // e.g. "DELETE_SONG", "BAN_USER", "VERIFY_ARTIST"
        public string TargetType { get; set; } = string.Empty; // e.g. "song", "user", "playlist"
        public string TargetID { get; set; } = string.Empty;
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        // Navigation
        public User Admin { get; set; } = null!;
    }
}

