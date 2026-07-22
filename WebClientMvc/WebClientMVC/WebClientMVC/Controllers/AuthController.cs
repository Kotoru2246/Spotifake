using Microsoft.AspNetCore.Mvc;

namespace WebClientMVC.Controllers;

/// <summary>
/// Auth is handled entirely client-side via JavaScript calling FastAPI directly.
/// This controller exists only for Razor view routing.
/// </summary>
public class AuthController : Controller
{
    // Authentication is handled client-side via JavaScript calling FastAPI endpoints.
    // No server-side auth logic is needed in the MVC layer.
    public IActionResult Index()
    {
        return RedirectToAction("Index", "Home");
    }
}
