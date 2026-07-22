namespace WebClientMVC.Models;

public class AdminDashboardPageViewModel
{
    public required AdminDashboardResponse Dashboard { get; init; }
    public SongListenDetail? SelectedSongDetail { get; init; }
}
