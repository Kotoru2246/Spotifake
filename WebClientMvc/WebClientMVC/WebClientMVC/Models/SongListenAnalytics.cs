namespace WebClientMVC.Models;

public class SongListenSummary
{
    public string FileName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public int TotalViews { get; init; }
}

public class SongListenerStat
{
    public string UserId { get; init; } = string.Empty;
    public int ListenCount { get; init; }
}

public class SongListenDetail
{
    public string FileName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public int TotalViews { get; init; }
    public IReadOnlyList<SongListenerStat> Listeners { get; init; } = Array.Empty<SongListenerStat>();
}
