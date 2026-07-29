

--- VERSION ---

using System;

namespace DataAccess.Models
{
    public class ArtistRequest
    {
        public Guid RequestID { get; set; } = Guid.NewGuid();
        public Guid UserID { get; set; }
        public string StageName { get; set; } = string.Empty;

        // CV file (stored as binary)
        public byte[]? CvFileData { get; set; }
        public string CvFileName { get; set; } = string.Empty;

        // Demo audio file (stored as binary)
        public byte[]? DemoFileData { get; set; }
        public string DemoFileName { get; set; } = string.Empty;

        // Status: Pending, Approved, Rejected
        public string Status { get; set; } = "Pending";
        public string AdminNotes { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}
