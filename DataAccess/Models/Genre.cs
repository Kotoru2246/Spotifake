using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
    /// <summary>
    /// Music genres for categorization
    /// Better than storing genre as string in Song model
    /// </summary>
    public class Genre
    {
        public Guid GenreID { get; set; } = Guid.NewGuid();

        // Basic Info
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Color { get; set; } = "#808080";

        // SEO & Display
        public string Slug { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
        public int SongCount { get; set; } = 0;

        // Metadata
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public List<Song> Songs { get; set; } = new();
    }
}