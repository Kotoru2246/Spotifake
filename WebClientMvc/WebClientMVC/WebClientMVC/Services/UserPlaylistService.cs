using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using WebClientMVC.Models;
using DataAccess;
using DataAccess.Models;

namespace WebClientMVC.Services;

public class UserPlaylistService
{
    private readonly MusicPlayerContext _context;
    private readonly MusicLibraryService _musicLibraryService;

    public UserPlaylistService(MusicPlayerContext context, MusicLibraryService musicLibraryService)
    {
        _context = context;
        _musicLibraryService = musicLibraryService;
    }

    private User GetUser(string username)
    {
        var safe = (username ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(safe))
            throw new InvalidOperationException("User identifier is required.");

        var user = _context.Users.FirstOrDefault(u => u.Username == safe);
        if (user == null)
            throw new InvalidOperationException("User not found in database.");

        return user;
    }

    public IReadOnlyList<PlaylistSummaryDto> GetPlaylists(string username)
    {
        var user = GetUser(username);
        
        var dbPlaylists = _context.Playlists
            .Include(p => p.PlaylistTracks)
                .ThenInclude(pt => pt.Song)
                    .ThenInclude(s => s.AlbumEntity)
            .Where(p => p.OwnerUserID == user.UserID)
            .OrderBy(p => p.Title)
            .ToList();
            
        var dtos = new List<PlaylistSummaryDto>();
        
        // Liked Songs virtual playlist
        var likedSongs = _context.UserFavorites
            .Include(f => f.Song)
                .ThenInclude(s => s.AlbumEntity)
            .Where(f => f.UserID == user.UserID)
            .OrderByDescending(f => f.FavoritedAt)
            .ToList();
            
        dtos.Add(new PlaylistSummaryDto
        {
            Id = "liked-songs-" + username,
            Name = "Liked Songs",
            ImageUrl = "",
            IsPublic = false,
            IsOwner = true,
            SavedAt = DateTime.MaxValue, // Always top
            Type = "Playlist",
            Songs = likedSongs.Select(f => new PlaylistSongDto
            {
                FileName = f.Song?.FilePath ?? "",
                DisplayName = f.Song?.Title ?? "",
                Artist = f.Song?.ArtistName ?? "",
                ArtistId = f.Song?.AlbumEntity?.ArtistID.ToString() ?? "",
                AlbumId = f.Song?.AlbumID?.ToString() ?? "",
                DurationSeconds = f.Song?.DurationSeconds ?? 0
            }).ToList()
        });

        foreach (var p in dbPlaylists)
        {
            dtos.Add(new PlaylistSummaryDto
            {
                Id = p.PlaylistID.ToString(),
                Name = p.Title,
                ImageUrl = p.ImageUrl ?? "",
                IsPublic = p.IsPublic,
                IsOwner = true,
                SavedAt = p.CreatedAt,
                Type = "Playlist",
                Songs = p.PlaylistTracks.OrderBy(pt => pt.AddedAt).Select(pt => new PlaylistSongDto
                {
                    FileName = pt.Song?.FilePath ?? "",
                    DisplayName = pt.Song?.Title ?? "",
                    Artist = pt.Song?.ArtistName ?? "",
                    ArtistId = pt.Song?.AlbumEntity?.ArtistID.ToString() ?? "",
                    AlbumId = pt.Song?.AlbumID?.ToString() ?? "",
                    DurationSeconds = pt.Song?.DurationSeconds ?? 0
                }).ToList()
            });
        }

        // Add saved playlists
        var savedPlaylists = _context.UserSavedPlaylists
            .Include(sp => sp.Playlist)
                .ThenInclude(p => p.PlaylistTracks)
                    .ThenInclude(pt => pt.Song)
                        .ThenInclude(s => s.AlbumEntity)
            .Where(sp => sp.UserID == user.UserID)
            .OrderBy(sp => sp.SavedAt)
            .ToList();

        foreach (var sp in savedPlaylists)
        {
            if (sp.Playlist != null)
            {
                dtos.Add(new PlaylistSummaryDto
                {
                    Id = sp.Playlist.PlaylistID.ToString(),
                    Name = sp.Playlist.Title,
                    ImageUrl = sp.Playlist.ImageUrl ?? "",
                    IsPublic = sp.Playlist.IsPublic,
                    SavedAt = sp.SavedAt,
                    Type = "Playlist",
                    Songs = sp.Playlist.PlaylistTracks.OrderBy(pt => pt.AddedAt).Select(pt => new PlaylistSongDto
                    {
                        FileName = pt.Song?.FilePath ?? "",
                        DisplayName = pt.Song?.Title ?? "",
                        Artist = pt.Song?.ArtistName ?? "",
                        ArtistId = pt.Song?.AlbumEntity?.ArtistID.ToString() ?? "",
                        AlbumId = pt.Song?.AlbumID?.ToString() ?? "",
                        DurationSeconds = pt.Song?.DurationSeconds ?? 0
                    }).ToList()
                });
            }
        }

        // Add saved albums
        var savedAlbums = _context.UserSavedAlbums
            .Include(sa => sa.Album)
            .Where(sa => sa.UserID == user.UserID)
            .ToList();
            
        var albumIds = savedAlbums.Select(sa => sa.AlbumID).ToList();
        var albumSongs = _context.Songs.Where(s => s.AlbumID != null && albumIds.Contains(s.AlbumID.Value)).ToList();

        foreach (var sa in savedAlbums)
        {
            if (sa.Album != null)
            {
                var songsForAlbum = albumSongs.Where(s => s.AlbumID == sa.AlbumID).ToList();
                dtos.Add(new PlaylistSummaryDto
                {
                    Id = sa.Album.AlbumID.ToString(),
                    Name = sa.Album.Title,
                    ImageUrl = sa.Album.CoverArtUrl ?? "",
                    IsPublic = true,
                    SavedAt = sa.SavedAt,
                    Type = "Album",
                    Songs = songsForAlbum.Select(s => new PlaylistSongDto
                    {
                        FileName = s.FilePath ?? "",
                        DisplayName = s.Title ?? "",
                        Artist = s.ArtistName ?? "",
                        ArtistId = s.AlbumEntity?.ArtistID.ToString() ?? "",
                        AlbumId = s.AlbumID?.ToString() ?? "",
                        DurationSeconds = s.DurationSeconds
                    }).ToList()
                });
            }
        }

        // Sort by SavedAt descending, but keep Liked Songs at top
        var sorted = dtos.OrderByDescending(d => d.SavedAt).ToList();
        return sorted;
    }

