using System;

namespace DataAccess.Models
{
    public class Song
    {
        public Guid SongID { get; set; }
        public Guid? UserID { get; set; }          // FK to the user who uploaded it
        public string Title { get; set; } = string.Empty;
        public string ArtistName { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public long PlayCount { get; set; }
        public bool IsHidden { get; set; }
        public bool IsDeleted { get; set; } = false;

        // Aliases for compatibility with UI bindings
        public string Name => Title;
        public string Artist => ArtistName;

        // Navigation
        public User? UploadedBy { get; set; }
        public Guid? GenreID { get; set; }  
        public Genre? Genre { get; set; }  

        // New properties for advanced song upload
        public Guid? AlbumID { get; set; }
        public Album? AlbumEntity { get; set; }
        
        public string? CoverArtUrl { get; set; }
        public byte[]? CoverArtData { get; set; }
        
        public byte[]? FileData { get; set; }
        
        public DateTime? ReleaseDate { get; set; }
        public string? Credits { get; set; }
        public string? CollabArtists { get; set; }
        public string? Lyrics { get; set; }

        // AI and Feature fields
        public string? Language { get; set; }
        public string? Mood { get; set; }
        public string? Tags { get; set; }

        // Acoustic Features
        public double? Tempo { get; set; }
        public double? Energy { get; set; }
        public double? Danceability { get; set; }
        public double? Valence { get; set; }
        public double? Acousticness { get; set; }
        public double? Instrumentalness { get; set; }
        public int? Key { get; set; }
        public int? Mode { get; set; }

        // Metadata
        public int? Popularity { get; set; }
        public string? StorageUrl { get; set; }
        public DateTime? UploadedAt { get; set; }
    }
}
