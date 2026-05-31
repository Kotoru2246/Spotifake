using System;

namespace DataAccess.Models
{
    public class UserSession
    {
        public Guid SessionID { get; set; }
        public Guid UserID { get; set; }
        public string DeviceName { get; set; } = string.Empty;
        public DateTime LastActive { get; set; } = DateTime.UtcNow;
        public bool IsRevoked { get; set; }
    }
}
