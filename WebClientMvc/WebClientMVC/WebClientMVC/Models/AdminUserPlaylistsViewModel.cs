namespace WebClientMVC.Models;

public class AdminUserPlaylistsViewModel
{
    public required string Username { get; init; }
    public required IReadOnlyList<PlaylistSummaryDto> Playlists { get; init; }
    public required IReadOnlyList<MusicLibraryItem> LibrarySongs { get; init; }
}
