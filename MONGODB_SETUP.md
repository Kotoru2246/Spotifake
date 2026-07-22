# 🗄️ MONGODB SETUP GUIDE - Complete Implementation

**Your teacher was RIGHT about NoSQL! Here's how to set it up.**

---

## 📋 PREREQUISITES

Before starting MongoDB, ensure you have:
- ✅ .NET 8.0+ SDK installed
- ✅ Visual Studio with NuGet access
- ✅ MongoDB Community Edition OR MongoDB Atlas (cloud)

---

## 🚀 OPTION 1: MongoDB ATLAS (Recommended - Cloud)

**Easiest setup! No local installation needed.**

### Step 1: Create MongoDB Atlas Account
1. Go to: https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email
4. Verify email

### Step 2: Create Project & Cluster
1. Click "Create Project" → name it "Spotifake"
2. Click "Create a Cluster"
3. Choose "FREE tier" (M0 - enough for development)
4. Select region: **Asia Pacific** (Vietnam)
5. Click "Create"
6. Wait 5-10 minutes for cluster creation

### Step 3: Setup Security
1. Click "Database Access" (left menu)
2. Click "Add New Database User"
3. Create user:
   - Username: `spotifake_user`
   - Password: `[Generate secure password]` (save this!)
   - Built-in Role: `Atlas Admin`
4. Click "Add User"

### Step 4: Setup Network Access
1. Click "Network Access" (left menu)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"

### Step 5: Get Connection String
1. Clusters → Click "Connect" button
2. Select "Drivers" → "C# / .NET"
3. Copy connection string:
   ```
   mongodb+srv://spotifake_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your password
5. Add `/spotifake_analytics` at end:
   ```
   mongodb+srv://spotifake_user:YourPassword@cluster0.xxxxx.mongodb.net/spotifake_analytics?retryWrites=true&w=majority
   ```

### Step 6: Save to appsettings.json
In `WebClientMvc/WebClientMVC/WebClientMVC/appsettings.json`:

```json
{
  "ConnectionStrings": {
	"DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=MusicPlayerDb;Trusted_Connection=true;",
	"MongoDB": "mongodb+srv://spotifake_user:YourPassword@cluster0.xxxxx.mongodb.net/spotifake_analytics?retryWrites=true&w=majority"
  },
  "MongoSettings": {
	"ConnectionString": "mongodb+srv://spotifake_user:YourPassword@cluster0.xxxxx.mongodb.net/spotifake_analytics?retryWrites=true&w=majority",
	"DatabaseName": "spotifake_analytics"
  }
}
```

---

## 🖥️ OPTION 2: MongoDB COMMUNITY (Local Installation)

**Alternative if you prefer local setup**

### Step 1: Download & Install
1. Go to: https://www.mongodb.com/try/download/community
2. Download for your OS (Windows)
3. Run installer (.msi)
4. Choose "Complete Setup"
5. Uncheck "Install MongoDB as a Service" (easier for dev)
6. Finish installation

### Step 2: Add to PATH
MongoDB installs to: `C:\Program Files\MongoDB\Server\7.0\bin`

Add this to Windows PATH:
1. Windows Search → "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables"
4. Under "System variables", select "Path", click "Edit"
5. Click "New"
6. Add: `C:\Program Files\MongoDB\Server\7.0\bin`
7. Click OK × 3

### Step 3: Verify Installation
```powershell
mongod --version
mongo --version
```

Should show version numbers (e.g., "6.0.1")

### Step 4: Run MongoDB Locally
```powershell
# Terminal 1: Start MongoDB server
mongod

# Terminal 2: Connect to MongoDB shell
mongo
```

Create database:
```javascript
use spotifake_analytics
db.createCollection("listeningHistory")
exit
```

### Step 5: Connection String
```
mongodb://localhost:27017/spotifake_analytics
```

Add to appsettings.json:
```json
{
  "MongoSettings": {
	"ConnectionString": "mongodb://localhost:27017",
	"DatabaseName": "spotifake_analytics"
  }
}
```

---

## 💻 .NET SETUP (Both Options)

### Step 1: Add NuGet Packages

In Visual Studio **Package Manager Console**:

```powershell
# Install MongoDB driver
Install-Package MongoDB.Driver -Version 2.23.0

