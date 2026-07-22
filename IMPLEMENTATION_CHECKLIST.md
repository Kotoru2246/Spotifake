# 📋 SPOTIFAKE - IMPLEMENTATION CHECKLIST

## 🎯 PRIORITY 1: Critical Missing Features (Must Do First)

### Desktop App Enhancements

#### [ ] 1. Equalizer 10-Band Implementation
**Difficulty:** ⭐⭐⭐ Medium  
**Estimated Time:** 4-6 hours  
**Files to Create:**
- `DesktopClient/Services/EqualizerService.cs` (Main equalizer logic)
- `DesktopClient/Views/EqualizerControl.xaml` (UI component)
- `DesktopClient/Views/EqualizerControl.xaml.cs` (Code-behind)
- `DataAccess/Models/EqualizerPreset.cs` (Database entity)

**Acceptance Criteria:**
- [ ] 10 frequency bands (60Hz, 150Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 12kHz, 16kHz)
- [ ] Preset save/load functionality
- [ ] Visual fader UI
- [ ] Real-time audio processing
- [ ] Integration with AudioEngine

**Dependencies:** NAudio, EF Core

---

#### [ ] 2. Focus Mode Implementation
**Difficulty:** ⭐⭐ Easy-Medium  
**Estimated Time:** 2-3 hours  
**Files to Create:**
- `DesktopClient/Services/FocusModeService.cs`
- `DesktopClient/Views/FocusModeWindow.xaml`
- `DesktopClient/Views/FocusModeWindow.xaml.cs`
- Database migration: Add FocusMode field to User table

**Acceptance Criteria:**
- [ ] Distraction-free UI toggle
- [ ] Hides sidebar/recommendations when active
- [ ] Increases font sizes for readability
- [ ] Persistent user preference
- [ ] Can be toggled via menu/button

