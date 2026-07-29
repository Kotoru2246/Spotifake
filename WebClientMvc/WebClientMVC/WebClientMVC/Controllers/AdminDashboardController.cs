using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DataAccess;
using DataAccess.Models;
using Microsoft.EntityFrameworkCore;

namespace WebClientMVC.Controllers;

[Route("admin/dashboard")]
[Authorize(Roles = "admin")]
public class AdminDashboardController : Controller
{
    private readonly MusicPlayerContext _context;

    public AdminDashboardController(MusicPlayerContext context)
    {
        _context = context;
    }

    // ========== OVERVIEW ==========
    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        ViewBag.TotalUsers = await _context.Users.CountAsync(u => !u.IsDeleted);
        ViewBag.TotalArtists = await _context.ArtistProfiles.CountAsync(a => !a.IsDeleted && a.Status == "Approved");
        ViewBag.TotalSongs = await _context.Songs.CountAsync(s => !s.IsDeleted);
        ViewBag.TotalAlbums = await _context.Albums.CountAsync(a => !a.IsDeleted);
        ViewBag.TotalStreams = await _context.Songs.SumAsync(s => (long?)s.PlayCount) ?? 0;
        ViewBag.PremiumUsers = await _context.Users.CountAsync(u => u.IsPremium && !u.IsDeleted);

        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "overview";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = "Overview";
        ViewData["BackUrl"] = "/";
        ViewData["BackLabel"] = "Back";