# Install Bson serialization
Install-Package MongoDB.Bson -Version 2.23.0
```

Or edit **DataAccess.csproj**:

```xml
<ItemGroup>
	<PackageReference Include="MongoDB.Driver" Version="2.23.0" />
	<PackageReference Include="MongoDB.Bson" Version="2.23.0" />
</ItemGroup>
```

Then:
```powershell
dotnet restore
```

---

## 📁 CREATE MONGODB MODELS

### Create folder: `DataAccess/Models/MongoDB/`

Create these files:

---

### 1️⃣ `ListeningHistoryMongo.cs`

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace DataAccess.Models.MongoDB
{
	/// <summary>
	/// MongoDB document for listening history (unstructured, scalable)
	/// Synced from SQL Server UserListeningHistory
	/// </summary>
	[BsonIgnoreExtraElements]
	public class ListeningHistoryMongo
	{
		[BsonId]
		public ObjectId Id { get; set; }

		[BsonElement("userId")]
		public Guid UserId { get; set; }

		[BsonElement("songId")]
		public Guid SongId { get; set; }

		[BsonElement("playedAt")]
		public DateTime PlayedAt { get; set; }

		[BsonElement("secondsListened")]
		public int SecondsListened { get; set; }

		[BsonElement("isSkipped")]
		public bool IsSkipped { get; set; }

		[BsonElement("isCompleted")]
		public bool IsCompleted { get; set; }

		[BsonElement("deviceType")]
		public string? DeviceType { get; set; }

		[BsonElement("sessionId")]
		public string? SessionId { get; set; }

		[BsonElement("quality")]
		public string? Quality { get; set; }

		[BsonElement("isOffline")]
		public bool IsOffline { get; set; }

		// Extra fields (MongoDB flexibility!)
		[BsonElement("ipAddress")]
		public string? IpAddress { get; set; }

		[BsonElement("userAgent")]
		public string? UserAgent { get; set; }
	}
}
```

---

### 2️⃣ `ActivityLogMongo.cs`

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace DataAccess.Models.MongoDB
{
	/// <summary>
	/// MongoDB document for activity logging (high-volume writes)
	/// Tracks all user actions: play, skip, follow, search, etc.
	/// </summary>
	public class ActivityLogMongo
	{
		[BsonId]
		public ObjectId Id { get; set; }

		[BsonElement("userId")]
		public Guid UserId { get; set; }

		[BsonElement("action")]
		[BsonRepresentation(BsonType.String)]
		public ActivityAction Action { get; set; }

		[BsonElement("targetType")]
		[BsonRepresentation(BsonType.String)]
		public TargetType TargetType { get; set; }

		[BsonElement("targetId")]
		public string? TargetId { get; set; }

		[BsonElement("timestamp")]
		public DateTime Timestamp { get; set; }

		[BsonElement("metadata")]
		public Dictionary<string, object> Metadata { get; set; } = new();

		[BsonElement("status")]
		public string Status { get; set; } = "success";

		[BsonElement("errorMessage")]
		public string? ErrorMessage { get; set; }

		[BsonElement("duration")]
		public int Duration { get; set; } // milliseconds
	}

	public enum ActivityAction
	{
		SongPlayed,
		SongSkipped,
		SongCompleted,
		PlaylistCreated,
		PlaylistUpdated,
		ArtistFollowed,
		SongFavorited,
		SongSearched,
		UserLoggedIn,
		UserLoggedOut,
		SettingsChanged
	}

	public enum TargetType
	{
		Song,
		Playlist,
		Artist,
		User,
		Genre,
		Settings
	}
}
```

---

### 3️⃣ `UserBehaviorAnalyticsMongo.cs`

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace DataAccess.Models.MongoDB
{
	/// <summary>
	/// MongoDB document for daily user behavior analytics
	/// Aggregated summary of user actions (better performance than querying raw logs)
	/// </summary>
	public class UserBehaviorAnalyticsMongo
	{
		[BsonId]
		public ObjectId Id { get; set; }

		[BsonElement("userId")]
		public Guid UserId { get; set; }

		[BsonElement("date")]
		public DateTime Date { get; set; }

		// Listening Stats
		[BsonElement("listeningStats")]
		public ListeningStats ListeningStats { get; set; } = new();

		// Engagement Stats
		[BsonElement("engagementStats")]
		public EngagementStats EngagementStats { get; set; } = new();

		// Preference Analysis
		[BsonElement("genrePreferences")]
		public Dictionary<string, double> GenrePreferences { get; set; } = new();

		[BsonElement("moodTrends")]
		public Dictionary<string, double> MoodTrends { get; set; } = new();

		[BsonElement("artistPreferences")]
		public Dictionary<string, double> ArtistPreferences { get; set; } = new();

		// Peak Usage
		[BsonElement("peakListeningHour")]
		public int PeakListeningHour { get; set; }

		[BsonElement("listeningStreak")]
		public int ListeningStreak { get; set; }
	}

	public class ListeningStats
	{
		[BsonElement("sessions")]
		public int Sessions { get; set; }

		[BsonElement("totalMinutes")]
		public int TotalMinutes { get; set; }

		[BsonElement("uniqueSongs")]
		public int UniqueSongs { get; set; }

		[BsonElement("skipRate")]
		public double SkipRate { get; set; }

		[BsonElement("completionRate")]
		public double CompletionRate { get; set; }
	}

	public class EngagementStats
	{
		[BsonElement("newFavorites")]
		public int NewFavorites { get; set; }

		[BsonElement("newFollows")]
		public int NewFollows { get; set; }

		[BsonElement("playlistsCreated")]
		public int PlaylistsCreated { get; set; }

		[BsonElement("searchCount")]
		public int SearchCount { get; set; }
	}
}
```

