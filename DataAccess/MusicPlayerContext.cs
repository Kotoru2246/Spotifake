using Microsoft.EntityFrameworkCore;
using DataAccess.Models;

namespace DataAccess
{
    public class MusicPlayerContext : DbContext
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<Song> Songs => Set<Song>();
        public DbSet<Playlist> Playlists => Set<Playlist>();
        public DbSet<PlaylistTrack> PlaylistTracks => Set<PlaylistTrack>();
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<ArtistProfile> ArtistProfiles => Set<ArtistProfile>();
        public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

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
            modelBuilder.Entity<AdminAuditLog>().HasKey(al => al.LogID);

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

            // User -> Songs (one-to-many, uploaded by)
            modelBuilder.Entity<Song>()
                .HasOne(s => s.UploadedBy)
                .WithMany()
                .HasForeignKey(s => s.UserID)
                .OnDelete(DeleteBehavior.SetNull);

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
        }
    }
}
