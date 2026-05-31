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
                optionsBuilder.UseSqlServer("Server=(localdb)\\MSSQLLocalDB;Database=MusicPlayerDb;Trusted_Connection=True;");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasKey(u => u.UserID);
            modelBuilder.Entity<Song>().HasKey(s => s.SongID);
            modelBuilder.Entity<Playlist>().HasKey(p => p.PlaylistID);
            modelBuilder.Entity<PlaylistTrack>().HasKey(pt => pt.MappingID);
            modelBuilder.Entity<UserSession>().HasKey(us => us.SessionID);

            modelBuilder.Entity<PlaylistTrack>()
                .HasOne(pt => pt.Playlist)
                .WithMany(p => p.PlaylistTracks)
                .HasForeignKey(pt => pt.PlaylistID);

            modelBuilder.Entity<PlaylistTrack>()
                .HasOne(pt => pt.Song)
                .WithMany()
                .HasForeignKey(pt => pt.SongID);
        }
    }
}
