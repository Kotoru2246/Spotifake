# 📊 DATABASE SCHEMA ANALYSIS & ENHANCEMENTS

**Date:** 2024  
**Analysis Status:** ✅ Complete  
**Current Schema Status:** 70% - Good foundation, needs NoSQL integration

---

## ✅ WHAT YOU ALREADY HAVE (SQL Server)

### Core Models - Present
```
✅ User.cs
   - UserID, Username, Email, PasswordHash
   - Role (user, artist, admin) ← Good for artist browsing
   - DisplayName, Bio, AvatarUrl
   - SubscriptionTier, IsIncognito
   - IsEmailVerified, AccountStatus
   - CreatedAt, UpdatedAt
   - Navigation: Playlists, Sessions, ArtistProfile, AdminActions

✅ ArtistProfile.cs (✅ ALREADY EXISTS!)
   - ArtistID, UserID (FK)
   - StageName, Bio, Genre
   - Verified status
   - FollowersCount
   - Website, CreatedAt
   - Navigation: User

✅ Song.cs
   - SongID, Title, ArtistName
   - UserID (FK to uploader)
   - DurationSeconds, FilePath
   - PlayCount, IsHidden
   - Navigation: UploadedBy (User)

✅ Playlist.cs
   - PlaylistID, UserID (FK)
   - Name, Description
   - CreatedAt, UpdatedAt
   - IsPublic

✅ PlaylistTrack.cs
   - MappingID (PK)
   - PlaylistID (FK), SongID (FK)
   - AddedAt (timestamp)

✅ UserSession.cs
   - SessionID, UserID (FK)
   - SessionToken, ExpiresAt
   - UserAgent, IPAddress
   - CreatedAt

✅ AdminAuditLog.cs
   - LogID, AdminID (FK)
   - Action (DELETE_SONG, BAN_USER, VERIFY_ARTIST)
   - TargetType, TargetID
   - Details, Timestamp
```

---

## ❌ WHAT'S MISSING (SQL Server - Relational)

### 1. **UserListeningHistory (SQL Server)**
Currently missing! You need to track song plays for recommendations.

```csharp
public class UserListeningHistory
{
	public Guid HistoryID { get; set; }
	public Guid UserID { get; set; }              // FK
	public Guid SongID { get; set; }              // FK
	public DateTime PlayedAt { get; set; }
	public int SecondsListened { get; set; }      // How long they listened
	public bool IsSkipped { get; set; }           // Did user skip?
	public bool IsCompleted { get; set; }         // Did they finish?

	// Navigation
	public User User { get; set; } = null!;
	public Song Song { get; set; } = null!;
}
```

### 2. **UserFavorites (SQL Server)**
For quick access to liked songs

```csharp
public class UserFavorite
{
	public Guid FavoriteID { get; set; }
	public Guid UserID { get; set; }              // FK
	public Guid SongID { get; set; }              // FK
	public DateTime FavoritedAt { get; set; }

	// Navigation
	public User User { get; set; } = null!;
	public Song Song { get; set; } = null!;
}
```

### 3. **Genre (SQL Server)**
Better than string in Song model

```csharp
public class Genre
{
	public Guid GenreID { get; set; }
	public string Name { get; set; } = string.Empty;  // "Pop", "Rock", "Jazz"
	public string Description { get; set; } = string.Empty;

	// Navigation
	public List<Song> Songs { get; set; } = new();
}
```

### 4. **UserFollowing (SQL Server)**
For artist/user following

```csharp
public class UserFollowing
{
	public Guid FollowingID { get; set; }
	public Guid FollowerUserID { get; set; }      // Who is following
	public Guid FollowedUserID { get; set; }      // Who is being followed
	public DateTime FollowedAt { get; set; }

	// Navigation
	public User FollowerUser { get; set; } = null!;
	public User FollowedUser { get; set; } = null!;
}
```

### 5. **ArtistAnalytics (SQL Server)**
For artist dashboard stats

```csharp
public class ArtistAnalytics
{
	public Guid AnalyticsID { get; set; }
	public Guid ArtistID { get; set; }            // FK to ArtistProfile
	public DateTime Date { get; set; }
	public int TotalPlays { get; set; }
	public int UniqueListerners { get; set; }
	public double AverageDurationListened { get; set; }
	public int NewFollowers { get; set; }
	public double SkipRate { get; set; }

	// Navigation
	public ArtistProfile Artist { get; set; } = null!;
}
```

