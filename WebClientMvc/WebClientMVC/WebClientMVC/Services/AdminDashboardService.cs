using WebClientMVC.Models;

namespace WebClientMVC.Services;

public class AdminDashboardService
{
    private readonly object _syncRoot = new();
    private readonly MusicLibraryService _musicLibraryService;
    private readonly SongListenLogService _songListenLogService;
    private readonly List<AdminAccountRecord> _accounts =
    [
        new()
        {
            Username = "user_test",
            DisplayName = "Demo User",
            Role = "user",
            IsActive = true,
            UploadedTracks = 4,
            Notes = "Can stream and download from the shared library.",
            LastActiveUtc = DateTimeOffset.UtcNow.AddMinutes(-16)
        },
        new()
        {
            Username = "listener_plus",
            DisplayName = "Listener Plus",
            Role = "user",
            IsActive = true,
            UploadedTracks = 1,
            Notes = "Uses direct import links for quick previews.",
            LastActiveUtc = DateTimeOffset.UtcNow.AddHours(-5)
        },
        new()
        {
            Username = "night_owl_user",
            DisplayName = "Night Owl",
            Role = "user",
            IsActive = false,
            UploadedTracks = 0,
            Notes = "Paused after repeated failed imports.",
            LastActiveUtc = DateTimeOffset.UtcNow.AddDays(-2)
        },
        new()
        {
            Username = "artist_test",
            DisplayName = "Demo Artist",
            Role = "artist",
            IsActive = true,
            IsFeatured = true,
            UploadedTracks = 12,
            Notes = "Featured on the home carousel this week.",
            LastActiveUtc = DateTimeOffset.UtcNow.AddMinutes(-42)
        },
        new()
        {
            Username = "echo_lane",
            DisplayName = "Echo Lane",
            Role = "artist",
            IsActive = true,
            IsFeatured = false,
            UploadedTracks = 8,
            Notes = "Recently added acoustic sessions.",
            LastActiveUtc = DateTimeOffset.UtcNow.AddHours(-9)
        },
        new()
        {
            Username = "admin_test",
            DisplayName = "System Admin",
            Role = "admin",
            IsActive = true,
            UploadedTracks = 0,
            Notes = "Full administration access.",
            LastActiveUtc = DateTimeOffset.UtcNow.AddMinutes(-3)
        }
    ];

    public AdminDashboardService(MusicLibraryService musicLibraryService, SongListenLogService songListenLogService)
    {
        _musicLibraryService = musicLibraryService;
        _songListenLogService = songListenLogService;
    }

    public AdminDashboardResponse GetDashboard()
    {
        lock (_syncRoot)
        {
            var library = _musicLibraryService.GetLibrary();
            var users = _accounts.Where(account => account.Role == "user").Select(CloneAccount).ToList();
            var artists = _accounts.Where(account => account.Role == "artist").Select(CloneAccount).ToList();
            var admins = _accounts.Count(account => account.Role == "admin");
            var songViews = library.Select(track => new SongListenSummary
            {
                FileName = track.FileName,
                DisplayName = track.DisplayName,
                TotalViews = _songListenLogService.GetSongTotalViews(track.FileName)
            }).ToList();

            return new AdminDashboardResponse
            {
                TotalTracks = library.Count,
                ActiveUsers = users.Count(account => account.IsActive),
                ActiveArtists = artists.Count(account => account.IsActive),
                TotalAdmins = admins,
                MusicFolderPath = _musicLibraryService.MusicFolderPath,
                LastScanUtc = DateTimeOffset.UtcNow,
                Music = library,
                SongViews = songViews,
                Users = users,
                Artists = artists
            };
        }
    }

    public AdminDashboardResponse ToggleAccountState(string username)
    {
        lock (_syncRoot)
        {
            var account = FindAccount(username);
            account.IsActive = !account.IsActive;
            account.LastActiveUtc = DateTimeOffset.UtcNow;
            return GetDashboard();
        }
    }

    public AdminDashboardResponse ToggleArtistFeatured(string username)
    {
        lock (_syncRoot)
        {
            var account = FindAccount(username);
            if (!string.Equals(account.Role, "artist", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Only artist accounts can be featured.");
            }

            account.IsFeatured = !account.IsFeatured;
            account.LastActiveUtc = DateTimeOffset.UtcNow;
            return GetDashboard();
        }
    }

    public AdminDashboardResponse DeleteTrack(string fileName)
    {
        lock (_syncRoot)
        {
            if (!_musicLibraryService.DeleteTrack(fileName))
            {
                throw new InvalidOperationException("The selected music file could not be removed.");
            }

            _songListenLogService.RemoveSong(fileName);

            return GetDashboard();
        }
    }

    public SongListenDetail GetSongDetail(string fileName)
    {
        lock (_syncRoot)
        {
            var library = _musicLibraryService.GetLibrary();
            var normalizedFileName = Path.GetFileName(fileName ?? string.Empty);
            var track = library.FirstOrDefault(item =>
                string.Equals(item.FileName, normalizedFileName, StringComparison.OrdinalIgnoreCase));

            if (track is null)
            {
                throw new InvalidOperationException("The selected song was not found.");
            }

            var listeners = _songListenLogService.GetSongListeners(normalizedFileName);
            return new SongListenDetail
            {
                FileName = normalizedFileName,
                DisplayName = track.DisplayName,
                TotalViews = listeners.Sum(item => item.ListenCount),
                Listeners = listeners
            };
        }
    }

    private AdminAccountRecord FindAccount(string username)
    {
        var account = _accounts.FirstOrDefault(item =>
            string.Equals(item.Username, username, StringComparison.OrdinalIgnoreCase));

        if (account is null)
        {
            throw new InvalidOperationException("The selected account does not exist.");
        }

        return account;
    }

    private static AdminAccountRecord CloneAccount(AdminAccountRecord account)
    {
        return new AdminAccountRecord
        {
            Username = account.Username,
            DisplayName = account.DisplayName,
            Role = account.Role,
            IsActive = account.IsActive,
            IsFeatured = account.IsFeatured,
            UploadedTracks = account.UploadedTracks,
            Notes = account.Notes,
            LastActiveUtc = account.LastActiveUtc
        };
    }
}
