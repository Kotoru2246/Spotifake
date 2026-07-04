namespace WebClientMVC.Models;

public sealed class JwtLoginResponse
{
    public string AccessToken { get; set; } = string.Empty;

    public string TokenType { get; set; } = "Bearer";

    public string Username { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public int ExpiresIn { get; set; }
}