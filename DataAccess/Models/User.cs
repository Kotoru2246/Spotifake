using System;

namespace DataAccess.Models
{
    public class User
    {
        public Guid UserID { get; set; }
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string SubscriptionTier { get; set; } = "Free";
        public bool IsIncognito { get; set; }
        public string AccountStatus { get; set; } = "Active";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
