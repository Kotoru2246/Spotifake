# 2 test

A Spotify-style music streaming app: web player, artist studio, admin dashboard, Stripe test-mode
subscriptions, synced lyrics, smart shuffle and an album downloader.

| Part | Folder | Tech | Port |
|---|---|---|---|
| Backend + web UI (active app) | `BackendSpringBoot/` | Spring Boot 3.3, Java 21, Thymeleaf, SQLite (`backendai.db`) | 8000 (player), 9000 (admin dashboard) |
| Audio analysis | `EssentiaService/` | Node.js + Essentia.js | 3000 |
| AI / downloader web service | `BackendAI/` | Python, FastAPI, ChromaDB, spotdl | 5000 |
| Mobile app | `spotifake_mobile/` | Flutter | talks to port 8000 |

Legacy folders (`WebClient/`, `WebClientMvc/`, `DesktopClient/`, `DataAccess/`, `spotify-downloader/`)
are kept for reference and are not part of the running app.

## Run it

**Windows, local:**

```powershell
.\start-services.bat
```

starts EssentiaService (3000) and the Spring Boot backend (8000/9000). Open <http://localhost:8000>.
After changing Java, templates or static JS/CSS, rebuild and restart:

```powershell
cd BackendSpringBoot; .\run_mvn.cmd package -DskipTests; cd ..; .\restart_backend.bat
```

The Python service is started separately with `run_downloader_web.bat` (port 5000).

**Docker:**

```powershell
docker compose up -d --build
```

maps the backend to 8085 (player) / 9005 (admin), Essentia to 3000 and BackendAI to 5000, mounting
`backendai.db`, `uploads/` and `music/` from the repo root.

**Tests:**

```powershell
cd BackendSpringBoot; .\run_mvn.cmd test
```

Tests use a temporary SQLite file, never `backendai.db`.

## Configuration

| Variable / property | Default | Used by |
|---|---|---|
| `APP_DB_PATH` (`app.db.path`) | `../backendai.db` | Spring Boot repository |
| `app.jwt.secret` | dev value in `application.properties` | JWT signing; **override in any shared deployment** |
| `STRIPE_API_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET` | test placeholders | subscription checkout |
| `DOWNLOADER_PROJECT_ROOT`, `DOWNLOADER_PYTHON` | `..`, `.venv` python | `/api/downloader` (spotdl) |
| `ESSENTIA_URL`, `AI_SERVICE_URL` | set in `docker-compose.yml` | not read by the Spring backend yet (see TODO.md) |
| `JWT_SECRET`, `PORT` | dev values | `BackendAI` |
| `CLOUDFLARED` | `C:\Users\jacky\SpotifakeArchive\cloudflared.exe` | `start_mobile_stream.bat` |

Demo accounts (seeded on first start): `user_test`, `artist_test`, `admin_test`. The passwords are
in `SpotifakeRepository.seedDefaultUsers`.

## Docs

- [docs/setup.md](docs/setup.md): prerequisites, Python/Node setup, mobile tunnel, archived binaries
- [docs/architecture.md](docs/architecture.md): services, web player JS modules, recommendation pipeline
- [docs/database.md](docs/database.md): SQLite schema and the audio-blob migration
- [docs/API.md](docs/API.md): HTTP endpoints, old → new paths, legacy aliases
- [TODO.md](TODO.md): remaining work
