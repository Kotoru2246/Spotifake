namespace WebClientMVC.Models;

public class PlaylistSummaryDto
{
    public string Id { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string ImageUrl { get; init; } = string.Empty;
    public IReadOnlyList<PlaylistSongDto> Songs { get; init; } = Array.Empty<PlaylistSongDto>();
}

public class PlaylistSongDto
{
    public string FileName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string Artist { get; init; } = string.Empty;
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
