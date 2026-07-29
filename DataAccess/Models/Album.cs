using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
    public class Album
    {
        public Guid AlbumID { get; set; }
        public Guid ArtistID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CoverArtUrl { get; set; }
        public byte[]? CoverArtData { get; set; }
        public bool IsDeleted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ArtistProfile ArtistProfile { get; set; } = null!;
        public List<Song> Songs { get; set; } = new();
    }
}