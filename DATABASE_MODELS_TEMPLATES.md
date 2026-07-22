# 🛠️ MISSING DATABASE MODELS - CODE TEMPLATES

**Ready to copy & paste!**

---

## 📁 CREATE THESE FILES IN `DataAccess/Models/`

---

## 1️⃣ UserListeningHistory.cs

```csharp
using System;

namespace DataAccess.Models
{
	/// <summary>
	/// Tracks every song play by users for recommendations and analytics
	/// This will eventually sync to MongoDB for big data analytics
	/// </summary>
	public class UserListeningHistory
	{
		public Guid HistoryID { get; set; } = Guid.NewGuid();

		// Foreign Keys
		public Guid UserID { get; set; }
		public Guid SongID { get; set; }

		// Listening Details
		public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
		public int SecondsListened { get; set; }      // How long (0-duration)
		public bool IsSkipped { get; set; } = false;   // Did user skip?
		public bool IsCompleted { get; set; } = false; // Did they finish?

		// Device & Session Info
		public string? DeviceType { get; set; }        // desktop, mobile, tablet
		public string? SessionID { get; set; }         // Link to session
		public string? Quality { get; set; }           // low, medium, high
		public bool IsOffline { get; set; } = false;   // Offline playback?

		// Navigation Properties
		public User? User { get; set; }
		public Song? Song { get; set; }

		// Helper Property
		public double ListeningPercentage => 
			SecondsListened > 0 ? (double)SecondsListened / (Song?.DurationSeconds ?? 1) * 100 : 0;
	}
}
```

**Why This Matters:**
- Track listening behavior for ML recommendations
- Understand user preferences (skip rate, completion rate)
- Build "Recently Played" playlists
- Analytics for artists (play count, skip rate per song)

---

## 2️⃣ UserFavorite.cs

```csharp
using System;

namespace DataAccess.Models
{
	/// <summary>
	/// User's favorite/liked songs
	/// Quick access without querying listening history
	/// </summary>
	public class UserFavorite
	{
		public Guid FavoriteID { get; set; } = Guid.NewGuid();

		// Foreign Keys
		public Guid UserID { get; set; }
		public Guid SongID { get; set; }

		// Metadata
		public DateTime FavoritedAt { get; set; } = DateTime.UtcNow;
		public int Rating { get; set; } = 5;        // 1-5 stars
		public string? Notes { get; set; }          // User's personal notes

		// Navigation Properties
		public User? User { get; set; }
		public Song? Song { get; set; }
	}
}
```

**Why This Matters:**
- Show "Liked Songs" playlist
- Separate from listening history (user explicitly likes)
- Quick lookup (indexed on UserID)
- Better than listening history for true preferences

---

## 3️⃣ Genre.cs

```csharp
using System;
using System.Collections.Generic;

namespace DataAccess.Models
{
	/// <summary>
	/// Music genres for categorization
	/// Better than storing genre as string in Song model
	/// </summary>
	public class Genre
	{
		public Guid GenreID { get; set; } = Guid.NewGuid();

		// Basic Info
		public string Name { get; set; } = string.Empty;      // "Pop", "Rock", "Jazz"
		public string Description { get; set; } = string.Empty;
		public string Color { get; set; } = "#808080";        // Hex color for UI

		// SEO & Display
		public string Slug { get; set; } = string.Empty;      // "pop", "rock-metal"
		public string? IconUrl { get; set; }                  // Icon URL
		public int SongCount { get; set; } = 0;               // Cached count

		// Metadata
		public bool IsActive { get; set; } = true;
		public int DisplayOrder { get; set; } = 0;            // For sorting
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		// Navigation Properties
		public List<Song> Songs { get; set; } = new();
	}
}
```

**Why This Matters:**
- Browse by genre
- Genre-based recommendations
- Analytics by genre
- Better structure than string

---

## 4️⃣ UserFollowing.cs

