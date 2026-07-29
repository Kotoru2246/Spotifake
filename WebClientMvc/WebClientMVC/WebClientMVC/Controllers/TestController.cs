using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace WebClientMVC.Controllers
{
    [Route("testclaims")]
    public class TestController : Controller
    {
        [HttpGet]
        public IActionResult GetClaims()
        {
            if (!User.Identity.IsAuthenticated) return Unauthorized();
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            var isInRole = User.IsInRole("artist");
            var name = User.Identity.Name;
            return Ok(new { claims, isInRole, name });
        }
    }
}
