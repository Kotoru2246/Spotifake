# Spotifake HTTP API (Spring Boot, port 8000)

All JSON endpoints live under `/api/...`. Non-`/api` paths are Thymeleaf page routes
(`/`, `/Auth/*`, `/artist/manager/*`, `/admin/dashboard/*`, `/subscription`), plus
`/admin/dashboard/chart-data`, which only the admin page uses and which is served on the
admin port (9000) alongside it.

## Canonical endpoints

| Area | Method & path |
|---|---|
| Songs | `GET /api/music` · `GET /api/music/stream/{idOrFile}` · `GET /api/music/stream?fileName=...` · `GET /api/music/cover/{songId}` · `GET /api/music/lyrics/{idOrFile}` · `GET /api/music/detail/{songId}` · `POST /api/music/play` · `POST /api/music/upload` · `POST /api/music/report` |
| Albums | `GET /api/albums` · `GET /api/albums/{albumId}` · `GET /api/albums/artist/{artistId}` |
| Artists | `GET /api/artists/{artistId}` · `GET /api/artists?name=...&artistId=...` |
| Playlists | `GET /api/playlists` · `POST /api/playlists` · `GET /api/playlists/{id}` · `DELETE /api/playlists/{id}` · `POST /api/playlists/{id}/songs` · `DELETE /api/playlists/{id}/songs` (body) · `DELETE /api/playlists/{id}/songs/{fileName}` · `POST /api/playlists/toggle-favorite` |
| Search | `GET /api/search?q=...` |
| Recommendations | `POST /api/recommendations/smart-shuffle` · `GET /api/recommendations/knn-projection` · `GET /api/recommendations/hybrid` |
| Auth | `POST /api/auth/login` · `POST /api/auth/register` · `GET /api/auth/me` · `POST /api/auth/logout` |
| Public player data | `GET /api/public/settings` · `GET /api/public/announcements` · `GET /api/public/ads/stream` · `POST /api/public/ads/click/{id}` |
| Subscription | `/api/subscription/*` (checkout, receipt, transactions, cancel, status, stripe/*) |
| Downloader (ADMIN) | `POST /api/downloader/start` · `GET /api/downloader/jobs` · `GET /api/downloader/jobs/{jobId}` |

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
- `PUT /api/playlists/{id}` (rename), `POST /api/playlists/{id}/unsave`, `POST /api/playlists/{id}/visibility`
- `GET ${API_BASE_URL}/songs/{id}/features`, `GET|POST ${API_BASE_URL}/songs/{id}/comments`
- Artist Studio: `GET /api/artists/{id}/albums`, `POST /api/albums`, and the test-mode upload `POST /songs/test_upload`

These are listed in TODO.md.
