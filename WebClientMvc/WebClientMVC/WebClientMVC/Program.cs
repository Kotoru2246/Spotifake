using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;

using WebClientMVC.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

builder.Services.AddHttpClient();
builder.Services.AddSingleton<MusicLibraryService>();
builder.Services.AddSingleton<SongListenLogService>();
builder.Services.AddScoped<UserPlaylistService>();
builder.Services.AddSingleton<AdminDashboardService>();

builder.Services.AddDbContext<DataAccess.MusicPlayerContext>(options =>
{
    options.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=MusicPlayerDb;Trusted_Connection=True;");
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSection = builder.Configuration.GetSection("Jwt");
        var key = jwtSection["Secret"] ?? jwtSection["Key"] ?? "THIS_IS_A_DEMO_SECRET_CHANGE_IT_TO_A_LONG_RANDOM_VALUE";
        Console.WriteLine($"[DEBUG] JWT Key: {key}");
        
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

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["jwt_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Đảm bảo bảng PaymentTransactions tồn tại trong CSDL SQL Server (LocalDB)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<DataAccess.MusicPlayerContext>();
        db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentTransactions' AND xtype='U')
            BEGIN
                CREATE TABLE PaymentTransactions (
                    TransactionID UNIQUEIDENTIFIER PRIMARY KEY,
                    UserID UNIQUEIDENTIFIER NOT NULL,
                    AmountVND INT NOT NULL DEFAULT 18000,
                    PlanName NVARCHAR(100) NOT NULL DEFAULT 'Premium 1 Tháng',
                    Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
                    PaymentMethod NVARCHAR(50) NOT NULL DEFAULT '',
                    TransactionCode NVARCHAR(50) NOT NULL DEFAULT '',
                    OtpCode NVARCHAR(10) NOT NULL DEFAULT '',
                    CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
                    PaidAt DATETIME NULL,
                    ExpiresAt DATETIME NULL
                );
            END
        ");
        Console.WriteLine("[DEBUG] Verified PaymentTransactions table in SQL Server.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DEBUG] Note on table creation: {ex.Message}");
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
