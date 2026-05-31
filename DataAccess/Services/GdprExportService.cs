using System.Text.Json;
using System.Text.Json.Serialization;
using DataAccess.Models;

namespace DataAccess.Services
{
    public class GdprExportService
    {
        private readonly MusicPlayerContext _context;

        public GdprExportService(MusicPlayerContext context)
        {
            _context = context;
        }

        public string ExportUserData(Guid userId)
        {
            var user = _context.Users.Find(userId);
            if (user == null) return string.Empty;

            var payload = new
            {
                user = new
                {
                    user.UserID,
                    user.Email,
                    user.SubscriptionTier,
                    user.IsIncognito,
                    user.AccountStatus,
                    user.CreatedAt
                },
                playlists = _context.Playlists
                    .Where(p => p.OwnerUserID == userId)
                    .Select(p => new
                    {
                        p.PlaylistID,
                        p.Title,
                        p.IsPublic,
                        tracks = p.PlaylistTracks.Select(pt => new
                        {
                            pt.SongID,
                            pt.TrackOrder,
                            pt.AddedAt
                        })
                    }),
                sessions = _context.UserSessions
                    .Where(s => s.UserID == userId)
                    .Select(s => new
                    {
                        s.SessionID,
                        s.DeviceName,
                        s.LastActive,
                        s.IsRevoked
                    })
            };

            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };

            return JsonSerializer.Serialize(payload, options);
        }
    }
}
