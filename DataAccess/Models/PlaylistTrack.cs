using System;

namespace DataAccess.Models
{
    public class PlaylistTrack
    {
        public Guid MappingID { get; set; }
        public Guid PlaylistID { get; set; }
        public Guid SongID { get; set; }
        public int TrackOrder { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        public Playlist? Playlist { get; set; }
        public Song? Song { get; set; }
    }
}
