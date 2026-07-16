using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebClientMVC.Models;
using WebClientMVC.Services;

namespace WebClientMVC.Controllers;

[Route("admin/dashboard")]
public class AdminDashboardController : Controller
{
    private readonly AdminDashboardService _adminDashboardService;
    private readonly UserPlaylistService _userPlaylistService;
    private readonly MusicLibraryService _musicLibraryService;

    public AdminDashboardController(AdminDashboardService adminDashboardService, UserPlaylistService userPlaylistService, MusicLibraryService musicLibraryService)
    {
        _adminDashboardService = adminDashboardService;
        _userPlaylistService = userPlaylistService;
        _musicLibraryService = musicLibraryService;
    }

    [HttpGet("")]
    public IActionResult Index()
    {
        var model = new AdminDashboardPageViewModel
        {
            Dashboard = _adminDashboardService.GetDashboard()
        };

        return View(model);
    }

    [HttpGet("users")]
    public IActionResult Users()
    {
        var model = new AdminDashboardPageViewModel
        {
            Dashboard = _adminDashboardService.GetDashboard()
        };

        return View(model);
    }

    [HttpPost("users/{username}/toggle")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult ToggleUser(string username)
    {
        _adminDashboardService.ToggleAccountState(username);
        return RedirectToAction(nameof(Users));
    }

    [HttpGet("users/{username}/playlists")]
    [Authorize(Roles = "admin")]
    public IActionResult UserPlaylists(string username)
    {
        var model = new AdminUserPlaylistsViewModel
        {
            Username = username,
            Playlists = _userPlaylistService.GetPlaylists(username),
            LibrarySongs = _musicLibraryService.GetLibrary()
        };

        return View(model);
    }

    [HttpPost("users/{username}/playlists")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult CreateUserPlaylist(string username, [FromForm] string name)
    {
        _userPlaylistService.CreatePlaylist(username, name, string.Empty);
        return RedirectToAction(nameof(UserPlaylists), new { username });
    }

    [HttpPost("users/{username}/playlists/{playlistId}/delete")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult DeleteUserPlaylist(string username, string playlistId)
    {
        _userPlaylistService.DeletePlaylist(username, playlistId);
        return RedirectToAction(nameof(UserPlaylists), new { username });
    }

    [HttpPost("users/{username}/playlists/{playlistId}/songs")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult AddSongToUserPlaylist(string username, string playlistId, [FromForm] string fileName)
    {
        _userPlaylistService.AddSong(username, playlistId, fileName);
        return RedirectToAction(nameof(UserPlaylists), new { username });
    }

    [HttpPost("users/{username}/playlists/{playlistId}/songs/{fileName}/delete")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult RemoveSongFromUserPlaylist(string username, string playlistId, string fileName)
    {
        _userPlaylistService.RemoveSong(username, playlistId, fileName);
        return RedirectToAction(nameof(UserPlaylists), new { username });
    }

    [HttpGet("artists")]
    public IActionResult Artists()
    {
        var model = new AdminDashboardPageViewModel
        {
            Dashboard = _adminDashboardService.GetDashboard()
        };

        return View(model);
    }

    [HttpPost("artists/{username}/toggle")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult ToggleArtistStatus(string username)
    {
        _adminDashboardService.ToggleAccountState(username);
        return RedirectToAction(nameof(Artists));
    }

    [HttpPost("artists/{username}/feature")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult ToggleArtistFeature(string username)
    {
        _adminDashboardService.ToggleArtistFeatured(username);
        return RedirectToAction(nameof(Artists));
    }

    [HttpGet("music")]
    public IActionResult Music([FromQuery] string? fileName)
    {
        SongListenDetail? selectedSongDetail = null;
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            try
            {
                selectedSongDetail = _adminDashboardService.GetSongDetail(fileName);
            }
            catch (InvalidOperationException)
            {
                selectedSongDetail = null;
            }
        }

        var model = new AdminDashboardPageViewModel
        {
            Dashboard = _adminDashboardService.GetDashboard(),
            SelectedSongDetail = selectedSongDetail
        };

        return View(model);
    }

    [HttpPost("music/{fileName}/delete")]
    [Authorize(Roles = "admin")]
    [ValidateAntiForgeryToken]
    public IActionResult DeleteMusic(string fileName)
    {
        _adminDashboardService.DeleteTrack(fileName);
        return RedirectToAction(nameof(Music));
    }
}