**Dependencies:** None (XAML/C#)

---

#### [ ] 3. Incognito Mode Implementation
**Difficulty:** ⭐⭐ Easy-Medium  
**Estimated Time:** 3-4 hours  
**Files to Create:**
- `DesktopClient/Services/IncognitoModeService.cs`
- `DesktopClient/Views/IncognitoModeWindow.xaml`
- `DesktopClient/Views/IncognitoModeWindow.xaml.cs`
- Database migration: Add separate tracking/analytics toggle

**Acceptance Criteria:**
- [ ] No history recording when active
- [ ] Separate session ID
- [ ] Visual indicator (different UI theme/color)
- [ ] No search history saved
- [ ] No recommendations affected by plays
- [ ] Can toggle via menu/button

**Dependencies:** Session tracking service

---

### Web Frontend Implementation

#### [ ] 4. ASP.NET Core Controllers
**Difficulty:** ⭐⭐⭐ Medium  
**Estimated Time:** 6-8 hours  
**Files to Create:**
- `WebClientMvc/WebClientMVC/WebClientMVC/Controllers/HomeController.cs`
- `WebClientMvc/WebClientMVC/WebClientMVC/Controllers/MusicController.cs`
- `WebClientMvc/WebClientMVC/WebClientMVC/Controllers/PlaylistController.cs`
- `WebClientMvc/WebClientMVC/WebClientMVC/Controllers/AuthController.cs`

**Acceptance Criteria:**
- [ ] HomeController with Index action
- [ ] MusicController with Browse, Upload, Search actions
- [ ] PlaylistController with CRUD operations
- [ ] AuthController with Login/Register
- [ ] Error handling and logging
- [ ] API integration endpoints

**Dependencies:** ASP.NET Core MVC, EF Core

---

#### [ ] 5. Web Frontend Views (Razor)
**Difficulty:** ⭐⭐⭐ Medium  
**Estimated Time:** 8-10 hours  
**Files to Create:**
- `Views/Shared/_Layout.cshtml` (Master layout)
- `Views/Home/Index.cshtml` (Dashboard)
- `Views/Music/Browse.cshtml` (Music library)
- `Views/Music/Upload.cshtml` (Upload form)
- `Views/Music/Player.cshtml` (Player component)
- `Views/Playlist/List.cshtml` (Playlists)
- `Views/Playlist/Edit.cshtml` (Playlist editor)

**Acceptance Criteria:**
- [ ] Responsive design (mobile-friendly)
- [ ] Music player widget (HTML5 audio)
- [ ] Upload drag-and-drop interface
- [ ] Search functionality
- [ ] Playlist browsing/editing
- [ ] Modern, clean UI (Tailwind/Bootstrap)

**Dependencies:** Bootstrap/Tailwind, HTML5 Audio API

---

#### [ ] 6. CSS/JavaScript Assets
**Difficulty:** ⭐⭐ Easy-Medium  
**Estimated Time:** 4-5 hours  
**Files to Create:**
- `wwwroot/css/site.css` (Custom styles)
- `wwwroot/css/music-player.css` (Player-specific styles)
- `wwwroot/js/player.js` (Player controls)
- `wwwroot/js/upload.js` (Upload handling)
- `wwwroot/js/search.js` (Search functionality)

**Acceptance Criteria:**
- [ ] Responsive layout
- [ ] Dark mode support
- [ ] Smooth animations
- [ ] Accessible components (ARIA labels)
- [ ] Cross-browser compatibility

**Dependencies:** JavaScript, CSS3

---

### Backend API Integration

#### [ ] 7. Backend API Client Service
**Difficulty:** ⭐⭐⭐ Medium  
**Estimated Time:** 5-6 hours  
**Files to Create:**
- `DesktopClient/Services/BackendApiClient.cs` (Main client)
- Database migration: Add ApiConfiguration table

**Methods Required:**
- [ ] GetUploadedSongsAsync()
- [ ] SearchSongsAsync(query)
- [ ] GetRecommendationsAsync(seedId)
- [ ] UploadSongAsync(file, metadata)
- [ ] GetAudioFeaturesAsync(songId)
- [ ] GetPlaylists/CreatePlaylist/DeletePlaylist
- [ ] GetUserHistoryAsync()

**Acceptance Criteria:**
- [ ] HTTP client with retry logic
- [ ] Circuit breaker pattern
- [ ] Proper error handling
- [ ] Timeout configuration
- [ ] Base URL configurable
- [ ] Authentication token support

**Dependencies:** HttpClient, Polly (optional for retry)

---

#### [ ] 8. Web API Endpoints - Music Controller
**Difficulty:** ⭐⭐ Easy-Medium  
**Estimated Time:** 4-5 hours  
**Location:** `WebClientMvc/WebClientMVC/WebClientMVC/Controllers/MusicController.cs`

**Endpoints:**
- [ ] GET `/api/music/songs` - List all songs
- [ ] GET `/api/music/songs/{id}` - Get single song
- [ ] POST `/api/music/upload` - Upload song
- [ ] GET `/api/music/search?q=...` - Search
- [ ] GET `/api/music/recommendations?seedId=...` - Get recommendations
- [ ] GET `/api/music/features/{songId}` - Get audio features

**Acceptance Criteria:**
- [ ] CORS properly configured
- [ ] JSON responses
- [ ] Proper HTTP status codes
- [ ] Input validation
- [ ] Response pagination

**Dependencies:** ASP.NET Core, EF Core

---

## 🎯 PRIORITY 2: Database Enhancements

#### [ ] 9. New Database Tables & Migrations
**Difficulty:** ⭐⭐ Easy  
**Estimated Time:** 2-3 hours  

**New Entities:**
```csharp
// EqualizerPreset.cs
public class EqualizerPreset
{
	public int PresetID { get; set; }
	public int UserID { get; set; }
	public string PresetName { get; set; }
	public double[] Frequencies { get; set; } // 10 values
	public DateTime CreatedAt { get; set; }
}

// PlayHistory.cs
public class PlayHistory
{
	public int HistoryID { get; set; }
	public int UserID { get; set; }
	public int SongID { get; set; }
	public DateTime PlayedAt { get; set; }
	public int DurationPlayed { get; set; }
}

// UserFavorite.cs
public class UserFavorite
{
	public int FavoriteID { get; set; }
	public int UserID { get; set; }
	public int SongID { get; set; }
	public DateTime FavoritedAt { get; set; }
}

// UserPreference.cs
public class UserPreference
{
	public int PreferenceID { get; set; }
	public int UserID { get; set; }
	public bool FocusModeEnabled { get; set; }
	public bool IncognitoModeEnabled { get; set; }
	public bool TrackingDisabled { get; set; }
	public string ThemePreference { get; set; } // "light", "dark"
}
```

**EF Core Migrations:**
- [ ] Add new DbSet properties to MusicPlayerContext
- [ ] Create migration: `Add-Migration AddEqualizerAndModeFeatures`
- [ ] Create migration: `Add-Migration AddPlayHistoryAndFavorites`
- [ ] Create migration: `Add-Migration AddUserPreferences`
- [ ] Update-Database

**Dependencies:** EF Core, SQL Server

---

## 🎯 PRIORITY 3: Testing & Quality

#### [ ] 10. Unit Tests
**Difficulty:** ⭐⭐⭐ Medium  
**Estimated Time:** 6-8 hours  

**Test Project:** `DesktopClient.Tests`

**Test Cases:**
- [ ] EqualizerService - Frequency calculations
- [ ] AudioEngine - Playback controls
- [ ] BackendApiClient - API calls
- [ ] SmartShuffleService - Shuffle algorithm
- [ ] SpotifyServiceClient - Token handling

**Tools:** xUnit or NUnit

---

#### [ ] 11. Integration Tests
**Difficulty:** ⭐⭐⭐ Medium  
**Estimated Time:** 4-6 hours  

**Test Scenarios:**
- [ ] Audio file upload and processing
- [ ] Database CRUD operations
- [ ] API endpoint calls
- [ ] Recommendation algorithm
- [ ] Authentication flow

**Tools:** Postman/REST Client, xUnit

---

## 📊 Summary Table

| Feature | Priority | Files | Hours | Status |
|---------|----------|-------|-------|--------|
| Equalizer 10-Band | 1 | 4 | 4-6 | ⬜ |
| Focus Mode | 1 | 3 | 2-3 | ⬜ |
| Incognito Mode | 1 | 3 | 3-4 | ⬜ |
| Web Controllers | 1 | 4 | 6-8 | ⬜ |
| Web Views | 1 | 7 | 8-10 | ⬜ |
| Web CSS/JS | 1 | 5 | 4-5 | ⬜ |
| API Client | 1 | 2 | 5-6 | ⬜ |
| Web API Endpoints | 1 | 1 | 4-5 | ⬜ |
| Database Tables | 2 | 5 | 2-3 | ⬜ |
| Unit Tests | 3 | 1+ | 6-8 | ⬜ |
| Integration Tests | 3 | 1+ | 4-6 | ⬜ |
| **TOTAL** | - | 36+ | 49-64 | ⬜ |

---

## 🚀 Getting Started

### Step 1: Choose a Component
Pick one from Priority 1 to start implementing.

### Step 2: Create Files
Create the required C# or CSHTML files in the appropriate folders.

### Step 3: Implement Logic
Write the business logic following the acceptance criteria.

### Step 4: Test
Write unit tests or manually test the feature.

### Step 5: Integrate
Connect to other components (database, APIs, UI).

### Step 6: Document
Add comments and update PROJECT_CONTEXT.txt.

---

## 📝 File Template - Service Class

```csharp
using System;

namespace DesktopClient.Services
{
	/// <summary>
	/// [Feature] Service - Handles [Feature] functionality
	/// </summary>
	public class [FeatureName]Service
	{
		private readonly IAudioEngine _audioEngine;

		public [FeatureName]Service(IAudioEngine audioEngine)
		{
			_audioEngine = audioEngine ?? throw new ArgumentNullException(nameof(audioEngine));
		}

		/// <summary>
		/// [Method description]
		/// </summary>
		public async Task<bool> [MethodName]Async()
		{
			try
			{
				// Implementation
				return true;
			}
			catch (Exception ex)
			{
				System.Diagnostics.Debug.WriteLine($"Error in [MethodName]: {ex.Message}");
				return false;
			}
		}
	}
}
```

---

## 📝 File Template - Controller

```csharp
using Microsoft.AspNetCore.Mvc;
using DataAccess;

namespace WebClientMVC.Controllers
{
	public class [FeatureName]Controller : Controller
	{
		private readonly MusicPlayerContext _dbContext;

		public [FeatureName]Controller(MusicPlayerContext dbContext)
		{
			_dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
		}

		public IActionResult Index()
		{
			return View();
		}
	}
}
```

---

## 🔗 Quick Links

- **Project Context:** `PROJECT_CONTEXT.txt`
- **Task Report:** `TASK_REPORT.md`
- **Git Repository:** https://github.com/Kotoru2246/Spotifake
- **Database Context:** `DataAccess/MusicPlayerContext.cs`

---

**Created:** [Current Date]  
**Status:** Ready for Implementation  
**Assigned to:** [Your Name]
