using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebClientMVC.Models;
using WebClientMVC.Services;
using Microsoft.EntityFrameworkCore;

namespace WebClientMVC.Controllers;

[Route("music")]
public class MusicController : Controller
{
    private readonly MusicLibraryService _musicLibraryService;
    private readonly SongListenLogService _songListenLogService;

    public MusicController(MusicLibraryService musicLibraryService, SongListenLogService songListenLogService)
    {
        _musicLibraryService = musicLibraryService;
        _songListenLogService = songListenLogService;
    }

    [HttpGet("library")]
    [AllowAnonymous]
    public IActionResult Library()
    {
        return Ok(_musicLibraryService.GetLibrary());
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public IActionResult Search([FromQuery] string name = "", [FromQuery] int maxResults = 5)
    {
        return Ok(_musicLibraryService.Search(name, maxResults));
    }

    [HttpGet("stream/{fileName}")]
    [AllowAnonymous]
    public IActionResult Stream(string fileName)
    {
        if (!_musicLibraryService.TryGetFilePath(fileName, out var filePath))
        {
            return NotFound();
        }

        var contentType = GetContentType(filePath);
        return PhysicalFile(filePath, contentType, enableRangeProcessing: true);
    }

    [HttpGet("download/{fileName}")]
    [AllowAnonymous]
    public IActionResult Download(string fileName)
    {
        if (!_musicLibraryService.TryGetDownloadPath(fileName, out var filePath))
        {
            return NotFound();
        }

        var contentType = GetContentType(filePath);
        return PhysicalFile(filePath, contentType, fileDownloadName: Path.GetFileName(filePath), enableRangeProcessing: true);
    }

    [HttpPost("record-play")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordPlay([FromBody] MusicListenRequest request, [FromServices] DataAccess.MusicPlayerContext context)
    {
        DataAccess.Models.Song? song = null;
        
        if (!string.IsNullOrWhiteSpace(request.Id) && Guid.TryParse(request.Id, out var songId))
        {
            song = await context.Songs.FirstOrDefaultAsync(s => s.SongID == songId);
        }
        else
        {
            var fileName = Path.GetFileName(request.FileName ?? string.Empty);
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                song = await context.Songs.FirstOrDefaultAsync(s => s.FilePath == fileName);
            }
        }

        if (song != null)
        {
            song.PlayCount++;
            await context.SaveChangesAsync();
            return Ok();
        }
        return NotFound();
    }

    [HttpPost("upload")]
    [Authorize]
    [RequestSizeLimit(200_000_000)]
    public async Task<IActionResult> Upload([FromForm] List<IFormFile> files)
    {
        if (files is null || files.Count == 0)
        {
            return BadRequest(new { detail = "No audio files were provided." });
        }

        var saved = await _musicLibraryService.SaveUploadsAsync(files);
        return Ok(new { items = saved });
    }

    [HttpPost("import")]
    [Authorize]
    public async Task<IActionResult> Import([FromBody] MusicImportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Url))
        {
            return BadRequest(new { detail = "A direct audio URL is required." });
        }

        try
        {
            var savedItem = await _musicLibraryService.ImportFromUrlAsync(request.Url);
            return Ok(savedItem);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPost("listen")]
    [AllowAnonymous]
    public IActionResult Listen([FromBody] MusicListenRequest request)
    {
        var fileName = Path.GetFileName(request.FileName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return BadRequest(new { detail = "A music file name is required." });
        }

        if (!_musicLibraryService.TryGetFilePath(fileName, out _))
        {
            return NotFound(new { detail = "The selected song was not found." });
        }

        var username = User.Identity?.Name 
                       ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value 
                       ?? "anonymous";
        var userId = User.Identity?.IsAuthenticated == true ? username : "anonymous";

        _songListenLogService.RecordListen(fileName, userId);
        return Ok(new { detail = "Listen event recorded." });
    }

    [HttpPost("albums/save/{albumId}")]
    [Authorize]
    public IActionResult SaveAlbum(string albumId, [FromServices] DataAccess.MusicPlayerContext context)
    {
        try
        {
            var username = User.Identity?.Name 
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value;
            var user = context.Users.FirstOrDefault(u => u.Username == username);
            if (user == null) return Unauthorized();
            
            if (Guid.TryParse(albumId, out var id))
            {
                var existing = context.UserSavedAlbums.FirstOrDefault(sa => sa.UserID == user.UserID && sa.AlbumID == id);
                if (existing == null)
                {
                    context.UserSavedAlbums.Add(new DataAccess.Models.UserSavedAlbum
                    {
                        SavedID = Guid.NewGuid(),
                        UserID = user.UserID,
                        AlbumID = id,
                        SavedAt = DateTime.UtcNow
                    });
                    context.SaveChanges();
                }
                return Ok(new { detail = "Album saved." });
            }
            return BadRequest("Invalid album ID.");
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPost("albums/unsave/{albumId}")]
    [Authorize]
    public IActionResult UnsaveAlbum(string albumId, [FromServices] DataAccess.MusicPlayerContext context)
    {
        try
        {
            var username = User.Identity?.Name 
                           ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                           ?? User.FindFirst("sub")?.Value;
            var user = context.Users.FirstOrDefault(u => u.Username == username);
            if (user == null) return Unauthorized();
            
            if (Guid.TryParse(albumId, out var id))
            {
                var existing = context.UserSavedAlbums.FirstOrDefault(sa => sa.UserID == user.UserID && sa.AlbumID == id);
                if (existing != null)
                {
                    context.UserSavedAlbums.Remove(existing);
                    context.SaveChanges();
                }
                return Ok(new { detail = "Album unsaved." });
            }
            return BadRequest("Invalid album ID.");
        }
        catch (Exception ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    private static string GetContentType(string filePath)
    {
        return Path.GetExtension(filePath).ToLowerInvariant() switch
        {
            ".wav" => "audio/wav",
            ".ogg" => "audio/ogg",
            ".m4a" => "audio/mp4",
            ".flac" => "audio/flac",
            ".aac" => "audio/aac",
            _ => "audio/mpeg"
        };
    }
}