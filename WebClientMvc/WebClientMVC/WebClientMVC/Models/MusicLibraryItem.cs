namespace WebClientMVC.Models;

public class MusicLibraryItem
{
    public string FileName { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string Artist { get; set; } = string.Empty;

    public string StreamUrl { get; set; } = string.Empty;

    public string Extension { get; set; } = string.Empty;
}