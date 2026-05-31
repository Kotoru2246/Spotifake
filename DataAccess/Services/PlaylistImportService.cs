using System;
using System.Collections.Generic;
using System.Linq;
using DataAccess.Models;

namespace DataAccess.Services
{
    public class PlaylistImportService
    {
        private readonly MusicPlayerContext _context;

        public PlaylistImportService(MusicPlayerContext context)
        {
            _context = context;
        }

        public List<Song> MapExternalTrackIds(IEnumerable<Guid> externalSongIds)
        {
            return _context.Songs
                .Where(song => externalSongIds.Contains(song.SongID) && !song.IsHidden)
                .ToList();
        }

        public Playlist ImportPlaylist(Guid ownerUserId, string title, IEnumerable<Guid> mappedSongIds, bool isPublic = false)
        {
            var playlist = new Playlist
            {
                PlaylistID = Guid.NewGuid(),
                OwnerUserID = ownerUserId,
                Title = title,
                IsPublic = isPublic
            };

            var trackOrder = 0;
            foreach (var songId in mappedSongIds)
            {
                playlist.PlaylistTracks.Add(new PlaylistTrack
                {
                    MappingID = Guid.NewGuid(),
                    PlaylistID = playlist.PlaylistID,
                    SongID = songId,
                    TrackOrder = trackOrder++
                });
            }

            _context.Playlists.Add(playlist);
            _context.SaveChanges();
            return playlist;
        }
    }
}
