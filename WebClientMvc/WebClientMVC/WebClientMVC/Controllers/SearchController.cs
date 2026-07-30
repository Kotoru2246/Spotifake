using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebClientMVC.Models;
using DataAccess;
using System.Linq;

namespace WebClientMVC.Controllers;

[Route("search")]
public class SearchController : Controller
{
    private readonly MusicPlayerContext _context;

    public SearchController(MusicPlayerContext context)
    {
        _context = context;
    }

    [HttpGet("global")]
    [AllowAnonymous]
    public IActionResult GlobalSearch([FromQuery] string q = "")
    {
        var query = (q ?? string.Empty).Trim().ToLower();
        if (string.IsNullOrEmpty(query))
        {
            return Ok(new { items = new object[] {} });
        }

        // Search Songs
        var songs = _context.Songs
            .Include(s => s.AlbumEntity)
            .Where(s => !s.IsDeleted && !s.IsHidden && (
                s.Title.ToLower().Contains(query) || 
                s.ArtistName.ToLower().Contains(query) || 
                (s.Tags != null && s.Tags.ToLower().Contains(query))
            ))
            .Select(s => new {
                Type = "Song",
                Id = s.SongID.ToString(),
                Title = s.Title,
                Creator = s.ArtistName,
                ImageUrl = s.CoverArtUrl,
                FileName = s.FilePath,
                AlbumId = s.AlbumID != null ? s.AlbumID.ToString() : null,
                ArtistId = s.AlbumEntity != null ? s.AlbumEntity.ArtistID.ToString() : null
            })
            .Take(10)
            .ToList();

        // Search Albums
        var albums = _context.Albums
            .Include(a => a.Artist)
            .Where(a => !a.IsDeleted && (
                a.Title.ToLower().Contains(query) ||
                (a.Artist != null && a.Artist.StageName.ToLower().Contains(query))
            ))
            .Select(a => new {
                Type = "Album",
                Id = a.AlbumID.ToString(),
                Title = a.Title,
                Creator = a.Artist != null ? a.Artist.StageName : "Unknown",
                ImageUrl = a.CoverArtUrl,
                FileName = ""
            })
            .Take(10)
            .ToList();

        // Search Playlists
        // Note: For playlists, if the user is authenticated, they should see their own even if private.
        // We'll just search all public, plus the user's own if we can identify them.
        var username = User.Identity?.Name 
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value;
        
        var user = username != null ? _context.Users.FirstOrDefault(u => u.Username == username) : null;
        var userId = user?.UserID;

        var playlists = _context.Playlists
            .Include(p => p.Owner)
            .Where(p => (p.IsPublic || p.OwnerUserID == userId) && (
                p.Title.ToLower().Contains(query)
            ))
            .Select(p => new {
                Type = "Playlist",
                Id = p.PlaylistID.ToString(),
                Title = p.Title,
                Creator = p.Owner.DisplayName,
                ImageUrl = p.ImageUrl,
                FileName = ""
            })
            .Take(10)
            .ToList();

        // Search Artists
        var artists = _context.ArtistProfiles
            .Where(a => !a.IsDeleted && (
                a.StageName.ToLower().Contains(query)
            ))
            .Select(a => new {
                Type = "Artist",
                Id = a.ArtistID.ToString(),
                Title = a.StageName,
                Creator = "Profile",
                ImageUrl = a.ProfileImageUrl,
                FileName = ""
            })
            .Take(5)
            .ToList();

        var allItems = new List<object>();
        allItems.AddRange(songs);
        allItems.AddRange(albums);
        allItems.AddRange(playlists);
        allItems.AddRange(artists);

        // Simple relevance sorting: exact matches first
        var sorted = allItems.OrderByDescending(x => {
            var title = (string)x.GetType().GetProperty("Title").GetValue(x, null);
            return title.ToLower() == query ? 1 : 0;
        }).Take(20).ToList();

        return Ok(new { items = sorted });
    }
}