    public IReadOnlyList<PlaylistSummaryDto> CreatePlaylist(string username, string name, string imageUrl, IReadOnlyList<string>? songFileNames = null)
    {
        var user = GetUser(username);
        var safeName = (name ?? string.Empty).Trim();
        var safeImageUrl = (imageUrl ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(safeName))
            throw new InvalidOperationException("Playlist name is required.");

        if (_context.Playlists.Any(p => p.OwnerUserID == user.UserID && p.Title == safeName))
            throw new InvalidOperationException("A playlist with this name already exists.");

        var playlist = new Playlist
        {
            PlaylistID = Guid.NewGuid(),
            OwnerUserID = user.UserID,
            Title = safeName,
            ImageUrl = safeImageUrl,
            IsPublic = true,
            CreatedAt = DateTime.UtcNow
        };

        if (songFileNames != null)
        {
            foreach (var fn in songFileNames)
            {
                var song = _context.Songs.FirstOrDefault(s => s.FilePath == fn || s.Title == fn);
                if (song != null)
                {
                    playlist.PlaylistTracks.Add(new PlaylistTrack
                    {
                        MappingID = Guid.NewGuid(),
                        PlaylistID = playlist.PlaylistID,
                        SongID = song.SongID,
                        AddedAt = DateTime.UtcNow
                    });
                }
            }
        }

        _context.Playlists.Add(playlist);
        _context.SaveChanges();

        return GetPlaylists(username);
    }

    public IReadOnlyList<PlaylistSummaryDto> DeletePlaylist(string username, string playlistId)
    {
        var user = GetUser(username);
        if (playlistId.StartsWith("liked-songs-"))
            throw new InvalidOperationException("The Liked Songs playlist cannot be deleted.");

        if (Guid.TryParse(playlistId, out var id))
        {
            var playlist = _context.Playlists.FirstOrDefault(p => p.PlaylistID == id && p.OwnerUserID == user.UserID);
            if (playlist != null)
            {
                _context.Playlists.Remove(playlist);
                _context.SaveChanges();
            }
            else
            {
                // Try removing from saved playlists
                var saved = _context.UserSavedPlaylists.FirstOrDefault(sp => sp.PlaylistID == id && sp.UserID == user.UserID);
                if (saved != null)
                {
                    _context.UserSavedPlaylists.Remove(saved);
                    _context.SaveChanges();
                }
                else
                {
                    throw new InvalidOperationException("Playlist not found or you don't have permission.");
                }
            }
        }
        else
        {
            throw new InvalidOperationException("Invalid playlist ID.");
        }

        return GetPlaylists(username);
    }

