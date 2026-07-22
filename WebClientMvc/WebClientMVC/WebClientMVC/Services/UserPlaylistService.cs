using System.Text.Json;
using WebClientMVC.Models;

namespace WebClientMVC.Services;

public class UserPlaylistService
{
    private readonly object _syncRoot = new();
    private readonly string _storagePath;
    private readonly MusicLibraryService _musicLibraryService;
    private readonly Dictionary<string, List<PlaylistRecord>> _data;

    public UserPlaylistService(IWebHostEnvironment environment, MusicLibraryService musicLibraryService)
    {
        _musicLibraryService = musicLibraryService;
        var dataFolder = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dataFolder);
        _storagePath = Path.Combine(dataFolder, "user-playlists.json");
        _data = Load();
    }

    public IReadOnlyList<PlaylistSummaryDto> GetPlaylists(string username)
    {
        var userKey = NormalizeUser(username);
        lock (_syncRoot)
        {
            var libraryByFile = _musicLibraryService.GetLibrary().ToDictionary(item => item.FileName, StringComparer.OrdinalIgnoreCase);
            if (!_data.TryGetValue(userKey, out var playlists))
            {
                return Array.Empty<PlaylistSummaryDto>();
            }

            return playlists
                .OrderBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
                .Select(item => ToDto(item, libraryByFile))
                .ToList();
        }
    }

    public IReadOnlyList<PlaylistSummaryDto> CreatePlaylist(string username, string name, string imageUrl, IReadOnlyList<string>? songFileNames = null)
    {
        var userKey = NormalizeUser(username);
        var safeName = (name ?? string.Empty).Trim();
        var safeImageUrl = (imageUrl ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(safeName))
        {
            throw new InvalidOperationException("Playlist name is required.");
        }

        lock (_syncRoot)
        {
            if (!_data.TryGetValue(userKey, out var playlists))
            {
                playlists = [];
                _data[userKey] = playlists;
            }

            if (playlists.Any(item => string.Equals(item.Name, safeName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("A playlist with this name already exists.");
            }

            var songs = new List<string>();
            if (songFileNames is not null)
            {
                foreach (var rawSong in songFileNames)
                {
                    var safeFile = Path.GetFileName(rawSong ?? string.Empty).Trim();
                    if (string.IsNullOrWhiteSpace(safeFile))
                    {
                        continue;
                    }

                    if (!_musicLibraryService.TryGetFilePath(safeFile, out _))
                    {
                        continue;
                    }

                    if (!songs.Contains(safeFile, StringComparer.OrdinalIgnoreCase))
                    {
                        songs.Add(safeFile);
                    }
                }
            }

            playlists.Add(new PlaylistRecord
            {
                Id = Guid.NewGuid().ToString("N"),
                Name = safeName,
                ImageUrl = safeImageUrl,
                Songs = songs
            });
            Save();
            return GetPlaylists(userKey);
        }
    }

    public IReadOnlyList<PlaylistSummaryDto> DeletePlaylist(string username, string playlistId)
    {
        var userKey = NormalizeUser(username);
        var safeId = (playlistId ?? string.Empty).Trim();

        lock (_syncRoot)
        {
            if (!_data.TryGetValue(userKey, out var playlists))
            {
                throw new InvalidOperationException("Playlist not found.");
            }

            var removed = playlists.RemoveAll(item => string.Equals(item.Id, safeId, StringComparison.OrdinalIgnoreCase));
            if (removed == 0)
            {
                throw new InvalidOperationException("Playlist not found.");
            }

            Save();
            return GetPlaylists(userKey);
        }
    }

    public IReadOnlyList<PlaylistSummaryDto> AddSong(string username, string playlistId, string fileName)
    {
        var userKey = NormalizeUser(username);
        var safeFile = Path.GetFileName(fileName ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(safeFile))
        {
            throw new InvalidOperationException("Song file name is required.");
        }

        if (!_musicLibraryService.TryGetFilePath(safeFile, out _))
        {
            throw new InvalidOperationException("Selected song was not found in library.");
        }

        lock (_syncRoot)
        {
            var playlist = FindPlaylist(userKey, playlistId);
            if (playlist.Songs.Contains(safeFile, StringComparer.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Song already exists in this playlist.");
            }

            playlist.Songs.Add(safeFile);
            Save();
            return GetPlaylists(userKey);
        }
    }

    public IReadOnlyList<PlaylistSummaryDto> RemoveSong(string username, string playlistId, string fileName)
    {
        var userKey = NormalizeUser(username);
        var safeFile = Path.GetFileName(fileName ?? string.Empty).Trim();

        lock (_syncRoot)
        {
            var playlist = FindPlaylist(userKey, playlistId);
            var removed = playlist.Songs.RemoveAll(item => string.Equals(item, safeFile, StringComparison.OrdinalIgnoreCase));
            if (removed == 0)
            {
                throw new InvalidOperationException("Song is not in this playlist.");
            }

            Save();
            return GetPlaylists(userKey);
        }
    }

    private PlaylistRecord FindPlaylist(string userKey, string playlistId)
    {
        if (!_data.TryGetValue(userKey, out var playlists))
        {
            throw new InvalidOperationException("Playlist not found.");
        }

        var playlist = playlists.FirstOrDefault(item => string.Equals(item.Id, playlistId, StringComparison.OrdinalIgnoreCase));
        if (playlist is null)
        {
            throw new InvalidOperationException("Playlist not found.");
        }

        return playlist;
    }

    private static string NormalizeUser(string username)
    {
        var safe = (username ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(safe))
        {
            throw new InvalidOperationException("User identifier is required.");
        }

        return safe;
    }

    private static PlaylistSummaryDto ToDto(PlaylistRecord record, Dictionary<string, MusicLibraryItem> libraryByFile)
    {
        var songs = record.Songs
            .Select(file =>
            {
                if (libraryByFile.TryGetValue(file, out var item))
                {
                    return new PlaylistSongDto
                    {
                        FileName = item.FileName,
                        DisplayName = item.DisplayName,
                        Artist = item.Artist
                    };
                }

                return new PlaylistSongDto
                {
                    FileName = file,
                    DisplayName = Path.GetFileNameWithoutExtension(file),
                    Artist = "Unknown Artist"
                };
            })
            .ToList();

        return new PlaylistSummaryDto
        {
            Id = record.Id,
            Name = record.Name,
            ImageUrl = record.ImageUrl,
            Songs = songs
        };
    }

    private Dictionary<string, List<PlaylistRecord>> Load()
    {
        if (!File.Exists(_storagePath))
        {
            return new Dictionary<string, List<PlaylistRecord>>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            var json = File.ReadAllText(_storagePath);
            var parsed = JsonSerializer.Deserialize<Dictionary<string, List<PlaylistRecord>>>(json)
                ?? new Dictionary<string, List<PlaylistRecord>>();

            return parsed.ToDictionary(
                item => item.Key,
                item => item.Value ?? [],
                StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return new Dictionary<string, List<PlaylistRecord>>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private void Save()
    {
        var json = JsonSerializer.Serialize(_data, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(_storagePath, json);
    }

    private class PlaylistRecord
    {
        public string Id { get; init; } = string.Empty;
        public string Name { get; init; } = string.Empty;
        public string ImageUrl { get; init; } = string.Empty;
        public List<string> Songs { get; init; } = [];
    }
}
