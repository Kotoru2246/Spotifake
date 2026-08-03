using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using WebClientMVC.Models;

namespace WebClientMVC.Controllers;

/// <summary>
/// Proxy controller: chuyển tiếp các request /payment/* từ MVC → FastAPI backend.
/// Frontend JS gọi /payment/* → controller này → BackendAI FastAPI.
/// </summary>
[Route("payment")]
public class PaymentController : Controller
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

    public PaymentController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    private string BackendBase =>
        _configuration["BackendApi:BaseUrl"] ?? "http://127.0.0.1:8000";

    // Lấy Bearer token từ cookie hoặc Authorization header của request gốc
    private string? GetBearerToken()
    {
        // Ưu tiên cookie jwt_token (dùng trong MVC app)
        if (Request.Cookies.TryGetValue("jwt_token", out var cookieToken) &&
            !string.IsNullOrEmpty(cookieToken))
            return cookieToken;

        // Fallback: Authorization header
        var auth = Request.Headers.Authorization.ToString();
        if (auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return auth["Bearer ".Length..];

        return null;
    }

    private HttpClient CreateAuthorizedClient()
    {
        var client = _httpClientFactory.CreateClient();
        var token = GetBearerToken();
        if (!string.IsNullOrEmpty(token))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /payment  &  /payment/view  →  Trả về trang giao diện thanh toán riêng biệt
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("")]
    [HttpGet("view")]
    public IActionResult View_()
    {
        return View("~/Views/Payment/Index.cshtml");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /payment/initiate  →  Proxy đến FastAPI POST /payment/initiate
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] PaymentInitRequest request)
    {
        var client = CreateAuthorizedClient();
        var json = JsonSerializer.Serialize(
            new { payment_method = request.PaymentMethod },
            JsonOpts);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync($"{BackendBase}/payment/initiate", content);
            var body = await response.Content.ReadAsStringAsync();
            return Content(body, "application/json", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { detail = $"Backend không phản hồi: {ex.Message}" });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /payment/verify  →  Proxy đến FastAPI POST /payment/verify
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] PaymentVerifyRequest request)
    {
        var client = CreateAuthorizedClient();
        var json = JsonSerializer.Serialize(
            new { transaction_id = request.TransactionId, otp_code = request.OtpCode },
            JsonOpts);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync($"{BackendBase}/payment/verify", content);
            var body = await response.Content.ReadAsStringAsync();
            return Content(body, "application/json", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { detail = $"Backend không phản hồi: {ex.Message}" });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /payment/receipt/{id}  →  Proxy đến FastAPI GET /payment/receipt/{id}
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("receipt/{transactionId}")]
    public async Task<IActionResult> Receipt(string transactionId)
    {
        var client = CreateAuthorizedClient();
        try
        {
            var response = await client.GetAsync($"{BackendBase}/payment/receipt/{transactionId}");
            var body = await response.Content.ReadAsStringAsync();
            return Content(body, "application/json", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { detail = $"Backend không phản hồi: {ex.Message}" });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /payment/history  →  Proxy đến FastAPI GET /payment/history
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        var client = CreateAuthorizedClient();
        try
        {
            var response = await client.GetAsync($"{BackendBase}/payment/history");
            var body = await response.Content.ReadAsStringAsync();
            return Content(body, "application/json", Encoding.UTF8);
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { detail = $"Backend không phản hồi: {ex.Message}" });
        }
    }
}
