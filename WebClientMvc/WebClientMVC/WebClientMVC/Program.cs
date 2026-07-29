using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSection = builder.Configuration.GetSection("Jwt");
        var key = jwtSection["Secret"] ?? jwtSection["Key"] ?? "THIS_IS_A_DEMO_SECRET_CHANGE_IT_TO_A_LONG_RANDOM_VALUE";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();


--- VERSION ---

        var issuer = jwtSection["Issuer"];
        var audience = jwtSection["Audience"];

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !string.IsNullOrEmpty(issuer),
            ValidateAudience = !string.IsNullOrEmpty(audience),
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            ClockSkew = TimeSpan.Zero
        };
    });

--- VERSION ---

        var key = jwtSection["Secret"] ?? jwtSection["Key"] ?? "THIS_IS_A_DEMO_SECRET_CHANGE_IT_TO_A_LONG_RANDOM_VALUE";
        Console.WriteLine($"[DEBUG] JWT Key: {key}");
        
        var issuer = jwtSection["Issuer"];

--- VERSION ---

using WebClientMVC.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddSingleton<MusicLibraryService>();
builder.Services.AddSingleton<SongListenLogService>();
builder.Services.AddSingleton<UserPlaylistService>();
builder.Services.AddSingleton<AdminDashboardService>();

--- VERSION ---

builder.Services.AddControllersWithViews();

builder.Services.AddHttpClient();
builder.Services.AddSingleton<MusicLibraryService>();
builder.Services.AddSingleton<SongListenLogService>();
builder.Services.AddSingleton<UserPlaylistService>();
builder.Services.AddSingleton<AdminDashboardService>();

--- VERSION ---

builder.Services.AddSingleton<MusicLibraryService>();
builder.Services.AddSingleton<SongListenLogService>();
builder.Services.AddSingleton<UserPlaylistService>();
builder.Services.AddSingleton<AdminDashboardService>();

builder.Services.AddDbContext<DataAccess.MusicPlayerContext>(options =>
{
    options.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=MusicPlayerDb;Trusted_Connection=True;");
});

--- VERSION ---

using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;

using WebClientMVC.Services;

var builder = WebApplication.CreateBuilder(args);

--- VERSION ---

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(