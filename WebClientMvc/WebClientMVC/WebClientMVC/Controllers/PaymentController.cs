using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DataAccess;
using DataAccess.Models;
using WebClientMVC.Models;

namespace WebClientMVC.Controllers;

/// <summary>
/// Controller xử lý trực tiếp nghiệp vụ Thanh toán Premium trên WebClientMVC kết nối thực tế với CSDL SQL Server (MusicPlayerDb).
/// </summary>
[Route("payment")]
public class PaymentController : Controller
{
    private readonly MusicPlayerContext _db;

    public PaymentController(MusicPlayerContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Lấy user hiện tại trong DB. Nếu chưa có (ví dụ user_test), tự động tạo trong DB để ghi nhận giao dịch hợp lệ.
    /// </summary>
    private async Task<User> GetOrCreateCurrentUserAsync()
    {
        var username = User.Identity?.Name 
                       ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value
                       ?? "user_test";

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null)
        {
            user = new User
            {
                UserID = Guid.NewGuid(),
                Username = username,
                Email = $"{username}@spotifake.local",
                DisplayName = username,
                Role = "user",
                AccountStatus = "Active",
                SubscriptionTier = "Free",
                IsPremium = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }

        // Kiểm tra hết hạn Premium
        if ((user.SubscriptionTier == "Premium" || user.IsPremium) && user.PremiumExpiresAt.HasValue)
        {
            if (user.PremiumExpiresAt.Value < DateTime.UtcNow)
            {
                user.SubscriptionTier = "Free";
                user.IsPremium = false;
                await _db.SaveChangesAsync();
            }
        }

        return user;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /payment  &  /payment/view  →  Trả về trang giao diện thanh toán
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("")]
    [HttpGet("view")]
    public IActionResult View_()
    {
        return View("~/Views/Payment/Index.cshtml");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /payment/initiate  →  Khởi tạo giao dịch thanh toán vào DB
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost("initiate")]
    public async Task<IActionResult> Initiate([FromBody] PaymentInitRequest? request)
    {
        var method = request?.PaymentMethod ?? "Momo";
        var validMethods = new[] { "Momo", "VNPay", "Thẻ nội địa", "Thẻ Ngân Hàng" };
        if (!validMethods.Any(m => string.Equals(m, method, StringComparison.OrdinalIgnoreCase)))
        {
            method = "Momo";
        }

        var user = await GetOrCreateCurrentUserAsync();

        // Tạo mã giao dịch & OTP ngẫu nhiên
        var prefix = method.ToUpper().Contains("MOMO") ? "MOMO" : method.ToUpper().Contains("VN") ? "VNPAY" : "CARD";
        var randomSuffix = Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
        var txCode = $"{prefix}-{randomSuffix}";
        var otp = Random.Shared.Next(100000, 999999).ToString();

        var txn = new PaymentTransaction
        {
            TransactionID = Guid.NewGuid(),
            UserID = user.UserID,
            AmountVND = 18000,
            PlanName = "Premium 1 Tháng",
            Status = "pending",
            PaymentMethod = method,
            TransactionCode = txCode,
            OtpCode = otp,
            CreatedAt = DateTime.UtcNow
        };

        _db.PaymentTransactions.Add(txn);
        await _db.SaveChangesAsync();

        var paymentInfo = new Dictionary<string, string>();
        if (string.Equals(method, "Momo", StringComparison.OrdinalIgnoreCase))
        {
            paymentInfo.Add("account", "0987654321");
            paymentInfo.Add("account_name", "SPOTIFAKE PREMIUM MOMO");
            paymentInfo.Add("bank", "Ví Điện Tử MoMo");
            paymentInfo.Add("qr_hint", "Mở ứng dụng MoMo quét mã hoặc nhập Demo OTP bên dưới để trải nghiệm ngay.");
        }
        else if (string.Equals(method, "VNPay", StringComparison.OrdinalIgnoreCase))
        {
            paymentInfo.Add("account", "VNPAY-SPOTIFAKE");
            paymentInfo.Add("account_name", "CÔNG TY SPOTIFAKE VN");
            paymentInfo.Add("bank", "Cổng thanh toán VNPay QR");
            paymentInfo.Add("qr_hint", "Quét mã qua ứng dụng Ngân Hàng hoặc nhập Demo OTP bên dưới để trải nghiệm ngay.");
        }
        else
        {
            paymentInfo.Add("account", "19034567890001");
            paymentInfo.Add("account_name", "SPOTIFAKE PREMIUM");
            paymentInfo.Add("bank", "Ngân hàng Techcombank");
            paymentInfo.Add("qr_hint", "Chuyển khoản theo mã giao dịch hoặc nhập Demo OTP bên dưới để trải nghiệm ngay.");
        }

        return Ok(new
        {
            transaction_id = txn.TransactionID.ToString(),
            amount_vnd = txn.AmountVND,
            plan_name = txn.PlanName,
            status = txn.Status,
            payment_method = txn.PaymentMethod,
            transaction_code = txn.TransactionCode,
            demo_otp = txn.OtpCode,
            message = "Giao dịch đã được tạo. Nhập Demo OTP để xác nhận.",
            payment_info = paymentInfo
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /payment/verify  →  Xác minh OTP, nâng cấp Premium & cập nhật DB
    // ─────────────────────────────────────────────────────────────────────────
    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] PaymentVerifyRequest? request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.TransactionId) || !Guid.TryParse(request.TransactionId, out var txGuid))
        {
            return BadRequest(new { detail = "Mã giao dịch không hợp lệ." });
        }

        var user = await GetOrCreateCurrentUserAsync();
        var txn = await _db.PaymentTransactions.FirstOrDefaultAsync(x => x.TransactionID == txGuid);

        if (txn == null)
        {
            return NotFound(new { detail = "Giao dịch không tồn tại trong hệ thống." });
        }

        if (txn.UserID != user.UserID)
        {
            return StatusCode(403, new { detail = "Không có quyền xác thực giao dịch này." });
        }

        if (txn.Status == "success")
        {
            return BadRequest(new { detail = "Giao dịch này đã được thanh toán thành công và không thể xác thực lại." });
        }

        if (string.IsNullOrWhiteSpace(request.OtpCode) || string.Equals(txn.OtpCode.Trim(), request.OtpCode.Trim(), StringComparison.Ordinal) == false)
        {
            // Không chuyển ngay trạng thái sang 'failed' khi gõ nhầm OTP để người dùng có thể nhập lại cho đúng
            return BadRequest(new { detail = "Mã OTP không chính xác. Vui lòng kiểm tra lại 6 chữ số hiển thị ở ô phía trên và thử lại." });
        }

        var now = DateTime.UtcNow;
        var expires = now.AddDays(30);

        // Cập nhật trạng thái thành công cho giao dịch
        txn.Status = "success";
        txn.PaidAt = now;
        txn.ExpiresAt = expires;

        // Cập nhật tài khoản người dùng sang gói Premium
        user.SubscriptionTier = "Premium";
        user.IsPremium = true;
        user.PremiumExpiresAt = expires;
        user.UpdatedAt = now;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Thanh toán thành công! Tài khoản đã được nâng cấp lên Spotifake Premium VIP.",
            transaction_id = txn.TransactionID.ToString(),
            transaction_code = txn.TransactionCode,
            amount_vnd = txn.AmountVND,
            plan_name = txn.PlanName,
            payment_method = txn.PaymentMethod,
            paid_at = txn.PaidAt.Value.ToString("yyyy-MM-ddTHH:mm:ss"),
            expires_at = txn.ExpiresAt.Value.ToString("yyyy-MM-ddTHH:mm:ss"),
            subscription_tier = "Premium"
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /payment/receipt/{id}  →  Chi tiết biên lai giao dịch
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("receipt/{transactionId}")]
    public async Task<IActionResult> Receipt(string transactionId)
    {
        if (!Guid.TryParse(transactionId, out var txGuid))
        {
            return BadRequest(new { detail = "Mã giao dịch không hợp lệ." });
        }

        var txn = await _db.PaymentTransactions.FirstOrDefaultAsync(x => x.TransactionID == txGuid);
        if (txn == null)
        {
            return NotFound(new { detail = "Không tìm thấy biên lai giao dịch." });
        }

        return Ok(new
        {
            success = txn.Status == "success",
            message = "Chi tiết biên lai giao dịch.",
            transaction_id = txn.TransactionID.ToString(),
            transaction_code = txn.TransactionCode,
            amount_vnd = txn.AmountVND,
            plan_name = txn.PlanName,
            payment_method = txn.PaymentMethod,
            paid_at = (txn.PaidAt ?? txn.CreatedAt).ToString("yyyy-MM-ddTHH:mm:ss"),
            expires_at = (txn.ExpiresAt ?? txn.CreatedAt.AddDays(30)).ToString("yyyy-MM-ddTHH:mm:ss"),
            subscription_tier = "Premium"
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /payment/history  →  Lấy toàn bộ lịch sử thanh toán thành công của user
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("history")]
    public async Task<IActionResult> History()
    {
        var user = await GetOrCreateCurrentUserAsync();
        var list = await _db.PaymentTransactions
            .Where(x => x.UserID == user.UserID)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                id = x.TransactionID.ToString(),
                transaction_code = x.TransactionCode,
                amount_vnd = x.AmountVND,
                plan_name = x.PlanName,
                status = x.Status,
                payment_method = x.PaymentMethod,
                created_at = x.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ss"),
                paid_at = x.PaidAt.HasValue ? x.PaidAt.Value.ToString("yyyy-MM-ddTHH:mm:ss") : null,
                expires_at = x.ExpiresAt.HasValue ? x.ExpiresAt.Value.ToString("yyyy-MM-ddTHH:mm:ss") : null
            })
            .ToListAsync();

        return Ok(list);
    }
}