---

### 4️⃣ `RecommendationCacheMongo.cs`

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace DataAccess.Models.MongoDB
{
	/// <summary>
	/// MongoDB document for caching recommendations
	/// TTL index auto-deletes after expiry (improves performance)
	/// </summary>
	public class RecommendationCacheMongo
	{
		[BsonId]
		public ObjectId Id { get; set; }

		[BsonElement("userId")]
		public Guid UserId { get; set; }

		[BsonElement("type")]
		public string Type { get; set; } = string.Empty; // "history", "favorites", "trending"

		[BsonElement("recommendations")]
		public List<RecommendedSong> Recommendations { get; set; } = new();

		[BsonElement("generatedAt")]
		public DateTime GeneratedAt { get; set; }

		[BsonElement("expiresAt")]
		public DateTime ExpiresAt { get; set; }

		[BsonElement("engagement")]
		public RecommendationEngagement Engagement { get; set; } = new();
	}

	public class RecommendedSong
	{
		[BsonElement("songId")]
		public Guid SongId { get; set; }

		[BsonElement("score")]
		public double Score { get; set; }

		[BsonElement("reason")]
		public string Reason { get; set; } = string.Empty;

		[BsonElement("genreMatch")]
		public double GenreMatch { get; set; }

		[BsonElement("moodMatch")]
		public double MoodMatch { get; set; }
	}

	public class RecommendationEngagement
	{
		[BsonElement("clickedOn")]
		public List<Guid> ClickedOn { get; set; } = new();

		[BsonElement("engagementScore")]
		public double EngagementScore { get; set; }

		[BsonElement("impressions")]
		public int Impressions { get; set; }
	}
}
```

---

### 5️⃣ `SearchQueryMongo.cs`

```csharp
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace DataAccess.Models.MongoDB
{
	/// <summary>
	/// MongoDB document for search analytics
	/// Understand what users search for (product insights)
	/// </summary>
	public class SearchQueryMongo
	{
		[BsonId]
		public ObjectId Id { get; set; }

		[BsonElement("userId")]
		public Guid UserId { get; set; }

		[BsonElement("query")]
		public string Query { get; set; } = string.Empty;

		[BsonElement("searchedAt")]
		public DateTime SearchedAt { get; set; }

		[BsonElement("resultsCount")]
		public SearchResults ResultsCount { get; set; } = new();

		[BsonElement("clickedResults")]
		public ClickedResults ClickedResults { get; set; } = new();

		[BsonElement("timeSpentSearching")]
		public int TimeSpentSearching { get; set; } // seconds

		[BsonElement("deviceType")]
		public string? DeviceType { get; set; }
	}

	public class SearchResults
	{
		[BsonElement("songs")]
		public int Songs { get; set; }

		[BsonElement("artists")]
		public int Artists { get; set; }

		[BsonElement("playlists")]
		public int Playlists { get; set; }
	}

	public class ClickedResults
	{
		[BsonElement("songIds")]
		public List<Guid> SongIds { get; set; } = new();

		[BsonElement("artistIds")]
		public List<Guid> ArtistIds { get; set; } = new();

		[BsonElement("playlistIds")]
		public List<Guid> PlaylistIds { get; set; } = new();
	}
}
```

---

## 🔧 CREATE MONGODB REPOSITORY

### File: `DataAccess/Services/MongoAnalyticsRepository.cs`

```csharp
using MongoDB.Driver;
using DataAccess.Models.MongoDB;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DataAccess.Services
{
	/// <summary>
	/// MongoDB operations for analytics and logging
	/// Handles all NoSQL database interactions
	/// </summary>
	public class MongoAnalyticsRepository
	{
		private readonly IMongoDatabase _mongoDb;

		// Collections
		private readonly IMongoCollection<ListeningHistoryMongo> _listeningHistory;
		private readonly IMongoCollection<ActivityLogMongo> _activityLogs;
		private readonly IMongoCollection<UserBehaviorAnalyticsMongo> _behaviorAnalytics;
		private readonly IMongoCollection<RecommendationCacheMongo> _recommendationCache;
		private readonly IMongoCollection<SearchQueryMongo> _searchQueries;

		public MongoAnalyticsRepository(IMongoClient mongoClient, string databaseName = "spotifake_analytics")
		{
			_mongoDb = mongoClient.GetDatabase(databaseName);

			// Get or create collections
			_listeningHistory = _mongoDb.GetCollection<ListeningHistoryMongo>("listeningHistory");
			_activityLogs = _mongoDb.GetCollection<ActivityLogMongo>("activityLogs");
			_behaviorAnalytics = _mongoDb.GetCollection<UserBehaviorAnalyticsMongo>("behaviorAnalytics");
			_recommendationCache = _mongoDb.GetCollection<RecommendationCacheMongo>("recommendationCache");
			_searchQueries = _mongoDb.GetCollection<SearchQueryMongo>("searchQueries");

			// Create indexes
			CreateIndexes();
		}

		/// <summary>
		/// Creates indexes for better query performance
		/// </summary>
		private void CreateIndexes()
		{
			try
			{
				// ListeningHistory indexes
				var listeningHistoryIndexModel = new CreateIndexModel<ListeningHistoryMongo>(
					Builders<ListeningHistoryMongo>.IndexKeys
						.Ascending(x => x.UserId)
						.Descending(x => x.PlayedAt)
				);
				_listeningHistory.Indexes.CreateOne(listeningHistoryIndexModel);

				// ActivityLogs indexes
				var activityLogIndexModel = new CreateIndexModel<ActivityLogMongo>(
					Builders<ActivityLogMongo>.IndexKeys
						.Ascending(x => x.UserId)
						.Descending(x => x.Timestamp)
				);
				_activityLogs.Indexes.CreateOne(activityLogIndexModel);

				// RecommendationCache TTL index (auto-delete after expiresAt)
				var ttlIndexModel = new CreateIndexModel<RecommendationCacheMongo>(
					Builders<RecommendationCacheMongo>.IndexKeys.Ascending(x => x.ExpiresAt),
					new CreateIndexOptions { ExpireAfter = TimeSpan.Zero }
				);
				_recommendationCache.Indexes.CreateOne(ttlIndexModel);
			}
			catch (Exception ex)
			{
				System.Diagnostics.Debug.WriteLine($"Error creating indexes: {ex.Message}");
			}
		}

		// ===== Listening History Methods =====
		public async Task InsertListeningHistoryAsync(ListeningHistoryMongo history)
		{
			await _listeningHistory.InsertOneAsync(history);
		}

		public async Task<List<ListeningHistoryMongo>> GetUserListeningHistoryAsync(
			Guid userId, int limit = 50)
		{
			return await _listeningHistory
				.Find(x => x.UserId == userId)
				.SortByDescending(x => x.PlayedAt)
				.Limit(limit)
				.ToListAsync();
		}

		// ===== Activity Log Methods =====
		public async Task LogActivityAsync(ActivityLogMongo activity)
		{
			await _activityLogs.InsertOneAsync(activity);
		}

		public async Task<List<ActivityLogMongo>> GetUserActivityAsync(
			Guid userId, DateTime fromDate)
		{
			return await _activityLogs
				.Find(x => x.UserId == userId && x.Timestamp >= fromDate)
				.SortByDescending(x => x.Timestamp)
				.ToListAsync();
		}

		// ===== Behavior Analytics Methods =====
		public async Task InsertBehaviorAnalyticsAsync(UserBehaviorAnalyticsMongo analytics)
		{
			await _behaviorAnalytics.InsertOneAsync(analytics);
		}

		public async Task<UserBehaviorAnalyticsMongo?> GetUserAnalyticsAsync(
			Guid userId, DateTime date)
		{
			return await _behaviorAnalytics
				.Find(x => x.UserId == userId && x.Date == date.Date)
				.FirstOrDefaultAsync();
		}

		// ===== Recommendation Cache Methods =====
		public async Task CacheRecommendationsAsync(RecommendationCacheMongo cache)
		{
			var filter = Builders<RecommendationCacheMongo>.Filter
				.And(
					Builders<RecommendationCacheMongo>.Filter.Eq(x => x.UserId, cache.UserId),
					Builders<RecommendationCacheMongo>.Filter.Eq(x => x.Type, cache.Type)
				);

			await _recommendationCache.ReplaceOneAsync(filter, cache, new ReplaceOptions { IsUpsert = true });
		}

		public async Task<RecommendationCacheMongo?> GetCachedRecommendationsAsync(
			Guid userId, string type)
		{
			return await _recommendationCache
				.Find(x => x.UserId == userId && x.Type == type && x.ExpiresAt > DateTime.UtcNow)
				.FirstOrDefaultAsync();
		}

		// ===== Search Query Methods =====
		public async Task LogSearchQueryAsync(SearchQueryMongo searchQuery)
		{
			await _searchQueries.InsertOneAsync(searchQuery);
		}

		public async Task<List<SearchQueryMongo>> GetTrendingSearchesAsync(int limit = 10)
		{
			return await _searchQueries
				.Find(Builders<SearchQueryMongo>.Filter.Empty)
				.SortByDescending(x => x.SearchedAt)
				.Limit(limit)
				.ToListAsync();
		}
	}
}
```

---

## ⚙️ REGISTER IN DEPENDENCY INJECTION

Update `Program.cs` in your web app:

```csharp
// Add this in Program.cs

