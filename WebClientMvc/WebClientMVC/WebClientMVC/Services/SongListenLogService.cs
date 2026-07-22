using System.Text.Json;
using WebClientMVC.Models;

namespace WebClientMVC.Services;

public class SongListenLogService
{
    private readonly object _syncRoot = new();
    private readonly string _storagePath;
    private readonly Dictionary<string, Dictionary<string, int>> _songUserCounters;

    public SongListenLogService(IWebHostEnvironment environment)
    {
        var dataFolder = Path.Combine(environment.ContentRootPath, "App_Data");
        Directory.CreateDirectory(dataFolder);
        _storagePath = Path.Combine(dataFolder, "song-listen-log.json");
        _songUserCounters = LoadFromDisk();
    }

    public void RecordListen(string fileName, string userId)
    {
        var normalizedFileName = NormalizeFileName(fileName);
        var normalizedUserId = NormalizeUserId(userId);

        lock (_syncRoot)
        {
            if (!_songUserCounters.TryGetValue(normalizedFileName, out var userCounters))
            {
                userCounters = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                _songUserCounters[normalizedFileName] = userCounters;
            }

            userCounters.TryGetValue(normalizedUserId, out var current);
            userCounters[normalizedUserId] = current + 1;
            SaveToDisk();
        }
    }

    public int GetSongTotalViews(string fileName)
    {
        var normalizedFileName = NormalizeFileName(fileName);
        lock (_syncRoot)
        {
            return _songUserCounters.TryGetValue(normalizedFileName, out var userCounters)
                ? userCounters.Values.Sum()
                : 0;
        }
    }

    public IReadOnlyList<SongListenerStat> GetSongListeners(string fileName)
    {
        var normalizedFileName = NormalizeFileName(fileName);
        lock (_syncRoot)
        {
            if (!_songUserCounters.TryGetValue(normalizedFileName, out var userCounters))
            {
                return Array.Empty<SongListenerStat>();
            }

            return userCounters
                .OrderByDescending(pair => pair.Value)
                .ThenBy(pair => pair.Key, StringComparer.OrdinalIgnoreCase)
                .Select(pair => new SongListenerStat
                {
                    UserId = pair.Key,
                    ListenCount = pair.Value
                })
                .ToList();
        }
    }

    public void RemoveSong(string fileName)
    {
        var normalizedFileName = NormalizeFileName(fileName);
        lock (_syncRoot)
        {
            if (_songUserCounters.Remove(normalizedFileName))
            {
                SaveToDisk();
            }
        }
    }

    private Dictionary<string, Dictionary<string, int>> LoadFromDisk()
    {
        if (!File.Exists(_storagePath))
        {
            return new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase);
        }

        try
        {
            var json = File.ReadAllText(_storagePath);
            var parsed = JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, int>>>(json)
                ?? new Dictionary<string, Dictionary<string, int>>();

            return parsed.ToDictionary(
                entry => NormalizeFileName(entry.Key),
                entry => entry.Value?.ToDictionary(
                    counter => NormalizeUserId(counter.Key),
                    counter => Math.Max(0, counter.Value),
                    StringComparer.OrdinalIgnoreCase) ?? new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase),
                StringComparer.OrdinalIgnoreCase);
        }
        catch
        {
            return new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase);
        }
    }

    private void SaveToDisk()
    {
        var json = JsonSerializer.Serialize(_songUserCounters, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(_storagePath, json);
    }

    private static string NormalizeFileName(string fileName)
    {
        return Path.GetFileName(fileName ?? string.Empty).Trim();
    }

    private static string NormalizeUserId(string userId)
    {
        var cleaned = (userId ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(cleaned) ? "anonymous" : cleaned;
    }
}
