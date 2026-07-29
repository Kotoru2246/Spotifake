using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    private string GetCurrentUser()
    {
        return User.Identity?.Name ?? throw new InvalidOperationException("Authenticated user name is required.");
    }
}
