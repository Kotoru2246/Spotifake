using System;

namespace DataAccess.Models
{
    public class Song
    {
        public Guid SongID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public long PlayCount { get; set; }
        public bool IsHidden { get; set; }

        // Aliases for compatibility with UI bindings
        public string Name => Title;
        public string Artist => ArtistName;
    }
}