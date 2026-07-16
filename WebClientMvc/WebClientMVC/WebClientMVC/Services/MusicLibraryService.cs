using System.Globalization;
using WebClientMVC.Models;

namespace WebClientMVC.Services;

public class MusicLibraryService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"
    };

    private readonly string _musicFolder;
    private readonly IHttpClientFactory _httpClientFactory;

    public MusicLibraryService(IConfiguration configuration, IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
        _musicFolder = configuration["Music:FolderPath"] ?? @"C:\Music";
        Directory.CreateDirectory(_musicFolder);
    }

    public string MusicFolderPath => _musicFolder;

    public IReadOnlyList<MusicLibraryItem> GetLibrary()
    {
        if (!Directory.Exists(_musicFolder))
        {
            Directory.CreateDirectory(_musicFolder);
        }

        return Directory.EnumerateFiles(_musicFolder)
            .Where(IsAllowedAudioFile)
            .Select(ToLibraryItem)
            .OrderBy(item => item.DisplayName, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public IReadOnlyList<MusicLibraryItem> Search(string name, int maxResults = 5)
    {
        var query = (name ?? string.Empty).Trim();
        var library = GetLibrary();

        if (string.IsNullOrWhiteSpace(query))
        {
            return library.Take(Math.Clamp(maxResults, 3, 5)).ToList();
        }

        var matches = library
            .Where(item => item.DisplayName.Contains(query, StringComparison.OrdinalIgnoreCase)
                || item.FileName.Contains(query, StringComparison.OrdinalIgnoreCase))
            .Take(Math.Clamp(maxResults, 3, 5))
            .ToList();

        if (matches.Count > 0)
        {
            return matches;
        }

        return library.Take(Math.Clamp(maxResults, 3, 5)).ToList();
    }

    public string GetDownloadPath(string fileName)
    {
        return Path.Combine(_musicFolder, Path.GetFileName(fileName));
    }

    public async Task<IReadOnlyList<MusicLibraryItem>> SaveUploadsAsync(IEnumerable<IFormFile> files)
    {
        var saved = new List<MusicLibraryItem>();

        foreach (var file in files)
        {
            if (file.Length <= 0)
            {
                continue;
            }

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
            {
                continue;
            }

            var safeFileName = CreateUniqueFileName(Path.GetFileNameWithoutExtension(file.FileName), extension);
            var targetPath = Path.Combine(_musicFolder, safeFileName);

            await using var stream = File.Create(targetPath);
            await file.CopyToAsync(stream);

            saved.Add(ToLibraryItem(targetPath));
        }

        return saved;
    }

    public async Task<MusicLibraryItem> ImportFromUrlAsync(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            throw new InvalidOperationException("The provided URL is invalid.");
        }

        if (IsYouTubeHost(uri))
        {
            throw new InvalidOperationException("YouTube downloading is not supported here. Use a direct audio file URL or upload a local audio file.");
        }

        if (!HasAllowedExtension(uri.AbsolutePath))
        {
            throw new InvalidOperationException("Only direct audio file URLs are supported.");
        }

        var client = _httpClientFactory.CreateClient();
        using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        var contentType = response.Content.Headers.ContentType?.MediaType ?? string.Empty;
        if (!contentType.StartsWith("audio/", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(contentType))
        {
            throw new InvalidOperationException("The URL does not point to a supported audio file.");
        }

        var extension = Path.GetExtension(uri.AbsolutePath);
        if (!AllowedExtensions.Contains(extension))
        {
            extension = ".mp3";
        }

        var baseName = Uri.UnescapeDataString(Path.GetFileNameWithoutExtension(uri.AbsolutePath));
        if (string.IsNullOrWhiteSpace(baseName))
        {
            baseName = "Imported Track";
        }

        var safeFileName = CreateUniqueFileName(baseName, extension);
        var targetPath = Path.Combine(_musicFolder, safeFileName);

        await using (var targetStream = File.Create(targetPath))
        await using (var sourceStream = await response.Content.ReadAsStreamAsync())
        {
            await sourceStream.CopyToAsync(targetStream);
        }

        return ToLibraryItem(targetPath);
    }

    public bool TryGetFilePath(string fileName, out string filePath)
    {
        filePath = Path.Combine(_musicFolder, Path.GetFileName(fileName));
        return File.Exists(filePath) && IsAllowedAudioFile(filePath);
    }

    public bool TryGetDownloadPath(string fileName, out string filePath)
    {
        filePath = GetDownloadPath(fileName);
        return File.Exists(filePath) && IsAllowedAudioFile(filePath);
    }

    public bool DeleteTrack(string fileName)
    {
        var targetPath = Path.Combine(_musicFolder, Path.GetFileName(fileName));
        if (!File.Exists(targetPath) || !IsAllowedAudioFile(targetPath))
        {
            return false;
        }

        File.Delete(targetPath);
        return true;
    }

    private static bool IsYouTubeHost(Uri uri)
    {
        var host = uri.Host.ToLowerInvariant();
        return host.Contains("youtube.com", StringComparison.OrdinalIgnoreCase)
            || host.Contains("youtu.be", StringComparison.OrdinalIgnoreCase)
            || host.Contains("music.youtube.com", StringComparison.OrdinalIgnoreCase);
    }

    private static bool HasAllowedExtension(string path)
    {
        var extension = Path.GetExtension(path);
        return !string.IsNullOrWhiteSpace(extension) && AllowedExtensions.Contains(extension);
    }

    private bool IsAllowedAudioFile(string filePath)
    {
        return AllowedExtensions.Contains(Path.GetExtension(filePath));
    }

    private static string BuildDisplayName(string rawName)
    {
        var normalized = rawName.Replace('_', ' ').Replace('-', ' ').Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return "Untitled Track";
        }

        return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(normalized.ToLowerInvariant());
    }

    private static (string Artist, string Title) ExtractArtistAndTitle(string rawName)
    {
        var normalized = rawName.Replace('_', ' ').Trim();
        var separators = new[] { " - ", " – ", " — " };

        foreach (var separator in separators)
        {
            var pieces = normalized.Split(separator, 2, StringSplitOptions.TrimEntries);
            if (pieces.Length == 2 && !string.IsNullOrWhiteSpace(pieces[0]) && !string.IsNullOrWhiteSpace(pieces[1]))
            {
                return (BuildDisplayName(pieces[0]), BuildDisplayName(pieces[1]));
            }
        }

        return ("Unknown Artist", BuildDisplayName(rawName));
    }

    private static string CreateUniqueFileName(string baseName, string extension)
    {
        var safeBase = string.Concat(baseName.Where(ch => !Path.GetInvalidFileNameChars().Contains(ch))).Trim();
        if (string.IsNullOrWhiteSpace(safeBase))
        {
            safeBase = "Imported Track";
        }

        var stamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmssfff", CultureInfo.InvariantCulture);
        return $"{safeBase} {stamp}{extension}";
    }

    private MusicLibraryItem ToLibraryItem(string filePath)
    {
        var rawName = Path.GetFileNameWithoutExtension(filePath);
        var (artist, title) = ExtractArtistAndTitle(rawName);

        return new MusicLibraryItem
        {
            FileName = Path.GetFileName(filePath),
            DisplayName = title,
            Artist = artist,
            StreamUrl = $"/music/stream/{Uri.EscapeDataString(Path.GetFileName(filePath))}",
            Extension = Path.GetExtension(filePath).ToLowerInvariant()
        };
    }
}