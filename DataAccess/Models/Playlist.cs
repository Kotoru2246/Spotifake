using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
    public class Playlist
    {
        public Guid PlaylistID { get; set; }
        public Guid OwnerUserID { get; set; }
        public string Title { get; set; } = string.Empty;
        public bool IsPublic { get; set; }

        public List<PlaylistTrack> PlaylistTracks { get; set; } = new();
    }
}
