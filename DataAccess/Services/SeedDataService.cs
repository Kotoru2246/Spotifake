using System;
using System.Collections.Generic;
using DataAccess.Models;

namespace DataAccess.Services
{
    public class SeedDataService
    {
        private readonly MusicPlayerContext _context;

        public SeedDataService(MusicPlayerContext context)
        {
            _context = context;
        }

        public void SeedSampleSongs()
        {
            // Check if songs already exist
            if (_context.Songs.Any())
            {
                return;
            }

            var sampleSongs = new List<Song>
            {
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000001"),
                    Title = "Midnight Echoes",
                    ArtistName = "Luna Wave",
                    DurationSeconds = 240,
                    FilePath = "C:\\Music\\midnight_echoes.mp3",
                    PlayCount = 12,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000002"),
                    Title = "Electric Dreams",
                    ArtistName = "Neon Pulse",
                    DurationSeconds = 215,
                    FilePath = "C:\\Music\\electric_dreams.mp3",
                    PlayCount = 8,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000003"),
                    Title = "Sunset Boulevard",
                    ArtistName = "Golden Hour",
                    DurationSeconds = 265,
                    FilePath = "C:\\Music\\sunset_boulevard.mp3",
                    PlayCount = 5,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000004"),
                    Title = "Neon Nights",
                    ArtistName = "Synthetic Souls",
                    DurationSeconds = 220,
                    FilePath = "C:\\Music\\neon_nights.mp3",
                    PlayCount = 15,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000005"),
                    Title = "Ocean Waves",
                    ArtistName = "Sea Glass",
                    DurationSeconds = 180,
                    FilePath = "C:\\Music\\ocean_waves.mp3",
                    PlayCount = 3,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000006"),
                    Title = "Starlight",
                    ArtistName = "Cosmos Drift",
                    DurationSeconds = 245,
                    FilePath = "C:\\Music\\starlight.mp3",
                    PlayCount = 20,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000007"),
                    Title = "Urban Jungle",
                    ArtistName = "City Lights",
                    DurationSeconds = 195,
                    FilePath = "C:\\Music\\urban_jungle.mp3",
                    PlayCount = 7,
                    IsHidden = false
                },
                new Song
                {
                    SongID = new Guid("00000000-0000-0000-0000-000000000008"),
                    Title = "Crystalline",
                    ArtistName = "Ice Queen",
                    DurationSeconds = 210,
                    FilePath = "C:\\Music\\crystalline.mp3",
                    PlayCount = 11,
                    IsHidden = false
                }
            };

            _context.Songs.AddRange(sampleSongs);
            _context.SaveChanges();
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
