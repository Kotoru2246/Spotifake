using System;
using System.Collections.Generic;
using System.Linq;
using DataAccess.Models;

namespace DataAccess.Services
{
    public class AdminService
    {
        private readonly MusicPlayerContext _context;

        public AdminService(MusicPlayerContext context)
        {
            _context = context;
        }

        public void HideSong(Guid songId)
        {
            var song = _context.Songs.Find(songId);
            if (song == null) return;
            song.IsHidden = true;
            _context.SaveChanges();
        }

        public void UpdateMetadata(Guid songId, string? title = null, string? artist = null)
        {
            var song = _context.Songs.Find(songId);
            if (song == null) return;

            if (!string.IsNullOrWhiteSpace(title)) song.Title = title;
            if (!string.IsNullOrWhiteSpace(artist)) song.ArtistName = artist;
            _context.SaveChanges();
        }

        public void GlobalMetadataOverwrite(Func<Song, bool> filter, Action<Song> patch)
        {
            var songs = _context.Songs.Where(filter).ToList();
            foreach (var song in songs)
            {
                patch(song);
            }
            _context.SaveChanges();
        }
    }
}
