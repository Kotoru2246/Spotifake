namespace WebClientMVC.Models;

/// <summary>Khởi tạo giao dịch Premium — gửi lên /payment/initiate.</summary>
public sealed class PaymentInitRequest
{
    public string PaymentMethod { get; set; } = string.Empty; // "Momo" | "VNPay" | "Thẻ nội địa"
}

/// <summary>Xác thực OTP — gửi lên /payment/verify.</summary>
public sealed class PaymentVerifyRequest
{
    public string TransactionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}

/// <summary>Response từ /payment/initiate.</summary>
public sealed class PaymentInitResponse
{
    public string TransactionId { get; set; } = string.Empty;
    public string TransactionCode { get; set; } = string.Empty;
    public int AmountVnd { get; set; } = 18000;
    public string PlanName { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public Dictionary<string, string> PaymentInfo { get; set; } = new();
    public string DemoOtp { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

/// <summary>Response từ /payment/verify.</summary>
public sealed class PaymentVerifyResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string TransactionCode { get; set; } = string.Empty;
    public int AmountVnd { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaidAt { get; set; } = string.Empty;
    public string ExpiresAt { get; set; } = string.Empty;
    public string SubscriptionTier { get; set; } = string.Empty;
}

/// <summary>Một giao dịch trong lịch sử.</summary>
public sealed class PaymentTransactionRead
{
    public string Id { get; set; } = string.Empty;
    public int AmountVnd { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string TransactionCode { get; set; } = string.Empty;
    public string CreatedAt { get; set; } = string.Empty;
    public string? PaidAt { get; set; }
    public string? ExpiresAt { get; set; }
}
