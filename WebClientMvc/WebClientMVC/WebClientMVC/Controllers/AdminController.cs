using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebClientMVC.Services;

namespace WebClientMVC.Controllers;

[Route("admin/api")]
[Authorize(Roles = "admin")]
public class AdminController : Controller
{
    private readonly AdminDashboardService _adminDashboardService;

    public AdminController(AdminDashboardService adminDashboardService)
    {
        _adminDashboardService = adminDashboardService;
    }

    [HttpGet("dashboard")]
    public IActionResult Dashboard()
    {
        return Ok(_adminDashboardService.GetDashboard());
    }

    [HttpPost("accounts/{username}/toggle-status")]
    public IActionResult ToggleAccountStatus(string username)
    {
        try
        {
            return Ok(_adminDashboardService.ToggleAccountState(username));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
    }

    [HttpPost("artists/{username}/toggle-featured")]
    public IActionResult ToggleArtistFeatured(string username)
    {
        try
        {
            return Ok(_adminDashboardService.ToggleArtistFeatured(username));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("music/{fileName}")]
    public IActionResult DeleteMusic(string fileName)
    {
        try
        {
            return Ok(_adminDashboardService.DeleteTrack(fileName));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
    }

    [HttpGet("music/{fileName}/views")]
    public IActionResult SongViewDetails(string fileName)
    {
        try
        {
            return Ok(_adminDashboardService.GetSongDetail(fileName));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
    }

    [HttpGet("music/views")]
    public IActionResult SongViewDetailsByQuery([FromQuery] string fileName)
    {
        try
        {
            return Ok(_adminDashboardService.GetSongDetail(fileName));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { detail = ex.Message });
        }
    }
}
