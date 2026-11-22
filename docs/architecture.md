# Architecture

```
 Browser (web player, artist studio, admin) ─┐
 Flutter app (spotifake_mobile) ─────────────┤ HTTP :8000 / admin :9000
                                             ▼
                         BackendSpringBoot (Spring Boot + Thymeleaf)
                           │  SQLite ../backendai.db   uploads/ (audio, covers)
                           │  spotdl + BackendAI/spotifake_importer.py (downloader jobs)
                           ▼
          BackendAI (FastAPI :5000)        EssentiaService (Node :3000)
          downloader web UI, ML genre       /classify, /batch-classify
          models, ChromaDB                  audio feature extraction
```

## BackendSpringBoot

- `controller/`: one `/api/...` prefix per JSON controller (see [API.md](API.md)); page controllers
  serve Thymeleaf views (`Home/`, `Auth/`, `Artist/`, `AdminDashboard/`, `Subscription/`).
- `config/SecurityConfig`: stateless JWT (`Authorization: Bearer` or cookie). `/admin/**`,
  `/api/admin/**` and `/api/downloader/**` need ADMIN; `/artist/**` needs ARTIST or ADMIN.
  Everything else is currently `permitAll` (see TODO.md).
- `config/AdminPortFilter` + `AdminPortConfig`: an extra Tomcat connector on 9000 for the admin dashboard.
- `repository/SpotifakeRepository`: all SQL (about 2,400 lines; splitting it is on TODO.md). It creates
  the schema and seeds demo users/settings on startup.
- `service/SongService`: uploads (audio on disk only), audio file lookup, cover art.
- `service/DownloaderService`: spotdl jobs (validated query, `[options] download -- <query>`, 24 h /
  100-job retention, watchdog timeout, exit codes recorded).
- `service/RecommendationService`: smart shuffle, k-NN projection and hybrid recommendations computed
  in Java from the stored audio features.

## Web player JavaScript

`templates/Home/Index.html` loads `static/js/main.js` as an ES module. The code was split out of the old
single `site.js` without changing behavior:

| Module | Contents |
|---|---|
| `api.js` | `API_BASE_URL`, token keys, `saveAuthSession`, `authenticatedFetch` |
| `state.js` | shared mutable state (`state.tracks`, `state.currentTrackIndex`, `state.authToken`, ...) |
| `dom.js` | cached element lookups |
| `utils.js` | `showToast`, `escapeHtml`, `formatTime`, `normalizeBackendSong`, modal helper |
| `platform.js` | platform settings, announcements |
| `history.js` | `SpotifakeHistory` playback history tracker |
| `auth.js` | login/signup panel, auth chrome, session bootstrap |
| `player.js` | `loadTrack`, transport, seek/volume, audio events, ad breaks, free-tier skip limit |
| `queue.js` | queue order/render, shuffle and smart shuffle, right panel |
| `lyrics.js` | LRC parsing, rendering, sync |
| `library.js` | library refresh, uploads/import, `showSection` |
| `playlists.js` | playlist CRUD, sidebar, playlist/album detail views, add-song search |
| `home.js` | home grid, made-for-you mixes, carousels, browse |
| `search.js` | debounced search, filters, result actions |
| `songDetail.js` | song detail view, waveform, comments, likes |
| `artist.js` | track context menu, artist page |
| `admin.js` | in-player admin section |
| `checkout.js` | premium checkout, card form, receipts, song reports |
| `windowBindings.js` | **the only place that assigns `window.<fn>`** for inline `on*="..."` handlers |

`main.js` imports `windowBindings.js`, then calls each module's `initXxxN()` functions in the order
the statements appeared in the old file. Other templates (admin, artist studio, subscription) use their
own inline scripts.

## Audio features and recommendations

Each song stores tempo, energy, danceability, valence, acousticness, instrumentalness, key, mode,
genre and mood. Features come from Essentia (or BackendAI's librosa extractors). Genre and mood
started out as rule-based labels derived from these features; BackendAI also contains trained
genre classifiers. Smart shuffle and hybrid recommendations rank candidates by feature similarity to
the seed tracks.

## Outdated architecture notes (removed)

`PROJECT_CONTEXT.txt`, `STATUS.md`, `FINAL_SUMMARY.md` and `IMPLEMENTATION_CHECKLIST.md` described a
FastAPI-first backend with no authentication or streaming, a WPF desktop client at 40 %, a
"web frontend NOT STARTED", and SQL Server + MongoDB. All of that is superseded: the web UI, JWT auth,
range streaming and SQLite storage now live in BackendSpringBoot.
