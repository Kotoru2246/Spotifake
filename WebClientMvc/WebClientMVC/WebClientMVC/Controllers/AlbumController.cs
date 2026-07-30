using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebClientMVC.Models;

namespace WebClientMVC.Controllers;

[Route("album")]
public class AlbumController : Controller
{
    private readonly DataAccess.MusicPlayerContext _context;

    public AlbumController(DataAccess.MusicPlayerContext context)
    {
        _context = context;
    }

    [HttpGet("details/{albumId}")]
    public IActionResult GetAlbumDetails(Guid albumId)
    {
        var album = _context.Albums
            .Include(a => a.Songs)
            .FirstOrDefault(a => a.AlbumID == albumId && !a.IsDeleted);

        if (album == null)
            return NotFound(new { detail = "Album not found." });

        var dto = new PlaylistSummaryDto
        {
            Id = album.AlbumID.ToString(),
            Name = album.Title,
            ImageUrl = album.CoverArtUrl ?? string.Empty,
            IsPublic = true,
            IsOwner = false,
            Type = "Album",
            Songs = album.Songs.Where(s => !s.IsDeleted && !s.IsHidden).Select(s => new PlaylistSongDto
            {
                FileName = s.FilePath ?? string.Empty,
                DisplayName = s.Title ?? string.Empty,
                Artist = s.ArtistName ?? string.Empty,
                ArtistId = album.ArtistID.ToString(),
                AlbumId = album.AlbumID.ToString(),
                DurationSeconds = s.DurationSeconds
            }).ToList()
        };

        return Ok(dto);
    }
}
