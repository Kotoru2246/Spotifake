

--- VERSION ---

using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
    public class Album
    {
        public Guid AlbumID { get; set; }
        public Guid ArtistID { get; set; }
        public string Title { get; set; } = string.Empty;
        
        public string? CoverArtUrl { get; set; }
        public byte[]? CoverArtData { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ArtistProfile? Artist { get; set; }
        public ICollection<Song> Songs { get; set; } = new List<Song>();
    }
}


--- VERSION ---

using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
    public class Album
    {
        public Guid AlbumID { get; set; }
        public Guid ArtistID { get; set; }
        public string Title { get; set; } = string.Empty;
        
        public string? CoverArtUrl { get; set; }
        public byte[]? CoverArtData { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ArtistProfile? Artist { get; set; }
        public ICollection<Song> Songs { get; set; } = new List<Song>();
    }
}


--- VERSION ---

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;
        public string Description { get; set; } = string.Empty;