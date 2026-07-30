using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebClientMVC.Models;
using WebClientMVC.Services;

namespace WebClientMVC.Controllers;

[Route("playlists")]
[Authorize]
public class PlaylistsController : Controller
{
    private readonly UserPlaylistService _userPlaylistService;

    public PlaylistsController(UserPlaylistService userPlaylistService)
    {
        _userPlaylistService = userPlaylistService;
    }

    [HttpGet("my")]
    public IActionResult MyPlaylists()
    {
        return Ok(_userPlaylistService.GetPlaylists(GetCurrentUser()));
    }

    [HttpGet("details/{playlistId}")]
    [AllowAnonymous]
    public IActionResult GetPlaylistDetails(string playlistId, [FromServices] DataAccess.MusicPlayerContext context)
    {
        if (!Guid.TryParse(playlistId, out var id)) return BadRequest(new { detail = "Invalid ID" });

        var playlist = context.Playlists
            .Include(p => p.Owner)
            .Include(p => p.PlaylistTracks)
                .ThenInclude(pt => pt.Song)
                    .ThenInclude(s => s.AlbumEntity)
            .FirstOrDefault(p => p.PlaylistID == id);

        if (playlist == null) return NotFound(new { detail = "Playlist not found" });

        var username = User.Identity?.Name ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        var user = username != null ? context.Users.FirstOrDefault(u => u.Username == username) : null;
        var userId = user?.UserID;

        if (!playlist.IsPublic && playlist.OwnerUserID != userId)
            return Forbid();

        var dto = new PlaylistSummaryDto
        {
            Id = playlist.PlaylistID.ToString(),
            Name = playlist.Title,
            ImageUrl = playlist.ImageUrl ?? string.Empty,
            IsPublic = playlist.IsPublic,
            IsOwner = playlist.OwnerUserID == userId,
            Type = "Playlist",
            Songs = playlist.PlaylistTracks.Where(pt => pt.Song != null && !pt.Song.IsDeleted && !pt.Song.IsHidden)
                .OrderBy(pt => pt.AddedAt)
                .Select(pt => new PlaylistSongDto
                {
                    FileName = pt.Song.FilePath ?? string.Empty,
                    DisplayName = pt.Song.Title ?? string.Empty,
                    Artist = pt.Song.ArtistName ?? string.Empty,
                    ArtistId = pt.Song.AlbumEntity?.ArtistID.ToString() ?? string.Empty,
                    AlbumId = pt.Song.AlbumID?.ToString() ?? string.Empty,
                    DurationSeconds = pt.Song.DurationSeconds
                }).ToList()
        };

        return Ok(dto);
    }

    [HttpPost("my")]
    public IActionResult Create([FromBody] CreatePlaylistRequest request)
    {
        try
        {
            return Ok(_userPlaylistService.CreatePlaylist(GetCurrentUser(), request.Name, request.ImageUrl, request.SongFileNames));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("my/{playlistId}")]
    public IActionResult Delete(string playlistId)
    {
        try
        {
            return Ok(_userPlaylistService.DeletePlaylist(GetCurrentUser(), playlistId));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
    }

    [HttpPost("my/{playlistId}/songs")]
    public IActionResult AddSong(string playlistId, [FromBody] PlaylistSongRequest request)
    {
        try
        {
            return Ok(_userPlaylistService.AddSong(GetCurrentUser(), playlistId, request.FileName));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("my/{playlistId}/songs/{fileName}")]
    public IActionResult RemoveSong(string playlistId, string fileName)
    {
        try
        {
            return Ok(_userPlaylistService.RemoveSong(GetCurrentUser(), playlistId, fileName));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPost("my/liked/toggle")]
    public IActionResult ToggleLiked([FromBody] PlaylistSongRequest request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.FileName))
        {
            return BadRequest(new { detail = "File name is required." });
        }

        try
        {
            return Ok(_userPlaylistService.ToggleLikedSong(GetCurrentUser(), request.FileName));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPatch("my/{playlistId}/visibility")]
    public IActionResult UpdateVisibility(string playlistId, [FromBody] UpdateVisibilityRequest request)
    {
        try
        {
            _userPlaylistService.UpdatePlaylistVisibility(GetCurrentUser(), playlistId, request.IsPublic);
            return Ok(new { detail = "Visibility updated." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPost("save/{playlistId}")]
    public IActionResult SavePlaylist(string playlistId, [FromServices] DataAccess.MusicPlayerContext context)
    {
        try
        {
            var user = context.Users.FirstOrDefault(u => u.Username == GetCurrentUser());
            if (user == null) return Unauthorized();
            
            if (Guid.TryParse(playlistId, out var id))
            {
                var existing = context.UserSavedPlaylists.FirstOrDefault(sp => sp.UserID == user.UserID && sp.PlaylistID == id);
                if (existing == null)
                {
                    context.UserSavedPlaylists.Add(new DataAccess.Models.UserSavedPlaylist
                    {
                        SavedID = Guid.NewGuid(),
                        UserID = user.UserID,
                        PlaylistID = id,
                        SavedAt = DateTime.UtcNow
                    });
                    context.SaveChanges();
                }
                return Ok(new { detail = "Playlist saved." });
            }
            return BadRequest("Invalid playlist ID.");
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }


    [HttpPost("my/{playlistId}/unsave")]
    public IActionResult UnsavePlaylist(string playlistId, [FromServices] DataAccess.MusicPlayerContext context)
    {
        try
        {
            var user = context.Users.FirstOrDefault(u => u.Username == GetCurrentUser());
            if (user == null) return Unauthorized();
            
            if (Guid.TryParse(playlistId, out var id))
            {
                var existing = context.UserSavedPlaylists.FirstOrDefault(sp => sp.UserID == user.UserID && sp.PlaylistID == id);
                if (existing != null)
                {
                    context.UserSavedPlaylists.Remove(existing);
                    context.SaveChanges();
                }
                return Ok(new { detail = "Playlist unsaved." });
            }
            return BadRequest("Invalid playlist ID.");
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    public class UpdatePlaylistDetailsRequest
    {
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }

    [HttpPut("my/{playlistId}")]
    public IActionResult UpdatePlaylistDetails(string playlistId, [FromBody] UpdatePlaylistDetailsRequest request, [FromServices] DataAccess.MusicPlayerContext context)
    {
        try
        {
            var user = context.Users.FirstOrDefault(u => u.Username == GetCurrentUser());
            if (user == null) return Unauthorized();
            
            if (Guid.TryParse(playlistId, out var id))
            {
                var playlist = context.Playlists.FirstOrDefault(p => p.PlaylistID == id && p.OwnerUserID == user.UserID);
                if (playlist != null)
                {
                    if (!string.IsNullOrWhiteSpace(request.Name)) playlist.Title = request.Name;
                    playlist.ImageUrl = request.ImageUrl;
                    context.SaveChanges();
                    return Ok(new { detail = "Playlist updated." });
                }
                return BadRequest("Playlist not found or permission denied.");
            }
            return BadRequest("Invalid playlist ID.");
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    private string GetCurrentUser()
    {
        var name = User.Identity?.Name 
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                   ?? User.FindFirst("sub")?.Value;
                   
        return name ?? throw new InvalidOperationException("Authenticated user name is required.");
    }
}