```csharp
using System;

namespace DataAccess.Models
{
	/// <summary>
	/// User follows another user (for artist discovery and social features)
	/// Supports: follower → artist, fan → fan, user → playlist creator
	/// </summary>
	public class UserFollowing
	{
		public Guid FollowingID { get; set; } = Guid.NewGuid();

		// Foreign Keys
		public Guid FollowerUserID { get; set; }      // Who is following
		public Guid FollowedUserID { get; set; }      // Who is being followed

		// Metadata
		public DateTime FollowedAt { get; set; } = DateTime.UtcNow;
		public bool IsMuted { get; set; } = false;    // Mute notifications from this user
		public string? Notes { get; set; }            // Why I follow (private)

		// Navigation Properties
		public User? FollowerUser { get; set; }
		public User? FollowedUser { get; set; }
	}
}
```

**Why This Matters:**
- Discover new artists
- Social network features
- "You follow X artists" on profile
- Featured artists based on follows
- Muting feature (follow but no notifications)

---

## 5️⃣ ArtistAnalytics.cs

```csharp
using System;

namespace DataAccess.Models
{
	/// <summary>
	/// Daily analytics for artists
	/// Aggregated from UserListeningHistory
	/// Synced daily to MongoDB for historical analysis
	/// </summary>
	public class ArtistAnalytics
	{
		public Guid AnalyticsID { get; set; } = Guid.NewGuid();

		// Foreign Key
		public Guid ArtistID { get; set; }

		// Time Period (daily snapshot)
		public DateTime Date { get; set; } = DateTime.UtcNow.Date;

		// Listening Metrics
		public int TotalPlays { get; set; } = 0;              // Total song plays
		public int UniqueListeners { get; set; } = 0;         // Unique users
		public double AverageDurationListened { get; set; } = 0;  // Avg seconds
		public double SkipRate { get; set; } = 0;             // 0-1 (0-100%)
		public double CompletionRate { get; set; } = 0;       // 0-1 (0-100%)

		// Follower Metrics
		public int NewFollowers { get; set; } = 0;
		public int TotalFollowers { get; set; } = 0;

		// Engagement
		public int NewFavorites { get; set; } = 0;
		public int PlaylistAdditions { get; set; } = 0;

		// Geography (if tracking)
		public string? TopCountry { get; set; }
		public string? TopCity { get; set; }

		// Revenue (if applicable)
		public decimal EstimatedRevenue { get; set; } = 0m;

		// Navigation Properties
		public ArtistProfile? Artist { get; set; }
	}
}
```

**Why This Matters:**
- Artist dashboard stats
- Performance tracking over time
- Identify trending songs/artists
- Revenue estimation
- Platform insights

---

## 🔧 UPDATE: MusicPlayerContext.cs

Add these DbSet properties to your MusicPlayerContext.cs:

```csharp
// Add at the top level of MusicPlayerContext class:

public DbSet<UserListeningHistory> UserListeningHistories { get; set; } = 
	Set<UserListeningHistory>();
public DbSet<UserFavorite> UserFavorites { get; set; } = 
	Set<UserFavorite>();
public DbSet<Genre> Genres { get; set; } = 
	Set<Genre>();
public DbSet<UserFollowing> UserFollowings { get; set; } = 
	Set<UserFollowing>();
public DbSet<ArtistAnalytics> ArtistAnalytics { get; set; } = 
	Set<ArtistAnalytics>();
```

---

## 🔌 UPDATE: OnModelCreating() in MusicPlayerContext

