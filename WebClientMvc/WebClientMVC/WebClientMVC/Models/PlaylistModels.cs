namespace WebClientMVC.Models;

public class PlaylistSummaryDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public bool IsOwner { get; set; } = false;
    public DateTime SavedAt { get; set; } = DateTime.MinValue;
    public string Type { get; set; } = "Playlist"; // Playlist or Album
    public IReadOnlyList<PlaylistSongDto> Songs { get; init; } = Array.Empty<PlaylistSongDto>();
}

public class PlaylistSongDto
{
    public string FileName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Artist { get; init; } = string.Empty;
    public string ArtistId { get; init; } = string.Empty;
    public string AlbumId { get; init; } = string.Empty;
    public int DurationSeconds { get; init; } = 0;
}

public class CreatePlaylistRequest
{
    public string Name { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public IReadOnlyList<string> SongFileNames { get; init; } = Array.Empty<string>();
}

public class PlaylistSongRequest
{
    public string FileName { get; init; } = string.Empty;
}

public class UpdateVisibilityRequest
{
    public bool IsPublic { get; init; }
}