    public IReadOnlyList<PlaylistSummaryDto> AddSong(string username, string playlistId, string fileName)
    {
        var user = GetUser(username);
        var song = _context.Songs.FirstOrDefault(s => s.FilePath == fileName || s.Title == fileName);
        if (song == null) throw new InvalidOperationException("Song not found.");

        if (playlistId.StartsWith("liked-songs-"))
        {
            return ToggleLikedSong(username, fileName);
        }

        if (Guid.TryParse(playlistId, out var id))
        {
            var playlist = _context.Playlists.Include(p => p.PlaylistTracks).FirstOrDefault(p => p.PlaylistID == id && p.OwnerUserID == user.UserID);
            if (playlist == null) throw new InvalidOperationException("Playlist not found or no permission.");

            if (playlist.PlaylistTracks.Any(pt => pt.SongID == song.SongID))
                throw new InvalidOperationException("Song already exists in this playlist.");

            playlist.PlaylistTracks.Add(new PlaylistTrack
            {
                MappingID = Guid.NewGuid(),
                PlaylistID = playlist.PlaylistID,
                SongID = song.SongID,
                AddedAt = DateTime.UtcNow
            });
            _context.SaveChanges();
        }

        return GetPlaylists(username);
    }

    public IReadOnlyList<PlaylistSummaryDto> RemoveSong(string username, string playlistId, string fileName)
    {
        var user = GetUser(username);
        var song = _context.Songs.FirstOrDefault(s => s.FilePath == fileName || s.Title == fileName);
        if (song == null) throw new InvalidOperationException("Song not found.");

        if (playlistId.StartsWith("liked-songs-"))
        {
            return ToggleLikedSong(username, fileName);
        }

        if (Guid.TryParse(playlistId, out var id))
        {
            var playlist = _context.Playlists.Include(p => p.PlaylistTracks).FirstOrDefault(p => p.PlaylistID == id && p.OwnerUserID == user.UserID);
            if (playlist == null) throw new InvalidOperationException("Playlist not found or no permission.");

            var track = playlist.PlaylistTracks.FirstOrDefault(pt => pt.SongID == song.SongID);
            if (track != null)
            {
                _context.PlaylistTracks.Remove(track);
                _context.SaveChanges();
            }
            else
            {
                throw new InvalidOperationException("Song is not in this playlist.");
            }
        }

        return GetPlaylists(username);
    }

    public IReadOnlyList<PlaylistSummaryDto> ToggleLikedSong(string username, string fileName)
    {
        var user = GetUser(username);
        var song = _context.Songs.FirstOrDefault(s => s.FilePath == fileName || s.Title == fileName);
        if (song == null) throw new InvalidOperationException("Song not found.");

        var fav = _context.UserFavorites.FirstOrDefault(f => f.UserID == user.UserID && f.SongID == song.SongID);
        if (fav != null)
        {
            _context.UserFavorites.Remove(fav);
        }
        else
        {
            _context.UserFavorites.Add(new UserFavorite
            {
                FavoriteID = Guid.NewGuid(),
                UserID = user.UserID,
                SongID = song.SongID,
                FavoritedAt = DateTime.UtcNow
            });
        }
        _context.SaveChanges();

        return GetPlaylists(username);
    }

    public void UpdatePlaylistVisibility(string username, string playlistId, bool isPublic)
    {
        var user = GetUser(username);
        if (Guid.TryParse(playlistId, out var id))
        {
            var playlist = _context.Playlists.FirstOrDefault(p => p.PlaylistID == id && p.OwnerUserID == user.UserID);
            if (playlist != null)
            {
                playlist.IsPublic = isPublic;
                _context.SaveChanges();
            }
            else
            {
                throw new InvalidOperationException("Playlist not found or you don't have permission.");
            }
        }
    }
}
