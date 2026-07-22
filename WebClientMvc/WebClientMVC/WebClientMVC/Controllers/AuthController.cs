using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebClientMVC.Controllers;

/// <summary>
/// Auth is handled entirely client-side via JavaScript calling FastAPI directly.
/// This controller exists only for Razor view routing.
/// </summary>
public class AuthController : Controller
{
    private readonly IConfiguration _configuration;

    private static readonly Dictionary<string, (string Password, string Role)> TestUsers = new()
    {
        ["user_test"] = ("User@123", "user"),
        ["artist_test"] = ("Artist@123", "artist"),
        ["admin_test"] = ("Admin@123", "admin")
    };

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public IActionResult Login([FromBody] JwtLoginRequest request)
    {
        if (!TestUsers.TryGetValue(request.Username, out var user))
        {
            return Unauthorized(new { detail = "Invalid username or password." });
        }

        if (user.Password != request.Password)
        {
            return Unauthorized(new { detail = "Invalid username or password." });
        }

        if (!string.IsNullOrWhiteSpace(request.Role) &&
            !string.Equals(request.Role, user.Role, StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized(new { detail = "Role does not match the selected account type." });
        }

        var jwtSection = _configuration.GetSection("Jwt");
        var issuer = jwtSection["Issuer"] ?? "SpotifakeMvc";
        var audience = jwtSection["Audience"] ?? "SpotifakeUsers";
        var key = jwtSection["Secret"] ?? jwtSection["Key"] ?? "THIS_IS_A_DEMO_SECRET_CHANGE_IT_TO_A_LONG_RANDOM_VALUE";
        var expiresMinutes = int.TryParse(jwtSection["ExpiresMinutes"], out var mins) ? mins : 60;

        var claims = new List<System.Security.Claims.Claim>
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, request.Username),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role),
            new System.Security.Claims.Claim(JwtRegisteredClaimNames.Sub, request.Username),
            new System.Security.Claims.Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds);

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            access_token = tokenString,
            token_type = "bearer",
            username = request.Username,
            role = user.Role,
            expires_in = expiresMinutes * 60
        });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            username = User.Identity?.Name,
            role = User.FindFirst(ClaimTypes.Role)?.Value
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { detail = "Logged out." });
    }
}