---

## 🚨 WHAT YOU REALLY NEED (MongoDB - NoSQL)

Your teacher is RIGHT! You need MongoDB for:

### **Why MongoDB?**
- ✅ **Unstructured data** (logs, analytics, user behavior)
- ✅ **Scalability** (billions of listening events)
- ✅ **Flexibility** (add fields without migration)
- ✅ **Performance** (fast writes for real-time logging)
- ✅ **Real-time analytics** (BSON queries)

### **Collections Needed in MongoDB:**

#### 1. **ListeningHistory Collection**
```json
{
  "_id": ObjectId("..."),
  "userId": UUID,
  "songId": UUID,
  "playedAt": ISODate("2024-01-15T10:30:00Z"),
  "secondsListened": 180,
  "isSkipped": false,
  "isCompleted": true,
  "deviceType": "desktop",
  "sessionId": UUID,
  "quality": "high",
  "offline": false
}
```

**Indexes Needed:**
```
{ userId: 1, playedAt: -1 }     // Recent history for user
{ songId: 1, playedAt: -1 }     // Song play trends
{ playedAt: -1 }                 // Time-series queries
```

#### 2. **ActivityLogs Collection**
```json
{
  "_id": ObjectId("..."),
  "userId": UUID,
  "action": "song_played|playlist_created|artist_followed|song_searched",
  "targetType": "song|playlist|artist|user",
  "targetId": UUID,
  "timestamp": ISODate("2024-01-15T10:30:00Z"),
  "metadata": {
	"ipAddress": "192.168.1.1",
	"userAgent": "Mozilla/5.0...",
	"deviceType": "mobile",
	"country": "VN",
	"city": "Hanoi"
  },
  "status": "success|failed",
  "errorMessage": "...",
  "duration": 145  // milliseconds
}
```

**Indexes Needed:**
```
{ userId: 1, timestamp: -1 }    // User activity feed
{ action: 1, timestamp: -1 }    // Activity trends
{ timestamp: -1 }                // Recent activities
```

#### 3. **UserBehaviorAnalytics Collection**
```json
{
  "_id": ObjectId("..."),
  "userId": UUID,
  "date": ISODate("2024-01-15T00:00:00Z"),
  "listeningSessions": 5,
  "totalMinutesListened": 145,
  "uniqueSongsPlayed": 12,
  "genrePreferences": {
	"pop": 0.4,
	"rock": 0.3,
	"jazz": 0.3
  },
  "moodTrends": {
	"happy": 0.6,
	"melancholic": 0.4
  },
  "peakListeningHour": 21,  // 9 PM
  "skipRate": 0.15,
  "completionRate": 0.85,
  "newFavoriteSongs": 3,
  "playlistsCreated": 1,
  "artistsFollowed": 2
}
```

**Indexes Needed:**
```
{ userId: 1, date: -1 }         // User analytics over time
{ date: -1 }                     // Daily analytics trend
```

#### 4. **RecommendationCache Collection**
```json
{
  "_id": ObjectId("..."),
  "userId": UUID,
  "type": "based_on_history|based_on_favorites|trending|similar_artists",
  "recommendations": [
	{
	  "songId": UUID,
	  "score": 0.92,
	  "reason": "Similar to your favorite songs",
	  "genreMatch": 0.95,
	  "moodMatch": 0.88
	}
  ],
  "generatedAt": ISODate("2024-01-15T10:30:00Z"),
  "expiresAt": ISODate("2024-01-16T10:30:00Z"),
  "clickedOn": ["songId1", "songId2"],
  "engagementScore": 0.73
}
```

**Indexes Needed:**
```
{ userId: 1, expiresAt: 1 }     // TTL index (auto-delete)
{ userId: 1, type: 1 }           // Recommendation queries
```

#### 5. **SearchQueries Collection**
```json
{
  "_id": ObjectId("..."),
  "userId": UUID,
  "query": "taylor swift love story",
  "searchedAt": ISODate("2024-01-15T10:30:00Z"),
  "resultsCount": {
	"songs": 45,
	"artists": 3,
	"playlists": 12
  },
  "clickedResults": {
	"songId": [UUID1, UUID2],
	"artistId": [UUID3],
	"playlistId": [UUID4]
  },
  "timeSpentSearching": 45,  // seconds
  "deviceType": "mobile"
}
```

