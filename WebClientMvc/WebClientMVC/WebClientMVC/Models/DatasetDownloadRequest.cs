namespace WebClientMVC.Models;

public class DatasetDownloadRequest
{
    public string OutDir { get; set; } = string.Empty;

    public int Samples { get; set; } = 15;

    public int ClipDuration { get; set; } = 30;

    public int MinVideoDuration { get; set; } = 120;

    public int MaxVideoDuration { get; set; } = 300;

    public bool SkipLivestreams { get; set; } = true;

    public string DuplicateMode { get; set; } = "1";

    public bool ForceRedownload { get; set; }

    public bool Verbose { get; set; } = true;

    public bool ListGenres { get; set; }

    public string? Genres { get; set; }
}