        return View("Overview");
    }

    // Chart data API
    [HttpGet("chart-data")]
    public async Task<IActionResult> ChartData([FromQuery] string period = "month")
    {
        var now = DateTime.UtcNow;
        DateTime startDate = period switch
        {
            "today" => now.Date,
            "week" => now.AddDays(-7),
            "month" => now.AddMonths(-1),
            "year" => now.AddYears(-1),
            _ => DateTime.MinValue // all time
        };

        var users = await _context.Users.Where(u => u.CreatedAt >= startDate).Select(u => u.CreatedAt.Date).ToListAsync();
        var songs = await _context.Songs.Where(s => s.UploadedAt != null && s.UploadedAt >= startDate).Select(s => s.UploadedAt!.Value.Date).ToListAsync();
        var artists = await _context.ArtistProfiles.Where(a => a.CreatedAt >= startDate).Select(a => a.CreatedAt.Date).ToListAsync();

        var allDates = users.Concat(songs).Concat(artists).Distinct().OrderBy(d => d).ToList();

        return Json(new
        {
            labels = allDates.Select(d => d.ToString("MMM dd")),
            users = allDates.Select(d => users.Count(u => u <= d)),
            songs = allDates.Select(d => songs.Count(s => s <= d)),
            artists = allDates.Select(d => artists.Count(a => a <= d))
        });
    }

    // ========== USER MANAGER ==========
    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] string? search, [FromQuery] string sort = "name")
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.Username.Contains(search) || u.DisplayName.Contains(search) || u.Email.Contains(search));

        query = sort switch
        {
            "date" => query.OrderByDescending(u => u.CreatedAt),
            "role" => query.OrderBy(u => u.Role),
            "status" => query.OrderBy(u => u.AccountStatus),
            _ => query.OrderBy(u => u.DisplayName)
        };

        ViewBag.Users = await query.ToListAsync();
        ViewBag.Search = search;
        ViewBag.Sort = sort;
        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "users";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = "Users";
        ViewData["BackUrl"] = "/admin/dashboard";
        ViewData["BackLabel"] = "Overview";

        return View("ManageUsers");
    }

    [HttpPost("users/{userId}/update")]
    public async Task<IActionResult> UpdateUser(Guid userId,
        [FromForm] string? displayName, [FromForm] string? email,
        [FromForm] string? role, [FromForm] string? bio,
        [FromForm] string? nationality, [FromForm] string? gender,
        [FromForm] DateTime? dateOfBirth, [FromForm] string? accountStatus,
        [FromForm] string? subscriptionTier)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(displayName)) user.DisplayName = displayName;
        if (!string.IsNullOrEmpty(email)) user.Email = email;
        if (!string.IsNullOrEmpty(role)) user.Role = role;
        if (bio != null) user.Bio = bio;
        if (!string.IsNullOrEmpty(nationality)) user.Nationality = nationality;
        if (!string.IsNullOrEmpty(gender)) user.Gender = gender;
        if (dateOfBirth.HasValue) user.DateOfBirth = dateOfBirth;
        if (!string.IsNullOrEmpty(accountStatus)) user.AccountStatus = accountStatus;
        if (!string.IsNullOrEmpty(subscriptionTier)) user.SubscriptionTier = subscriptionTier;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "User updated!";
        return RedirectToAction("Users");
    }

    [HttpPost("users/{userId}/delete")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();
        user.IsDeleted = true;
        user.AccountStatus = "Deleted";
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "User soft-deleted.";
        return RedirectToAction("Users");
    }

    // ========== ARTIST MANAGER ==========
    [HttpGet("artists")]
    public async Task<IActionResult> Artists([FromQuery] string? search)
    {
        var query = _context.ArtistProfiles.Include(a => a.User).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(a => a.StageName.Contains(search) || a.User.Username.Contains(search));

        ViewBag.Artists = await query.OrderBy(a => a.StageName).ToListAsync();
        ViewBag.Search = search;
        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "artists";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = "Artists";
        ViewData["BackUrl"] = "/admin/dashboard";
        ViewData["BackLabel"] = "Overview";

        return View("ManageArtists");
    }

    [HttpGet("artists/{artistId}")]
    public async Task<IActionResult> ArtistDetail(Guid artistId)
    {
        var artist = await _context.ArtistProfiles.Include(a => a.User).FirstOrDefaultAsync(a => a.ArtistID == artistId);
        if (artist == null) return NotFound();

        var songs = await _context.Songs.Where(s => s.UserID == artist.UserID).Include(s => s.AlbumEntity).OrderByDescending(s => s.UploadedAt).ToListAsync();
        var albums = await _context.Albums.Where(a => a.ArtistID == artistId).Include(a => a.Songs).OrderByDescending(a => a.CreatedAt).ToListAsync();

        ViewBag.Songs = songs;
        ViewBag.Albums = albums;
        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "artists";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = artist.StageName;
        ViewData["BackUrl"] = "/admin/dashboard/artists";
        ViewData["BackLabel"] = "Artists";

        return View("ArtistDetail", artist);
    }

    [HttpPost("artists/{artistId}/songs/{songId}/update")]
    public async Task<IActionResult> AdminUpdateSong(Guid artistId, Guid songId,
        [FromForm] string? title, [FromForm] string? mood, [FromForm] string? language,
        [FromForm] string? customGenre, [FromForm] Guid? albumId)
    {
        var song = await _context.Songs.FindAsync(songId);
        if (song == null) return NotFound();

        if (!string.IsNullOrEmpty(title)) song.Title = title;
        if (!string.IsNullOrEmpty(mood)) song.Mood = mood;
        if (!string.IsNullOrEmpty(language)) song.Language = language;
        if (!string.IsNullOrEmpty(customGenre)) song.Tags = customGenre;
        song.AlbumID = albumId;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song updated!";
        return RedirectToAction("ArtistDetail", new { artistId });
    }

    [HttpPost("artists/{artistId}/songs/{songId}/delete")]
    public async Task<IActionResult> AdminDeleteSong(Guid artistId, Guid songId)
    {
        var song = await _context.Songs.FindAsync(songId);
        if (song == null) return NotFound();
        song.IsDeleted = true;
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song deleted.";
        return RedirectToAction("ArtistDetail", new { artistId });
    }

    [HttpPost("artists/{artistId}/albums/{albumId}/delete")]
    public async Task<IActionResult> AdminDeleteAlbum(Guid artistId, Guid albumId)
    {
        var album = await _context.Albums.Include(a => a.Songs).FirstOrDefaultAsync(a => a.AlbumID == albumId);
        if (album == null) return NotFound();
        album.IsDeleted = true;
        foreach (var song in album.Songs) song.IsDeleted = true;
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album and its songs deleted.";
        return RedirectToAction("ArtistDetail", new { artistId });
    }

    // ========== GLOBAL SONG SEARCH ==========
    [HttpGet("songs")]
    public async Task<IActionResult> SongSearch([FromQuery] string? search)
    {
        var query = _context.Songs.Include(s => s.UploadedBy).Include(s => s.AlbumEntity).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.Title.Contains(search) || s.ArtistName.Contains(search));

        ViewBag.Songs = await query.OrderByDescending(s => s.PlayCount).Take(50).ToListAsync();
        ViewBag.Search = search;
        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "songs";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = "Song Search";
        ViewData["BackUrl"] = "/admin/dashboard";
        ViewData["BackLabel"] = "Overview";

        return View("SongSearch");
    }

    // ========== ARTIST REQUESTS ==========
    [HttpGet("requests")]
    public async Task<IActionResult> Requests()
    {
        var requests = await _context.ArtistRequests.Include(r => r.User).OrderByDescending(r => r.CreatedAt).ToListAsync();

        ViewBag.Requests = requests;
        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "requests";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = "Artist Requests";
        ViewData["BackUrl"] = "/admin/dashboard";
        ViewData["BackLabel"] = "Overview";

        return View("Requests");
    }

    [HttpGet("requests/{requestId}")]
    public async Task<IActionResult> RequestDetail(Guid requestId)
    {
        var request = await _context.ArtistRequests.Include(r => r.User).FirstOrDefaultAsync(r => r.RequestID == requestId);
        if (request == null) return NotFound();

        ViewData["DashboardType"] = "admin";
        ViewData["CurrentPage"] = "requests";
        ViewData["PageEyebrow"] = "Admin Control";
        ViewData["Title"] = "Review Request";
        ViewData["BackUrl"] = "/admin/dashboard/requests";
        ViewData["BackLabel"] = "Requests";

        return View("RequestDetail", request);
    }

    [HttpPost("requests/{requestId}/approve")]
    public async Task<IActionResult> ApproveRequest(Guid requestId)
    {
        var request = await _context.ArtistRequests.Include(r => r.User).FirstOrDefaultAsync(r => r.RequestID == requestId);
        if (request == null) return NotFound();

        request.Status = "Approved";
        request.ResolvedAt = DateTime.UtcNow;

        // Update user role
        request.User.Role = "artist";

        // Update or create ArtistProfile
        var profile = await _context.ArtistProfiles.FirstOrDefaultAsync(p => p.UserID == request.UserID);
        if (profile != null)
        {
            profile.Status = "Approved";
        }
        else
        {
            profile = new ArtistProfile
            {
                UserID = request.UserID,
                StageName = request.StageName,
                Status = "Approved"
            };
            _context.ArtistProfiles.Add(profile);
        }

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = $"Artist '{request.StageName}' approved!";
        return RedirectToAction("Requests");
    }

    [HttpPost("requests/{requestId}/reject")]
    public async Task<IActionResult> RejectRequest(Guid requestId, [FromForm] string? adminNotes)
    {
        var request = await _context.ArtistRequests.FirstOrDefaultAsync(r => r.RequestID == requestId);
        if (request == null) return NotFound();

        request.Status = "Rejected";
        request.ResolvedAt = DateTime.UtcNow;
        request.AdminNotes = adminNotes ?? "";

        // Update ArtistProfile status too
        var profile = await _context.ArtistProfiles.FirstOrDefaultAsync(p => p.UserID == request.UserID);
        if (profile != null) profile.Status = "Rejected";

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Request rejected.";
        return RedirectToAction("Requests");
    }

    // Download CV/Demo files
    [HttpGet("requests/{requestId}/cv")]
    public async Task<IActionResult> DownloadCv(Guid requestId)
    {
        var request = await _context.ArtistRequests.FindAsync(requestId);
        if (request?.CvFileData == null) return NotFound();
        return File(request.CvFileData, "application/octet-stream", request.CvFileName);
    }

    [HttpGet("requests/{requestId}/demo")]
    public async Task<IActionResult> DownloadDemo(Guid requestId)
    {
        var request = await _context.ArtistRequests.FindAsync(requestId);
        if (request?.DemoFileData == null) return NotFound();
        var contentType = request.DemoFileName.EndsWith(".mp3") ? "audio/mpeg" : "audio/wav";
        return File(request.DemoFileData, contentType, request.DemoFileName);
    }
}
