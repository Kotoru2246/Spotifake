using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace WebClientMVC.Models;

/// <summary>Khởi tạo giao dịch Premium — gửi lên /payment/initiate.</summary>
public sealed class PaymentInitRequest
{
    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty; // "Momo" | "VNPay" | "Thẻ nội địa"
}

/// <summary>Xác thực OTP — gửi lên /payment/verify.</summary>
public sealed class PaymentVerifyRequest
{
    [JsonPropertyName("transaction_id")]
    public string TransactionId { get; set; } = string.Empty;

    [JsonPropertyName("otp_code")]
    public string OtpCode { get; set; } = string.Empty;
}

/// <summary>Response từ /payment/initiate.</summary>
public sealed class PaymentInitResponse
{
    [JsonPropertyName("transaction_id")]
    public string TransactionId { get; set; } = string.Empty;

    [JsonPropertyName("transaction_code")]
    public string TransactionCode { get; set; } = string.Empty;

    [JsonPropertyName("amount_vnd")]
    public int AmountVnd { get; set; } = 18000;

    [JsonPropertyName("plan_name")]
    public string PlanName { get; set; } = string.Empty;

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [JsonPropertyName("payment_info")]
    public Dictionary<string, string> PaymentInfo { get; set; } = new();

    [JsonPropertyName("demo_otp")]
    public string DemoOtp { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

/// <summary>Response từ /payment/verify.</summary>
public sealed class PaymentVerifyResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("transaction_id")]
    public string TransactionId { get; set; } = string.Empty;

    [JsonPropertyName("transaction_code")]
    public string TransactionCode { get; set; } = string.Empty;

    [JsonPropertyName("amount_vnd")]
    public int AmountVnd { get; set; }

    [JsonPropertyName("plan_name")]
    public string PlanName { get; set; } = string.Empty;

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [JsonPropertyName("paid_at")]
    public string PaidAt { get; set; } = string.Empty;

    [JsonPropertyName("expires_at")]
    public string ExpiresAt { get; set; } = string.Empty;

    [JsonPropertyName("subscription_tier")]
    public string SubscriptionTier { get; set; } = string.Empty;
}

/// <summary>Một giao dịch trong lịch sử.</summary>
public sealed class PaymentTransactionRead
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("amount_vnd")]
    public int AmountVnd { get; set; }

    [JsonPropertyName("plan_name")]
    public string PlanName { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [JsonPropertyName("transaction_code")]
    public string TransactionCode { get; set; } = string.Empty;

    [JsonPropertyName("created_at")]
    public string CreatedAt { get; set; } = string.Empty;

    [JsonPropertyName("paid_at")]
    public string? PaidAt { get; set; }

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }
}