---

## 🎯 DATABASE ARCHITECTURE RECOMMENDATION

```
┌─────────────────────────────────────────────────────────────┐
│                   DUAL DATABASE SYSTEM                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SQL SERVER (Relational - Structured Data)                │
│  ├─ User (1:1 → ArtistProfile)                            │
│  ├─ Song (N:M → Playlist via PlaylistTrack)               │
│  ├─ Playlist (User → Playlist → Song)                     │
│  ├─ ArtistProfile (Artist browsing) ⭐ EXISTS             │
│  ├─ Genre (categorization)                                │
│  ├─ UserFollowing (social features)                       │
│  ├─ UserFavorites (quick queries)                         │
│  ├─ AdminAuditLog ✅ EXISTS                               │
│  └─ (Transactional, ACID, Real-time data)                │
│                                                             │
│ ↕️ (Async sync via message queue or scheduled job)        │
│                                                             │
│  MONGODB (NoSQL - Unstructured Data)                       │
│  ├─ ListeningHistory (billions of records) ⭐ PRIORITY   │
│  ├─ ActivityLogs (user behavior tracking) ⭐ PRIORITY    │
│  ├─ UserBehaviorAnalytics (daily summaries)               │
│  ├─ RecommendationCache (ML model results)                │
│  ├─ SearchQueries (analytics)                             │
│  ├─ UserNotifications (fan-out model)                     │
│  └─ (Scalable, flexible schema, time-series data)        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION ROADMAP

### PHASE 1: SQL Server Enhancements (PRIORITY 1)
**Time: 2-3 days**

1. **Create Missing SQL Models:**
   - [ ] UserListeningHistory.cs
   - [ ] UserFavorite.cs
   - [ ] Genre.cs
   - [ ] UserFollowing.cs
   - [ ] ArtistAnalytics.cs

2. **Update Existing Models:**
   - [ ] Add GenreID to Song model (FK)
   - [ ] Add methods to User for artist browsing
   - [ ] Add relationships to MusicPlayerContext

3. **Create EF Core Migrations:**
   ```powershell
   Add-Migration AddListeningHistoryAndRelationships
   Update-Database
   ```

---

### PHASE 2: MongoDB Integration (PRIORITY 1)
**Time: 1-2 weeks**

1. **Setup MongoDB:**
   - Install MongoDB Community or Atlas
   - Create database: `spotifake_analytics`
   - Create collections with indexes

2. **Create MongoDB Data Models (C#):**
   - [ ] ListeningHistoryMongo.cs
   - [ ] ActivityLogMongo.cs
   - [ ] UserBehaviorAnalyticsMongo.cs
   - [ ] RecommendationCacheMongo.cs
   - [ ] SearchQueryMongo.cs

3. **NuGet Packages:**
   ```xml
   <PackageReference Include="MongoDB.Driver" Version="2.23.0" />
   <PackageReference Include="MongoDB.Bson" Version="2.23.0" />
   ```

4. **Create Repository Pattern:**
   - [ ] `Services/MongoAnalyticsRepository.cs`
   - [ ] `Services/ListeningHistoryService.cs`
   - [ ] `Services/ActivityLogService.cs`

5. **Async Sync Service:**
   - [ ] `Services/MongoSyncService.cs` (SQL → MongoDB)
   - Sync UserListeningHistory to MongoDB every hour
   - Sync UserFavorites to MongoDB cache

---

### PHASE 3: Advanced Features (PRIORITY 2)
**Time: 2-3 weeks**

1. **Artist Browsing Feature:**
   - [ ] `Services/ArtistBrowsingService.cs`
   - [ ] Web API endpoints: `/api/artists`, `/api/artists/{id}`, `/api/artists/browse`
   - [ ] Dashboard for artists to view analytics
   - [ ] Follower management

2. **Analytics Dashboard:**
   - [ ] Real-time listening stats
   - [ ] Behavior trends
   - [ ] Recommendation effectiveness

3. **Recommendation Engine:**
   - [ ] Use MongoDB analytics for ML model training
   - [ ] Cache recommendations in MongoDB
   - [ ] Personalized playlists based on behavior

---

## 📋 DETAILED SQL MIGRATION SCRIPT

Here's what you need to add to `MusicPlayerContext.cs`:

```csharp
public DbSet<UserListeningHistory> UserListeningHistories { get; set; }
public DbSet<UserFavorite> UserFavorites { get; set; }
public DbSet<Genre> Genres { get; set; }
public DbSet<UserFollowing> UserFollowings { get; set; }
public DbSet<ArtistAnalytics> ArtistAnalytics { get; set; }

