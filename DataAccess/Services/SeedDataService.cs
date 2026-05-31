using System;
using System.Collections.Generic;
using DataAccess.Models;

namespace DataAccess.Services
{
    public class SeedDataService
    {
        private readonly MusicPlayerContext _context;
        private readonly MusicScannerService _scannerService;

        public SeedDataService(MusicPlayerContext context)
        {
            _context = context;
            _scannerService = new MusicScannerService();
        }

        public void SeedSampleSongs()
        {
            // Check if songs already exist
            if (_context.Songs.Any())
            {
                return;
            }

            // Scan C:\Music directory for audio files
            var musicDirPath = "C:\\Music";
            var scannedSongs = _scannerService.ScanMusicDirectory(musicDirPath);

            if (scannedSongs.Any())
            {
                // Add scanned songs to database
                foreach (var (filePath, title, artist, duration) in scannedSongs)
                {
                    var song = new Song
                    {
                        SongID = Guid.NewGuid(),
                        Title = title,
                        ArtistName = artist,
                        DurationSeconds = duration,
                        FilePath = filePath,
                        PlayCount = 0,
                        IsHidden = false
                    };

                    _context.Songs.Add(song);
                }

                _context.SaveChanges();
            }
            // If no music files found, don't seed sample data - leave empty
        }

        public void SeedSampleUsers()
        {
            // Check if users already exist
            if (_context.Users.Any())
            {
                return;
            }

            var sampleUsers = new List<User>
            {
                new User
                {
                    UserID = Guid.NewGuid(),
                    Email = "demo@musicplayer.local",
                    PasswordHash = "hashed_password_placeholder",
                    SubscriptionTier = "Premium",
                    IsIncognito = false,
                    AccountStatus = "Active"
                }
            };

            _context.Users.AddRange(sampleUsers);
            _context.SaveChanges();
        }
    }
}

