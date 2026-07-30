using Microsoft.EntityFrameworkCore;
using DataAccess.Models;

namespace DataAccess
{
    public class MusicPlayerContext : DbContext
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<Song> Songs => Set<Song>();
        public DbSet<Album> Albums => Set<Album>();
        public DbSet<Playlist> Playlists => Set<Playlist>();
        public DbSet<PlaylistTrack> PlaylistTracks => Set<PlaylistTrack>();
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<UserListeningHistory> UserListeningHistories => Set<UserListeningHistory>();
        public DbSet<UserFavorite> UserFavorites => Set<UserFavorite>();
        public DbSet<Genre> Genres => Set<Genre>();
        public DbSet<UserFollowing> UserFollowings => Set<UserFollowing>();
        public DbSet<ArtistAnalytics> ArtistAnalytics => Set<ArtistAnalytics>();
        public DbSet<ArtistProfile> ArtistProfiles => Set<ArtistProfile>();
        public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();
        public DbSet<ArtistRequest> ArtistRequests => Set<ArtistRequest>();
        public DbSet<UserSavedPlaylist> UserSavedPlaylists => Set<UserSavedPlaylist>();
        public DbSet<UserSavedAlbum> UserSavedAlbums => Set<UserSavedAlbum>();

        public MusicPlayerContext()
        {
        }

        public MusicPlayerContext(DbContextOptions<MusicPlayerContext> options)
            : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=localhost;Database=MusicPlayerDb;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Keys
            modelBuilder.Entity<User>().HasKey(u => u.UserID);
            modelBuilder.Entity<Song>().HasKey(s => s.SongID);
            modelBuilder.Entity<Playlist>().HasKey(p => p.PlaylistID);
            modelBuilder.Entity<PlaylistTrack>().HasKey(pt => pt.MappingID);
            modelBuilder.Entity<UserSession>().HasKey(us => us.SessionID);
            modelBuilder.Entity<ArtistProfile>().HasKey(ap => ap.ArtistID);
            modelBuilder.Entity<Album>().HasKey(a => a.AlbumID);
            modelBuilder.Entity<AdminAuditLog>().HasKey(al => al.LogID);
            modelBuilder.Entity<ArtistRequest>().HasKey(ar => ar.RequestID);

            // Unique constraints
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<ArtistProfile>().HasIndex(ap => ap.UserID).IsUnique();

            // --- User relationships ---

            // User -> Playlists (one-to-many)
            modelBuilder.Entity<Playlist>()
                .HasOne(p => p.Owner)
                .WithMany(u => u.Playlists)
                .HasForeignKey(p => p.OwnerUserID)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> Sessions (one-to-many)
            modelBuilder.Entity<UserSession>()
                .HasOne(us => us.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(us => us.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> ArtistProfile (one-to-one)
            modelBuilder.Entity<ArtistProfile>()
                .HasOne(ap => ap.User)
                .WithOne(u => u.ArtistProfile)
                .HasForeignKey<ArtistProfile>(ap => ap.UserID)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> AdminAuditLogs (one-to-many, via AdminID)
            modelBuilder.Entity<AdminAuditLog>()
                .HasOne(al => al.Admin)
                .WithMany(u => u.AdminActions)
                .HasForeignKey(al => al.AdminID)
                .OnDelete(DeleteBehavior.Cascade);

            // User -> ArtistRequests (one-to-many)
            modelBuilder.Entity<ArtistRequest>()
                .HasOne(ar => ar.User)
                .WithMany()
                .HasForeignKey(ar => ar.UserID)
                .OnDelete(DeleteBehavior.Restrict);

            // User -> Songs (one-to-many, uploaded by)
            modelBuilder.Entity<Song>()
                .HasOne(s => s.UploadedBy)
                .WithMany()
                .HasForeignKey(s => s.UserID)
                .OnDelete(DeleteBehavior.SetNull);

            // Album -> ArtistProfile (one-to-many)
            modelBuilder.Entity<Album>()
                .HasOne(a => a.Artist)
                .WithMany()
                .HasForeignKey(a => a.ArtistID)
                .OnDelete(DeleteBehavior.Cascade);

            // Song -> Album (many-to-one)
            modelBuilder.Entity<Song>()
                .HasOne(s => s.AlbumEntity)
                .WithMany(a => a.Songs)
                .HasForeignKey(s => s.AlbumID)
                .OnDelete(DeleteBehavior.Restrict);

            // --- Existing PlaylistTrack relationships ---
            modelBuilder.Entity<PlaylistTrack>()
                .HasOne(pt => pt.Playlist)
                .WithMany(p => p.PlaylistTracks)
                .HasForeignKey(pt => pt.PlaylistID)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PlaylistTrack>()
    .HasOne(pt => pt.Song)
    .WithMany()
    .HasForeignKey(pt => pt.SongID)
    .OnDelete(DeleteBehavior.Cascade);

            // ===== UserListeningHistory Configuration =====
            modelBuilder.Entity<UserListeningHistory>(entity =>
            {
                entity.HasKey(e => e.HistoryID);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Song)
                    .WithMany()
                    .HasForeignKey(e => e.SongID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.UserID, e.PlayedAt })
                    .IsDescending(false, true);

                entity.HasIndex(e => new { e.SongID, e.PlayedAt });
            });

            // ===== UserFavorite Configuration =====
            modelBuilder.Entity<UserFavorite>(entity =>
            {
                entity.HasKey(e => e.FavoriteID);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Song)
                    .WithMany()
                    .HasForeignKey(e => e.SongID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.UserID, e.SongID })
                    .IsUnique();
            });

            // ===== Genre Configuration =====
            modelBuilder.Entity<Genre>(entity =>
            {
                entity.HasKey(e => e.GenreID);

                entity.HasIndex(e => e.Slug).IsUnique();

                entity.HasMany(e => e.Songs)
                    .WithOne(s => s.Genre)
                    .HasForeignKey("GenreID")
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // ===== UserFollowing Configuration =====
            modelBuilder.Entity<UserFollowing>(entity =>
            {
                entity.HasKey(e => e.FollowingID);

                entity.HasOne(e => e.FollowerUser)
                    .WithMany()
                    .HasForeignKey(e => e.FollowerUserID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.FollowedUser)
                    .WithMany()
                    .HasForeignKey(e => e.FollowedUserID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.FollowerUserID, e.FollowedUserID })
                    .IsUnique();
            });

            // ===== ArtistAnalytics Configuration =====
            modelBuilder.Entity<ArtistAnalytics>(entity =>
            {
                entity.HasKey(e => e.AnalyticsID);

                entity.HasOne(e => e.Artist)
                    .WithMany()
                    .HasForeignKey(e => e.ArtistID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.ArtistID, e.Date })
                    .IsUnique();

                entity.HasIndex(e => e.Date);
            });

            // ===== UserSavedPlaylist Configuration =====
            modelBuilder.Entity<UserSavedPlaylist>(entity =>
            {
                entity.HasKey(e => e.SavedID);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserID)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Playlist)
                    .WithMany()
                    .HasForeignKey(e => e.PlaylistID)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(e => new { e.UserID, e.PlaylistID }).IsUnique();
            });

            // ===== UserSavedAlbum Configuration =====
            modelBuilder.Entity<UserSavedAlbum>(entity =>
            {
                entity.HasKey(e => e.SavedID);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserID)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Album)
                    .WithMany()
                    .HasForeignKey(e => e.AlbumID)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(e => new { e.UserID, e.AlbumID }).IsUnique();
            });
        }
    }
}