protected override void OnModelCreating(ModelBuilder modelBuilder)
{
	// UserListeningHistory relationships
	modelBuilder.Entity<UserListeningHistory>()
		.HasOne(lh => lh.User)
		.WithMany()
		.HasForeignKey(lh => lh.UserID);

	modelBuilder.Entity<UserListeningHistory>()
		.HasOne(lh => lh.Song)
		.WithMany()
		.HasForeignKey(lh => lh.SongID);

	// Indexes for performance
	modelBuilder.Entity<UserListeningHistory>()
		.HasIndex(lh => new { lh.UserID, lh.PlayedAt })
		.IsDescending(false, true);

	// Similar for others...
}
```

---

## 🔄 DATA SYNC STRATEGY

### Real-time Logging:
```
User Action → SQL Server (transactional)
		  ↓ (async, via message queue)
		 MongoDB (logging/analytics)
```

### Batch Processing (Every Hour):
```
1. Query: Recent listening history (1 hour)
2. Aggregate: Group by user, genre, mood
3. Store: UserBehaviorAnalytics in MongoDB
4. Cache: Recommendations for each user
```

### Example Code:
```csharp
public class MongoSyncService
{
	public async Task SyncListeningHistoryAsync()
	{
		// Get recent entries from SQL
		var lastHour = await _dbContext.UserListeningHistories
			.Where(x => x.PlayedAt > DateTime.UtcNow.AddHours(-1))
			.ToListAsync();

		// Insert to MongoDB (as-is, no aggregation)
		await _mongoDb.ListeningHistory
			.InsertManyAsync(lastHour.ToMongoModels());
	}
}
```

---

## 📊 COMPARISON: SQL vs MongoDB

| Feature | SQL Server | MongoDB |
|---------|-----------|---------|
| **User Data** | ✅ Best | ❌ Not ideal |
| **Song/Playlist** | ✅ Best | ❌ Not ideal |
| **Listening History** | ⚠️ OK (slow on billions) | ✅ Best |
| **Analytics** | ⚠️ Slow queries | ✅ Fast aggregation |
| **Logs** | ⚠️ Bloats table | ✅ Best (capped collections) |
| **Real-time Updates** | ⚠️ Slower | ✅ Faster |
| **Transactions** | ✅ ACID | ❌ Limited |
| **Scaling** | ⚠️ Vertical | ✅ Horizontal |

---

## ✅ FINAL CHECKLIST

### SQL Server (Immediate - This Week):
- [ ] Create UserListeningHistory model
- [ ] Create UserFavorite model
- [ ] Create Genre model
- [ ] Create UserFollowing model
- [ ] Create ArtistAnalytics model
- [ ] Update MusicPlayerContext
- [ ] Create EF Core migration
- [ ] Run Update-Database

### MongoDB (Next Week):
- [ ] Setup MongoDB (Community or Atlas)
- [ ] Create collections
- [ ] Add NuGet packages
- [ ] Create C# models
- [ ] Create repository pattern
- [ ] Create sync service
- [ ] Test data flow

### Features (Following Weeks):
- [ ] Artist browsing API
- [ ] Analytics dashboard
- [ ] Recommendation engine
- [ ] Real-time notifications

---

## 📞 CURRENT STATUS

**Good News:**
✅ You already have ArtistProfile model (artist browsing foundation)  
✅ You have AdminAuditLog (activity tracking foundation)  
✅ Database structure is solid  

**Warning:**
❌ Missing UserListeningHistory (critical for recommendations)  
❌ Missing NoSQL database (for scalability)  
❌ Missing analytics models  

**Recommendation:**
Implement SQL models first (this week), then MongoDB (next week).

---

**Next Step:** Create the 5 missing SQL models + start MongoDB setup

Ready to proceed? 🚀
