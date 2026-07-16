namespace WebClientMVC.Models;

public class MusicSearchRequest
{
    public string Name { get; set; } = string.Empty;

    public int MaxResults { get; set; } = 5;
}