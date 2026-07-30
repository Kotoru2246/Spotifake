using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using DataAccess;
using DataAccess.Models;
using Microsoft.EntityFrameworkCore;

namespace WebClientMVC.Controllers;

[Route("artist")]
[Authorize]
public class ArtistController : Controller
{
    private readonly MusicPlayerContext _context;
    private readonly IConfiguration _configuration;

    public ArtistController(MusicPlayerContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // Helper: get current user + artist profile
    private async Task<(User? user, ArtistProfile? profile)> GetCurrentArtist()
    {
        var username = User.Identity?.Name
                       ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(username)) return (null, null);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return (null, null);

        var profile = await _context.ArtistProfiles
            .Include(a => a.User)
            .FirstOrDefaultAsync(p => p.UserID == user.UserID);
        return (user, profile);
    }

    // ========== DASHBOARD ==========
    [HttpGet("manager")]
    public async Task<IActionResult> Manager()
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null) return RedirectToAction("Index", "Home");

        if (user.Role != "artist")
        {
            var pending = await _context.ArtistProfiles.FirstOrDefaultAsync(p => p.UserID == user.UserID);
            if (pending != null)
            {
                ViewBag.PendingMessage = $"Your artist application is currently: {pending.Status}";
                return View("Pending");
            }
            return View("Register");
        }

        if (profile == null) return RedirectToAction("Index", "Home");

        // Stats
        var songs = await _context.Songs.Where(s => s.UserID == user.UserID && !s.IsDeleted).ToListAsync();
        var albums = await _context.Albums.Where(a => a.ArtistID == profile.ArtistID && !a.IsDeleted).ToListAsync();
        
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

        return View("Dashboard", profile);
    }

    // ========== EDIT PROFILE ==========
    [HttpGet("manager/profile")]
    public async Task<IActionResult> EditProfile()
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null || user.Role != "artist")
            return RedirectToAction("Manager");

        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "profile";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Edit Profile";
        ViewData["BackUrl"] = "/artist/manager";
        ViewData["BackLabel"] = "Dashboard";

        return View("EditProfile", profile);
    }

    [HttpPost("manager/profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromForm] string stageName, [FromForm] string bio,
        [FromForm] string? nationality, [FromForm] string? website,
        [FromForm] string? profileImageUrl, [FromForm] string? bannerImageUrl, [FromForm] DateTime? dateOfBirth)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        profile.StageName = stageName ?? profile.StageName;
        profile.Bio = bio ?? profile.Bio;
        profile.Nationality = nationality ?? profile.Nationality;
        profile.Website = website ?? profile.Website;
        profile.ProfileImageUrl = profileImageUrl ?? profile.ProfileImageUrl;
        profile.BannerImageUrl = bannerImageUrl ?? profile.BannerImageUrl;
        profile.DateOfBirth = dateOfBirth ?? profile.DateOfBirth;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Profile updated successfully!";
        return RedirectToAction("EditProfile");
    }

    // ========== ALBUM MANAGER ==========
    [HttpGet("manager/albums")]
    public async Task<IActionResult> Albums()
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null || user.Role != "artist")
            return RedirectToAction("Manager");

        var albums = await _context.Albums
            .Where(a => a.ArtistID == profile.ArtistID)
            .Include(a => a.Songs)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        ViewBag.Albums = albums;
        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "albums";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Albums";
        ViewData["BackUrl"] = "/artist/manager";
        ViewData["BackLabel"] = "Dashboard";

        return View("Albums", profile);
    }

    [HttpPost("manager/albums/create")]
    public async Task<IActionResult> CreateAlbum(
        [FromForm] string title, [FromForm] string? description,
        [FromForm] string? coverArtUrl, [FromForm] IFormFile? coverArtFile)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        byte[]? coverData = null;
        if (coverArtFile != null)
        {
            using var ms = new MemoryStream();
            await coverArtFile.CopyToAsync(ms);
            coverData = ms.ToArray();
        }

        var album = new Album
        {
            ArtistID = profile.ArtistID,
            Title = title,
            Description = description ?? "",
            CoverArtUrl = coverArtUrl,
            CoverArtData = coverData
        };
        _context.Albums.Add(album);
        await _context.SaveChangesAsync();

        TempData["SuccessMessage"] = "Album created!";
        return RedirectToAction("Albums");
    }

    [HttpPost("manager/albums/{albumId}/update")]
    public async Task<IActionResult> UpdateAlbum(Guid albumId,
        [FromForm] string title, [FromForm] string? description,
        [FromForm] string? coverArtUrl)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        var album = await _context.Albums.FirstOrDefaultAsync(a => a.AlbumID == albumId && a.ArtistID == profile.ArtistID);
        if (album == null) return NotFound();

        album.Title = title ?? album.Title;
        album.Description = description ?? album.Description;
        if (!string.IsNullOrEmpty(coverArtUrl)) album.CoverArtUrl = coverArtUrl;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album updated!";
        return RedirectToAction("Albums");
    }

    [HttpPost("manager/albums/{albumId}/delete")]
    public async Task<IActionResult> DeleteAlbum(Guid albumId)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        var album = await _context.Albums
            .Include(a => a.Songs)
            .FirstOrDefaultAsync(a => a.AlbumID == albumId && a.ArtistID == profile.ArtistID);
        if (album == null) return NotFound();

        album.IsDeleted = true;
        // Cascade soft-delete to songs in this album
        foreach (var song in album.Songs)
        {
            song.IsDeleted = true;
        }

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album deleted.";
        return RedirectToAction("Albums");
    }

    [HttpPost("manager/albums/{albumId}/restore")]
    public async Task<IActionResult> RestoreAlbum(Guid albumId)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        var album = await _context.Albums
            .Include(a => a.Songs)
            .FirstOrDefaultAsync(a => a.AlbumID == albumId && a.ArtistID == profile.ArtistID);
        if (album == null) return NotFound();

        album.IsDeleted = false;
        // Cascade restore to songs in this album
        foreach (var song in album.Songs)
        {
            song.IsDeleted = false;
        }

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Album restored.";
        return RedirectToAction("Albums");
    }

    [HttpPost("manager/songs/upload")]
    public async Task<IActionResult> UploadSong([FromForm] IFormFile audioFile, [FromForm] Guid? albumId)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        if (audioFile == null || audioFile.Length == 0)
        {
            TempData["ErrorMessage"] = "Please select an audio file.";
            return RedirectToAction("Songs");
        }

        var rawName = Path.GetFileNameWithoutExtension(audioFile.FileName);
        var (artistName, title) = ExtractArtistAndTitle(rawName);

        byte[] fileData;
        using (var memoryStream = new MemoryStream())
        {
            await audioFile.CopyToAsync(memoryStream);
            fileData = memoryStream.ToArray();
        }

        var song = new Song
        {
            Title = title,
            ArtistName = artistName,
            UserID = user.UserID,
            AlbumID = albumId,
            FileData = fileData,
            FilePath = "", // Clear the file path since it's stored in DB
            UploadedAt = DateTime.UtcNow,
            PlayCount = 0,
            DurationSeconds = 0,
            IsDeleted = false,
            Tags = "analyzing...",
            Mood = "analyzing..."
        };

        _context.Songs.Add(song);
        await _context.SaveChangesAsync();

        // 4. Trigger background extraction in the Python backend
        try
        {
            var client = new HttpClient();
            var response = await client.PostAsync($"http://127.0.0.1:8000/songs/{song.SongID}/extract", null);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"[DEBUG] Failed to trigger feature extraction for Song {song.SongID}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Error calling extraction endpoint: {ex.Message}");
        }

        TempData["SuccessMessage"] = "Song uploaded and fully analyzed successfully!";
        return RedirectToAction("Songs");
    }

    private static (string Artist, string Title) ExtractArtistAndTitle(string rawName)
    {
        var normalized = rawName.Replace('_', ' ').Trim();
        var separators = new[] { " - ", " – ", " — " };

        foreach (var separator in separators)
        {
            var pieces = normalized.Split(separator, 2, StringSplitOptions.TrimEntries);
            if (pieces.Length == 2 && !string.IsNullOrWhiteSpace(pieces[0]) && !string.IsNullOrWhiteSpace(pieces[1]))
            {
                return (BuildDisplayName(pieces[0]), BuildDisplayName(pieces[1]));
            }
        }
        return ("Unknown Artist", BuildDisplayName(rawName));
    }

    private static string BuildDisplayName(string rawName)
    {
        var normalized = rawName.Replace('_', ' ').Replace('-', ' ').Trim();
        if (string.IsNullOrWhiteSpace(normalized)) return "Untitled Track";
        return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(normalized.ToLowerInvariant());
    }

    private static string CreateUniqueFileName(string baseName, string extension)
    {
        var safeBase = string.Concat(baseName.Where(ch => !Path.GetInvalidFileNameChars().Contains(ch))).Trim();
        if (string.IsNullOrWhiteSpace(safeBase)) safeBase = "Imported Track";
        var stamp = DateTimeOffset.UtcNow.ToString("yyyyMMddHHmmssfff", System.Globalization.CultureInfo.InvariantCulture);
        return $"{safeBase} {stamp}{extension}";
    }

    // ========== SONG MANAGER ==========
    [HttpGet("manager/songs")]
    public async Task<IActionResult> Songs()
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null || user.Role != "artist")
            return RedirectToAction("Manager");

        var songs = await _context.Songs
            .Where(s => s.UserID == user.UserID)
            .Include(s => s.AlbumEntity)
            .OrderByDescending(s => s.UploadedAt)
            .ToListAsync();

        var albums = await _context.Albums
            .Where(a => a.ArtistID == profile.ArtistID && !a.IsDeleted)
            .ToListAsync();

        ViewBag.Songs = songs;
        ViewBag.Albums = albums;
        ViewData["DashboardType"] = "artist";
        ViewData["CurrentPage"] = "songs";
        ViewData["PageEyebrow"] = "Artist Manager";
        ViewData["Title"] = "Songs";
        ViewData["BackUrl"] = "/artist/manager";
        ViewData["BackLabel"] = "Dashboard";

        return View("Songs", profile);
    }

    [HttpPost("manager/songs/{songId}/update")]
    public async Task<IActionResult> UpdateSong(Guid songId,
        [FromForm] string? title, [FromForm] string? mood,
        [FromForm] string? language, [FromForm] string? lyrics,
        [FromForm] string? credits, [FromForm] string? customGenre,
        [FromForm] Guid? albumId)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        var song = await _context.Songs.FirstOrDefaultAsync(s => s.SongID == songId && s.UserID == user.UserID);
        if (song == null) return NotFound();

        if (!string.IsNullOrEmpty(title)) song.Title = title;
        if (!string.IsNullOrEmpty(mood)) song.Mood = mood;
        if (!string.IsNullOrEmpty(language)) song.Language = language;
        if (lyrics != null) song.Lyrics = lyrics;
        if (credits != null) song.Credits = credits;
        if (!string.IsNullOrEmpty(customGenre)) song.Tags = customGenre;
        song.AlbumID = albumId;

        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song updated!";
        return RedirectToAction("Songs");
    }

    [HttpPost("manager/songs/{songId}/delete")]
    public async Task<IActionResult> DeleteSong(Guid songId)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        var song = await _context.Songs.FirstOrDefaultAsync(s => s.SongID == songId && s.UserID == user.UserID);
        if (song == null) return NotFound();

        song.IsDeleted = true;
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song deleted.";
        return RedirectToAction("Songs");
    }

    [HttpPost("manager/songs/{songId}/restore")]
    public async Task<IActionResult> RestoreSong(Guid songId)
    {
        var (user, profile) = await GetCurrentArtist();
        if (user == null || profile == null) return RedirectToAction("Manager");

        var song = await _context.Songs.FirstOrDefaultAsync(s => s.SongID == songId && s.UserID == user.UserID);
        if (song == null) return NotFound();

        song.IsDeleted = false;
        await _context.SaveChangesAsync();
        TempData["SuccessMessage"] = "Song restored.";
        return RedirectToAction("Songs");
    }

    // ========== REGISTRATION (unchanged logic, but now creates ArtistRequest) ==========
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromForm] string stageName, [FromForm] string bio,
        [FromForm] IFormFile? cvFile, [FromForm] IFormFile? demoFile)
    {
        var username = User.Identity?.Name
                       ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized();

        var existingRequest = await _context.ArtistRequests.FirstOrDefaultAsync(r => r.UserID == user.UserID && r.Status == "Pending");
        if (existingRequest != null)
        {
            TempData["ErrorMessage"] = "You already have a pending application.";
            return RedirectToAction("Manager");
        }

        byte[]? cvData = null; string cvName = "";
        if (cvFile != null)
        {
            using var ms = new MemoryStream();
            await cvFile.CopyToAsync(ms);
            cvData = ms.ToArray();
            cvName = cvFile.FileName;
        }

        byte[]? demoData = null; string demoName = "";
        if (demoFile != null)
        {
            using var ms = new MemoryStream();
            await demoFile.CopyToAsync(ms);
            demoData = ms.ToArray();
            demoName = demoFile.FileName;
        }

        var request = new ArtistRequest
        {
            UserID = user.UserID,
            StageName = stageName ?? user.DisplayName,
            CvFileData = cvData,
            CvFileName = cvName,
            DemoFileData = demoData,
            DemoFileName = demoName
        };
        _context.ArtistRequests.Add(request);

        // Also create a pending ArtistProfile for backward compat
        var existingProfile = await _context.ArtistProfiles.FirstOrDefaultAsync(p => p.UserID == user.UserID);
        if (existingProfile == null)
        {
            var profile = new ArtistProfile
            {
                UserID = user.UserID,
                StageName = stageName ?? user.DisplayName,
                Bio = bio ?? "",
                Status = "Pending"
            };
            _context.ArtistProfiles.Add(profile);
        }

        await _context.SaveChangesAsync();
        return RedirectToAction("Manager");
    }

    // ========== DEBUG (kept from original) ==========
    [HttpGet("debug-cookies")]
    [AllowAnonymous]
    public IActionResult DebugCookies()
    {
        var cookies = Request.Cookies.ToDictionary(k => k.Key, v => v.Value);
        var isAuthenticated = User.Identity?.IsAuthenticated;
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Json(new { Cookies = cookies, IsAuthenticated = isAuthenticated, Claims = claims });
    }

    // ========== PUBLIC DETAILS ==========
    [HttpGet("details/{artistId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetArtistDetails(Guid artistId)
    {
        var profile = await _context.ArtistProfiles
            .FirstOrDefaultAsync(a => a.ArtistID == artistId && !a.IsDeleted);

        if (profile == null) return NotFound();

        var songs = await _context.Songs
            .Where(s => s.UserID == profile.UserID && !s.IsDeleted && !s.IsHidden)
            .OrderByDescending(s => s.PlayCount)
            .Take(5)
            .Select(s => new {
                id = s.SongID,
                title = s.Title,
                artist = s.ArtistName,
                coverUrl = s.CoverArtUrl ?? "",
                fileName = s.FilePath ?? "",
                playCount = s.PlayCount,
                duration = s.DurationSeconds
            })
            .ToListAsync();

        var albums = await _context.Albums
            .Where(a => a.ArtistID == artistId && !a.IsDeleted)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new {
                id = a.AlbumID,
                title = a.Title,
                coverUrl = a.CoverArtUrl ?? "",
                type = "Album", // Could determine singles vs albums here based on song count later
                year = a.CreatedAt.Year
            })
            .ToListAsync();

        return Ok(new
        {
            id = profile.ArtistID,
            name = profile.StageName,
            bannerUrl = profile.BannerImageUrl ?? "",
            profileUrl = profile.ProfileImageUrl ?? "",
            monthlyListeners = profile.FollowersCount * 123 + 4567, // Mocking monthly listeners for now
            verified = profile.Verified,
            popularSongs = songs,
            discography = albums
        });
    }
}
