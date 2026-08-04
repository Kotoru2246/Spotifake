using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DataAccess.Models
{
    [Table("PaymentTransactions")]
    public class PaymentTransaction
    {
        [Key]
        public Guid TransactionID { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserID { get; set; }

        public int AmountVND { get; set; } = 18000;

        [MaxLength(100)]
        public string PlanName { get; set; } = "Premium 1 Tháng";

        [MaxLength(20)]
        public string Status { get; set; } = "pending"; // pending, success, failed

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "Momo";

        [MaxLength(50)]
        public string TransactionCode { get; set; } = string.Empty;

        [MaxLength(10)]
        public string OtpCode { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? PaidAt { get; set; }

        public DateTime? ExpiresAt { get; set; }

        [ForeignKey("UserID")]
        public virtual User? User { get; set; }
    }
}
