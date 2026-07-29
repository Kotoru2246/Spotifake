using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DataAccess;
using DataAccess.Models;
using Microsoft.EntityFrameworkCore;

namespace WebClientMVC.Controllers;

[Route("artist")]
[Authorize(Roles = "artist")]
public class ArtistController : Controller
{
    private readonly MusicPlayerContext _context;

    public ArtistController(MusicPlayerContext context)
    {
        _context = context;
    }

    private async Task<ArtistProfile?> GetCurrentArtist()
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return null;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return null;
        return await _context.ArtistProfiles.FirstOrDefaultAsync(a => a.UserID == user.UserID);
    }

    // ========== ARTIST REGISTRATION ==========
    [HttpGet("register")]
    [Authorize]
    public IActionResult Register()
    {
        return View();
    }

    [HttpPost("register")]
    [Authorize]
    public async Task<IActionResult> Register(
        [FromForm] string stageName,
        [FromForm] string? bio,
        [FromForm] IFormFile cvFile,
        [FromForm] IFormFile demoFile)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return RedirectToAction("Index", "Home");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return RedirectToAction("Index", "Home");

        // Check if there's already a pending request
        var existingRequest = await _context.ArtistRequests.FirstOrDefaultAsync(r => r.UserID == user.UserID && r.Status == "Pending");
        if (existingRequest != null)
        {
            TempData["ErrorMessage"] = "You already have a pending artist application.";
            return View();
        }

        byte[]? cvBytes = null;
        if (cvFile != null && cvFile.Length > 0)
        {
            using var ms = new MemoryStream();
            await cvFile.CopyToAsync(ms);
            cvBytes = ms.ToArray();
        }

        byte[]? demoBytes = null;
        if (demoFile != null && demoFile.Length > 0)
        {
            using var ms = new MemoryStream();
            await demoFile.CopyToAsync(ms);
            demoBytes = ms.ToArray();
        }

        var request = new ArtistRequest
        {
            RequestID = Guid.NewGuid(),
            UserID = user.UserID,
            StageName = stageName,
            CvFileData = cvBytes,
            CvFileName = cvFile?.FileName ?? "cv.pdf",
            DemoFileData = demoBytes,
            DemoFileName = demoFile?.FileName ?? "demo.mp3",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.ArtistRequests.Add(request);
        await _context.SaveChangesAsync();

        TempData["SuccessMessage"] = "Your artist application has been submitted and is pending admin approval!";
        return View();
    }

    // ========== DASHBOARD ==========
    [HttpGet("manager")]
    public async Task<IActionResult> Dashboard()
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var songs = await _context.Songs.Where(s => s.UserID == artist.UserID && !s.IsDeleted).ToListAsync();
        var albums = await _context.Albums.Where(a => a.ArtistID == artist.ArtistID && !a.IsDeleted).ToListAsync();

        ViewBag.TotalStreams = songs.Sum(s => s.PlayCount);
        ViewBag.TotalSongs = songs.Count;
        ViewBag.TotalAlbums = albums.Count;
        ViewBag.RecentSongs = songs.OrderByDescending(s => s.UploadedAt).Take(5).ToList();

        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "dashboard";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Dashboard";
        ViewData["BackUrl"] = "/";
        ViewData["BackLabel"] = "Back";

        return View("Dashboard");
    }

    // ========== EDIT PROFILE ==========
    [HttpGet("manager/profile")]
    public async Task<IActionResult> Profile()
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "profile";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Edit Profile";
        ViewData["BackUrl"] = "/artist/manager";
        ViewData["BackLabel"] = "Dashboard";

        return View("Profile", artist);
    }

    [HttpPost("manager/profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromForm] string? stageName, [FromForm] string? bio,
        [FromForm] DateTime? dateOfBirth, [FromForm] string? nationality,
        [FromForm] string? profileImageUrl, [FromForm] string? website)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        if (!string.IsNullOrEmpty(stageName)) artist.StageName = stageName;
        if (bio != null) artist.Bio = bio;
        if (dateOfBirth.HasValue) artist.DateOfBirth = dateOfBirth;
        if (!string.IsNullOrEmpty(nationality)) artist.Nationality = nationality;
        if (!string.IsNullOrEmpty(profileImageUrl)) artist.ProfileImageUrl = profileImageUrl;
        if (!string.IsNullOrEmpty(website)) artist.Website = website;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Profile updated!";
        return RedirectToAction("Profile");
    }

    // ========== ALBUMS ==========
    [HttpGet("manager/albums")]
    public async Task<IActionResult> Albums([FromQuery] string? search)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var query = _context.Albums.Where(a => a.ArtistID == artist.ArtistID).Include(a => a.Songs).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(a => a.Title.Contains(search));

        ViewBag.Albums = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        ViewBag.Search = search;
        ViewBag.ArtistID = artist.ArtistID;

        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "albums";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Albums";
        ViewData["BackUrl"] = "/artist/manager";
        ViewData["BackLabel"] = "Dashboard";

        return View("Albums", artist);
    }

    [HttpPost("manager/albums/create")]
    public async Task<IActionResult> CreateAlbum([FromForm] string title, [FromForm] string? description, [FromForm] string? coverArtUrl)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var album = new Album
        {
            AlbumID = Guid.NewGuid(),
            ArtistID = artist.ArtistID,
            Title = title,
            Description = description ?? "",
            CoverArtUrl = coverArtUrl
        };

        _context.Albums.Add(album);
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album created!";
        return RedirectToAction("Albums");
    }

    [HttpPost("manager/albums/{albumId}/update")]
    public async Task<IActionResult> UpdateAlbum(Guid albumId,
        [FromForm] string? title, [FromForm] string? description, [FromForm] string? coverArtUrl)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var album = await _context.Albums.FirstOrDefaultAsync(a => a.AlbumID == albumId && a.ArtistID == artist.ArtistID);
        if (album == null) return NotFound();

        if (!string.IsNullOrEmpty(title)) album.Title = title;
        if (description != null) album.Description = description;
        if (!string.IsNullOrEmpty(coverArtUrl)) album.CoverArtUrl = coverArtUrl;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album updated!";
        return RedirectToAction("Albums");
    }

    [HttpPost("manager/albums/{albumId}/delete")]
    public async Task<IActionResult> DeleteAlbum(Guid albumId)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var album = await _context.Albums.Include(a => a.Songs).FirstOrDefaultAsync(a => a.AlbumID == albumId && a.ArtistID == artist.ArtistID);
        if (album == null) return NotFound();

        album.IsDeleted = true;
        foreach (var song in album.Songs) song.IsDeleted = true;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album and its songs deleted.";
        return RedirectToAction("Albums");
    }

    // ========== SONGS ==========
    [HttpGet("manager/songs")]
    public async Task<IActionResult> Songs([FromQuery] string? search)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var query = _context.Songs.Where(s => s.UserID == artist.UserID).Include(s => s.AlbumEntity).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.Title.Contains(search));

        var albums = await _context.Albums.Where(a => a.ArtistID == artist.ArtistID && !a.IsDeleted).ToListAsync();

        ViewBag.Songs = await query.OrderByDescending(s => s.UploadedAt).ToListAsync();
        ViewBag.Albums = albums;
        ViewBag.Search = search;

        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "songs";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Songs";
        ViewData["BackUrl"] = "/artist/manager";
        ViewData["BackLabel"] = "Dashboard";

        return View("Songs", artist);
    }

    [HttpPost("manager/songs/{songId}/update")]
    public async Task<IActionResult> UpdateSong(Guid songId,
        [FromForm] string? title, [FromForm] string? mood, [FromForm] string? language,
        [FromForm] string? lyrics, [FromForm] string? credits,
        [FromForm] Guid? albumId, [FromForm] string? coverArtUrl)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var song = await _context.Songs.FirstOrDefaultAsync(s => s.SongID == songId && s.UserID == artist.UserID);
        if (song == null) return NotFound();

        if (!string.IsNullOrEmpty(title)) song.Title = title;
        if (!string.IsNullOrEmpty(mood)) song.Mood = mood;
        if (!string.IsNullOrEmpty(language)) song.Language = language;
        if (lyrics != null) song.Lyrics = lyrics;
        if (credits != null) song.Credits = credits;
        if (!string.IsNullOrEmpty(coverArtUrl)) song.CoverArtUrl = coverArtUrl;
        song.AlbumID = albumId;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song updated!";
        return RedirectToAction("Songs");
    }

    [HttpPost("manager/songs/{songId}/delete")]
    public async Task<IActionResult> DeleteSong(Guid songId)
    {
        var artist = await GetCurrentArtist();
        if (artist == null) return RedirectToAction("Index", "Home");

        var song = await _context.Songs.FirstOrDefaultAsync(s => s.SongID == songId && s.UserID == artist.UserID);
        if (song == null) return NotFound();

        song.IsDeleted = true;
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song deleted.";
        return RedirectToAction("Songs");
    }
}
