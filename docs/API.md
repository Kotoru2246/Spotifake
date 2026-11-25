# Spotifake HTTP API (Spring Boot, port 8000)

All JSON endpoints live under `/api/...`. Non-`/api` paths are Thymeleaf page routes
(`/`, `/Auth/*`, `/artist/manager/*`, `/admin/dashboard/*`, `/subscription`), plus
`/admin/dashboard/chart-data`, which only the admin page uses and which is served on the
admin port (9000) alongside it.

## Canonical endpoints

| Area | Method & path |
|---|---|
| Songs | `GET /api/music` · `GET /api/music/stream/{idOrFile}` · `GET /api/music/stream?fileName=...` · `GET /api/music/cover/{songId}` · `GET /api/music/lyrics/{idOrFile}` · `GET /api/music/detail/{songId}` · `POST /api/music/play` · `POST /api/music/upload` · `POST /api/music/report` |
| Song comments | `GET /api/music/comments/{songId}` (array of `{id, userId, songId, timestampMs, content, createdAt}` in timeline order; `[]` for an unknown song) · `POST /api/music/comments/{songId}` with `{timestampMs, content}` (sign-in required: 401; `content` 1..500 characters after trimming: 400; unknown song: 404). `content` is stored as typed, so render it as text, never as HTML |
| Albums | `GET /api/albums` · `GET /api/albums/{albumId}` · `GET /api/albums/artist/{artistId}` |
| Artists | `GET /api/artists/{artistId}` · `GET /api/artists?name=...&artistId=...` |
| Playlists | `GET /api/playlists` · `POST /api/playlists` · `GET /api/playlists/{id}` · `DELETE /api/playlists/{id}` · `POST /api/playlists/{id}/songs` · `DELETE /api/playlists/{id}/songs` (body) · `DELETE /api/playlists/{id}/songs/{fileName}` · `POST /api/playlists/toggle-favorite` |
| Me | `GET /api/me/shortcuts?limit=8` |
| Search | `GET /api/search?q=...` |
| Recommendations | `POST /api/recommendations/smart-shuffle` · `GET /api/recommendations/knn-projection` · `GET /api/recommendations/hybrid` (smart-shuffle: 400 `{error}` when `seed_track_ids` is missing/empty or none are known, `n_recommendations` clamped 1..50; hybrid: 404 `{error}` for an unknown seed; knn-projection returns empty `points` with fewer than 5 analyzed songs) |
| Auth | `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me` · `POST /api/auth/logout` |
| Public player data | `GET /api/public/settings` · `GET /api/public/announcements` · `GET /api/public/ads/stream` · `POST /api/public/ads/click/{id}` |
| Subscription | `/api/subscription/*` (checkout, receipt, transactions, cancel, status, stripe/*) |
| Downloader (ADMIN) | `POST /api/downloader/start` · `GET /api/downloader/jobs` · `GET /api/downloader/jobs/{jobId}` |
| Audio analysis (ADMIN) | `GET /api/admin/analysis/status` (`{unanalyzed}`) · `POST /api/admin/analysis/backfill?limit=5&after=` (synchronous; `limit` clamped to 1..5, default 5; analyzes songs whose features are all 0; 503 if BackendAI is down) |

### Playlist details and cover art

- `POST /api/playlists` accepts JSON `{name, imageUrl, songFileNames}` (mobile) or `multipart/form-data`
  with `name` and an optional `cover` image file. Both return the caller's playlist list.
- `PUT /api/playlists/{id}` with JSON `{name, imageUrl}` renames and/or changes the image URL
  (`imageUrl` omitted = unchanged; any URL other than the playlist's own cover clears stored cover bytes). Owner only; returns the playlist.
- `GET /api/playlists/{id}/cover` returns the stored cover bytes (404 if none; cached 1 day).
- `POST /api/playlists/{id}/cover` (multipart, field `cover`) stores a cover and returns the playlist.
- `DELETE /api/playlists/{id}/cover` removes the cover and returns the playlist.
- `PUT /{id}`, `POST /{id}/cover` and `DELETE /{id}/cover` require sign-in (401 `{"error":"Sign in required"}` otherwise; 403 for non-owners).
- Covers must be JPEG/PNG/GIF/WebP (content type `image/*` and magic bytes checked), max 5 MB, else 400.
  Non-owners get 403, unknown playlist ids 404.

### Home shortcuts

- `POST /api/music/play` also accepts optional `contextType` (`playlist`, `album` or `artist`) and `contextId`
  next to `songId`/`fileName` (old bodies are unchanged). For signed-in users the context is recorded in
  `UserPlayContexts`; invalid, unknown, deleted or not-visible contexts are silently ignored and the response is
  always `{"success":true}`. Never recorded: songs, `liked-songs-*`, `mix-*`, `this-is-*`, `radio-*`,
  blank or over 200 characters, and another user's private playlists.
- The web player only reports a play after 5 seconds of actual listening (client-side rule).
- When a song plays with no context (Search, Library, ...), the web player falls back to the song's album
  (`albumId`, else album title); not applied to Liked Songs, generated mixes/top-hits queues or Smart Shuffle additions.
- Canonical ids: playlist = PlaylistID; album = AlbumID, or `title:<lowercased title>` for albums without
  an Albums row (`alb-`/`album-` prefixes are stripped; "single"/"unknown album" ignored); artist = ArtistID,
  or `name:<lowercased name>` when there is no profile (`artist-` prefix stripped).
- `GET /api/me/shortcuts?limit=8` (limit default 8, clamped 1..20) returns an array of
  `{type, id, openId, title, subtitle, coverUrl, coverMosaic, playlistId, albumId, artistId, playCount, lastPlayedAt}`
  ranked by recency, with a small log-scaled play-count bonus (5 min × ln(1 + plays)) that only breaks ties between plays a few minutes apart, so the most recent play comes first. `coverMosaic` is up to 4 song cover URLs for playlists, `[]` otherwise.
  Guests get `[]`. A signed-in user with no history gets their own playlists (excluding Liked Songs) with
  `playCount` 0 and `lastPlayedAt` null. Visibility is re-checked on every read.

The `?fileName=` form of `/api/music/stream` stays because file names such as
`uploads/Song - Artist.m4a` contain `/`, which Tomcat rejects when it is URL-encoded in a path.

## Old path → new path

| Old path | New path | Notes |
|---|---|---|
| `/music/**`, `/songs/**`, `/api/songs/**` | `/api/music/**` | prefix aliases removed |
| `/api/music/list`, `/api/music/library`, `/songs` | `/api/music` | |
| `/songs/{id}/stream`, `/api/music/{id}/stream` | `/api/music/stream/{id}` | |
| `/songs/{id}/cover`, `/api/songs/{id}/cover` | `/api/music/cover/{id}` | also the `coverUrl` returned by smart-shuffle |
| `/api/songs/{id}/audio` (admin templates; never existed) | `/api/music/stream/{id}` | fixes the admin song preview players |
| `/music/listen`, `/api/music/listen`, `.../api/play`, `.../api/listen` | `/api/music/play` | |
| `/songs/upload`, `/music/upload` | `/api/music/upload` | also the Artist Studio upload form |
| `/api/music/{id}/lyrics` | `/api/music/lyrics/{id}` | |
| `/api/music/{id}/report` | `/api/music/report` (songId in body) | |
| `/album/**`, `/albums/**` | `/api/albums/**` | |
| `/api/albums/list` | `/api/albums` | |
| `/album/details/{id}`, `/api/albums/details/{id}` | `/api/albums/{id}` | |
| `/playlists/**` | `/api/playlists/**` | |
| `/playlists/my` (POST) | `/api/playlists` (POST) | |
| `/playlists/details/{id}` | `/api/playlists/{id}` | |
| `/playlists/my/{id}`, `/playlists/my/{id}/songs[/{file}]` | `/api/playlists/{id}`, `/api/playlists/{id}/songs[/{file}]` | |
| `/playlists/my/liked/toggle` | `/api/playlists/toggle-favorite` | |
| `/api/smart-shuffle`, `/api/knn-projection`, `/api/hybrid`, `/api/recommendations/recommendations/*` | `/api/recommendations/*` | |
| `/search/global` | `/api/search` | |
| `/auth/login`, `/auth/register` (JSON POST) | `/api/auth/login`, `/api/auth/register` | the HTML form POSTs on `/Auth/Login` and `/Auth/Register` are unchanged |
| `/auth/logout` (POST from site.js; route was GET-only) | `/api/auth/logout` | |
| `/artist/details/{id}`, `/artist/api/details[/{id}]` | `/api/artists[/{id}]` | |
| `/admin/dashboard/api/public/*` | `/api/public/*` | |
| `/downloader/**` | `/api/downloader/**` | |
| `/api/downloader/download` | `/api/downloader/start` | |
| `/api/downloader/list` | `/api/downloader/jobs` | |

## Legacy aliases kept for spotifake_mobile

The installed Flutter app calls these, so they stay until a new APK is out:

| Legacy path | Canonical path | Mobile caller |
|---|---|---|
| `GET /api/playlists/my` | `GET /api/playlists` | `ApiService` playlist list |
| `POST /api/downloader/download` | `POST /api/downloader/start` | `ApiService` album download |
| `GET /artist/details?name=...` | `GET /api/artists?name=...` | `ApiService` artist page |

## Calls with no backend route (pre-existing 404s, not changed)

site.js and the artist Studio page call these, but no Spring route exists (several are left over
from the old FastAPI backend in `BackendAI/main.py`):

- `POST /music/record-play`, `POST /music/import`, `GET /music/download/{file}`
- `POST /music/albums/save/{id}`, `POST /music/albums/unsave/{id}`, `POST /playlists/save/{id}`
- `POST /api/playlists/{id}/unsave`, `POST /api/playlists/{id}/visibility`
- `GET ${API_BASE_URL}/songs/{id}/features`
- Artist Studio: `GET /api/artists/{id}/albums`, `POST /api/albums`, and the test-mode upload `POST /songs/test_upload`

These are listed in TODO.md.

## BackendAI (FastAPI, port 5000)

### `POST /internal/analyze`

Internal analysis for the Spring backend; does not use the user JWT and writes nothing to the DB.

- Request: `multipart/form-data`, field `file` (audio).
- Auth: if env `INTERNAL_API_TOKEN` is set and non-empty, header `X-Internal-Token` must equal it (else 401). If unset, only loopback clients (127.0.0.1, ::1, localhost) are accepted (else 403).
- 200: `{"features": {"tempo","energy","danceability","valence","acousticness","instrumentalness": float, "key": int|null, "mode": int|null}, "genre": str|null, "mood": str|null, "model": "cnn"|"v4"|"none"}`. `genre` is null when no classifier produced one.
- 400 `{"error"}` missing/empty file; 500 `{"error"}` extraction failed.
