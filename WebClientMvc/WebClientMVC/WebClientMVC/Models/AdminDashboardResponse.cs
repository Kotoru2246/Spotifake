using System.Text.Json.Serialization;

namespace WebClientMVC.Models;

public class AdminDashboardResponse
{
    public int TotalTracks { get; init; }
    public int ActiveUsers { get; init; }
    public int ActiveArtists { get; init; }
    public int TotalAdmins { get; init; }
    public string MusicFolderPath { get; init; } = string.Empty;
    public DateTimeOffset LastScanUtc { get; init; }
    public IReadOnlyList<MusicLibraryItem> Music { get; init; } = Array.Empty<MusicLibraryItem>();
    public IReadOnlyList<SongListenSummary> SongViews { get; init; } = Array.Empty<SongListenSummary>();
    public IReadOnlyList<AdminAccountRecord> Users { get; init; } = Array.Empty<AdminAccountRecord>();
    public IReadOnlyList<AdminAccountRecord> Artists { get; init; } = Array.Empty<AdminAccountRecord>();
}

public class AdminAccountRecord
{
    public string Username { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
    public int UploadedTracks { get; set; }
    public string Notes { get; init; } = string.Empty;
    public DateTimeOffset LastActiveUtc { get; set; }

    [JsonIgnore]
    public bool CanFeature => string.Equals(Role, "artist", StringComparison.OrdinalIgnoreCase);
}
