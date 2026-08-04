using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using WebClientMVC.Models;
using DataAccess;

namespace WebClientMVC.Controllers;

[Route("auth")]
public class AuthController : Controller
{
    private readonly IConfiguration _configuration;
    private readonly MusicPlayerContext _db;

    private static readonly Dictionary<string, (string Password, string Role)> TestUsers = new()
    {
        ["user_test"] = ("User@123", "user"),
        ["artist_test"] = ("Artist@123", "artist"),
        ["admin_test"] = ("Admin@123", "admin")
    };

    public AuthController(IConfiguration configuration, MusicPlayerContext db)
    {
        _configuration = configuration;
        _db = db;
    }

    private async Task<string> GetUserSubscriptionTierAsync(string username)
    {
        try
        {
            var dbUser = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (dbUser != null)
            {
                if ((dbUser.SubscriptionTier == "Premium" || dbUser.IsPremium) && dbUser.PremiumExpiresAt.HasValue)
                {
                    if (dbUser.PremiumExpiresAt.Value < DateTime.UtcNow)
                    {
                        dbUser.SubscriptionTier = "Free";
                        dbUser.IsPremium = false;
                        await _db.SaveChangesAsync();
                        return "Free";
                    }
                    return "Premium";
                }
                return dbUser.SubscriptionTier ?? "Free";
            }
        }
        catch
        {
            // Fallback nếu có sự cố kết nối CSDL
        }
        return "Free";
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] JwtLoginRequest request)
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
        var tier = await GetUserSubscriptionTierAsync(request.Username);

        return Ok(new
        {
            access_token = tokenString,
            token_type = "bearer",
            username = request.Username,
            role = user.Role,
            expires_in = expiresMinutes * 60,
            subscription_tier = tier
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var username = User.Identity?.Name 
                       ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value
                       ?? "";

        var tier = await GetUserSubscriptionTierAsync(username);

        return Ok(new
        {
            username = username,
            role = User.FindFirst(ClaimTypes.Role)?.Value,
            subscription_tier = tier
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