Add these configurations inside the `OnModelCreating` method:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
	// ... existing code ...

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

		// Important indexes for queries
		entity.HasIndex(e => new { e.UserID, e.PlayedAt })
			.IsDescending(false, true)
			.HasDatabaseName("IX_ListeningHistory_UserTime");

		entity.HasIndex(e => new { e.SongID, e.PlayedAt })
			.HasDatabaseName("IX_ListeningHistory_SongTime");
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

		// Unique constraint: user can only favorite a song once
		entity.HasIndex(e => new { e.UserID, e.SongID })
			.IsUnique()
			.HasDatabaseName("IX_UserFavorite_Unique");
	});

	// ===== Genre Configuration =====
	modelBuilder.Entity<Genre>(entity =>
	{
		entity.HasKey(e => e.GenreID);

		entity.HasIndex(e => e.Slug)
			.IsUnique()
			.HasDatabaseName("IX_Genre_Slug");

		entity.HasMany(e => e.Songs)
			.WithOne()
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
			.OnDelete(DeleteBehavior.Cascade);

		// Can't follow same user twice
		entity.HasIndex(e => new { e.FollowerUserID, e.FollowedUserID })
			.IsUnique()
			.HasDatabaseName("IX_UserFollowing_Unique");
	});

	// ===== ArtistAnalytics Configuration =====
	modelBuilder.Entity<ArtistAnalytics>(entity =>
	{
		entity.HasKey(e => e.AnalyticsID);

		entity.HasOne(e => e.Artist)
			.WithMany()
			.HasForeignKey(e => e.ArtistID)
			.OnDelete(DeleteBehavior.Cascade);

		// Unique: one analytics record per artist per day
		entity.HasIndex(e => new { e.ArtistID, e.Date })
			.IsUnique()
			.HasDatabaseName("IX_ArtistAnalytics_ArtistDate");

		entity.HasIndex(e => e.Date)
			.HasDatabaseName("IX_ArtistAnalytics_Date");
	});

	// ... rest of existing configuration ...
}
```

---

## 🎯 UPDATE: Song.cs Model

Add GenreID foreign key to Song model:

```csharp
public class Song
{
	public Guid SongID { get; set; }
	public Guid? UserID { get; set; }
	public Guid? GenreID { get; set; }              // ← ADD THIS

	public string Title { get; set; } = string.Empty;
	public string ArtistName { get; set; } = string.Empty;
	public int DurationSeconds { get; set; }
	public string FilePath { get; set; } = string.Empty;
	public long PlayCount { get; set; }
	public bool IsHidden { get; set; }

	// Aliases
	public string Name => Title;
	public string Artist => ArtistName;

	// Navigation
	public User? UploadedBy { get; set; }
	public Genre? Genre { get; set; }              // ← ADD THIS
}
```

---

## 📊 DATABASE MIGRATION COMMANDS

After creating all files and updating context, run:

```powershell
# Open Package Manager Console in Visual Studio
# Or use Terminal

Add-Migration AddListeningHistoryAndRelatedModels

# Review the migration file, then:

Update-Database
```

**Migration will create tables:**
- ✅ UserListeningHistory
- ✅ UserFavorite
- ✅ Genre
- ✅ UserFollowing
- ✅ ArtistAnalytics
- ✅ Add GenreID column to Song table

---

## ✅ WHAT YOU'LL HAVE AFTER THIS

**SQL Database:**
```sql
-- New Tables
- UserListeningHistory (track song plays)
- UserFavorite (liked songs)
- Genre (music genres)
- UserFollowing (social network)
- ArtistAnalytics (daily stats)

-- Modified Tables
- Song (added GenreID foreign key)

-- Total: 8 models, 5 new relationships
```

**Capabilities:**
✅ Browse by genre  
✅ Track listening history for recommendations  
✅ Like/favorite songs  
✅ Follow artists  
✅ View artist analytics  
✅ Social discovery features  

---

## 🚀 NEXT STEPS

1. **Create the 5 model files** (copy from above)
2. **Update MusicPlayerContext.cs** (add DbSets + configurations)
3. **Update Song.cs** (add GenreID)
4. **Create EF Core migration**
5. **Run Update-Database**
6. **Test by running app**

**Then MongoDB integration (next week)**

---

**Ready to implement? Copy the code above and create the files! 🎵**