// MongoDB
var mongoConnectionString = builder.Configuration.GetConnectionString("MongoDB") 
	?? "mongodb://localhost:27017";
builder.Services.AddSingleton<IMongoClient>(
	new MongoClient(mongoConnectionString)
);
builder.Services.AddScoped<MongoAnalyticsRepository>();

var app = builder.Build();
// ... rest of configuration
```

---

## 🧪 TEST MONGODB CONNECTION

Create a test endpoint in controller:

```csharp
[HttpGet("test-mongo")]
public async Task<IActionResult> TestMongoConnection()
{
	try
	{
		var listeningEntry = new ListeningHistoryMongo
		{
			UserId = Guid.NewGuid(),
			SongId = Guid.NewGuid(),
			PlayedAt = DateTime.UtcNow,
			SecondsListened = 180,
			IsSkipped = false,
			IsCompleted = true
		};

		await _mongoRepository.InsertListeningHistoryAsync(listeningEntry);

		return Ok(new { message = "MongoDB connected successfully!", data = listeningEntry });
	}
	catch (Exception ex)
	{
		return BadRequest(new { error = ex.Message });
	}
}
```

Visit: `http://localhost:5000/api/test-mongo`

---

## ✅ CHECKLIST

- [ ] Create MongoDB Atlas account OR install locally
- [ ] Add connection string to appsettings.json
- [ ] Install MongoDB.Driver NuGet packages
- [ ] Create 5 MongoDB model files
- [ ] Create MongoAnalyticsRepository class
- [ ] Register in dependency injection (Program.cs)
- [ ] Test MongoDB connection
- [ ] Create sync service (SQL → MongoDB)

---

**Next: Sync service to transfer data from SQL Server to MongoDB!**
