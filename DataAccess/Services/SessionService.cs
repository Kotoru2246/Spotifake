using System;
using System.Linq;
using DataAccess.Models;

namespace DataAccess.Services
{
    public class SessionService
    {
        private readonly MusicPlayerContext _context;

        public SessionService(MusicPlayerContext context)
        {
            _context = context;
        }

        public bool IsDeviceAuthorized(Guid userId, string deviceName)
        {
            return _context.UserSessions.Any(session =>
                session.UserID == userId &&
                session.DeviceName == deviceName &&
                !session.IsRevoked);
        }

        public void RevokeOtherDevices(Guid userId, Guid currentSessionId)
        {
            var sessions = _context.UserSessions
                .Where(session => session.UserID == userId && session.SessionID != currentSessionId)
                .ToList();

            foreach (var session in sessions)
            {
                session.IsRevoked = true;
            }

            _context.SaveChanges();
        }
    }
}
