# Database

Single SQLite file `backendai.db` at the repo root (`APP_DB_PATH`), opened by
`SpotifakeRepository` through HikariCP with WAL mode. The schema is created with
`CREATE TABLE IF NOT EXISTS` on startup. BackendAI reads the same file.

Tables: `Users`, `ArtistProfiles`, `ArtistRequests`, `Albums`, `Songs`, `Playlists`, `PlaylistTracks`,
`UserFavorites`, `Comments`, `StreamLogs`, `Transactions`, `AdminAuditLogs`, `UserActivityLogs`,
`PlatformSettings`, `Advertisements`, `ContentReports`, `PlatformAnnouncements`, `UserNotifications`,
`UserPlayContexts`.

### UserPlayContexts

Per-user counts of playlists/albums/artists played from (feeds `GET /api/me/shortcuts`).

```sql
CREATE TABLE IF NOT EXISTS UserPlayContexts (
  UserID TEXT NOT NULL,
  ContextType TEXT NOT NULL,          -- 'playlist' | 'album' | 'artist'
  ContextID TEXT NOT NULL,            -- canonical id, see below
  PlayCount INTEGER NOT NULL DEFAULT 0,
  FirstPlayedAt TEXT NOT NULL,        -- ISO-8601
  LastPlayedAt INTEGER NOT NULL,      -- epoch milliseconds
  PRIMARY KEY (UserID, ContextType, ContextID)
);
CREATE INDEX IF NOT EXISTS IX_UserPlayContexts_User_Last ON UserPlayContexts(UserID, LastPlayedAt DESC);
```

Canonical `ContextID`: playlist = `PlaylistID`; album = `AlbumID`, or `title:<lowercased trimmed title>` when
only songs carry the album name; artist = `ArtistID`, or `name:<lowercased name>` when there is no profile.
Rows for a playlist are removed when it is deleted.

> If `APP_DB_PATH` points at a missing file, the repository silently falls back to `./backendai.db`
> or `../backendai.db`. The tests create their temp DB first and assert which file is open.

## Audio storage

Audio lives on disk only: `uploads/<id>.<ext>` for uploads, or `uploads/<name>.m4a` for downloader
imports. `Songs.FilePath` points at it. `Songs.FileData` used to hold a second copy of every upload.

**Migration (2026-11-23)** with `BackendAI/migrate_song_blobs_to_disk.py`:

- 181 songs had a blob; all 181 already had their file on disk, so no files were written and `FileData`
  was set to NULL for all of them.
- `backendai.db` went from **776.2 MB to 40.8 MB** after `VACUUM`.
- Backup before migrating: `C:\Users\jacky\SpotifakeArchive\backendai.pre-migration.db`.
- `SongService.getSongAudioFile` still falls back to `FileData` for any row that keeps a blob.
- `CoverArtData` (about 33 MB across 181 rows) was deliberately left in the database.

The script is idempotent. Re-run it with `--dry-run` first:

```powershell
python BackendAI\migrate_song_blobs_to_disk.py --dry-run
python BackendAI\migrate_song_blobs_to_disk.py --vacuum
```

## Outdated database plans (removed)

`DATABASE_AUDIT.md`, `DATABASE_ENHANCEMENTS.md` and `DATABASE_MODELS_TEMPLATES.md` proposed EF Core
models (`UserListeningHistory`, `Genre`, `UserFollowing`, `ArtistAnalytics`) for SQL Server in
`DataAccess/`, plus MongoDB collections. The app does not use SQL Server, EF Core or MongoDB.
Favorites (`UserFavorites`) and listening history (`StreamLogs`) exist in SQLite.
