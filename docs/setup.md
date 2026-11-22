# Setup

## Prerequisites

- **Java 21** and **Maven 3.9**. `BackendSpringBoot/run_mvn.cmd` sets `JAVA_HOME`/`M2_HOME` to
  `C:\Users\jacky\.tools\...` when they are not already set.
- **Node.js** for `EssentiaService/` (`npm install` runs from `start-services.bat`).
- **Python 3.12** with a repo-root virtualenv in `.venv/` for `BackendAI/` and spotdl:

  ```powershell
  python -m venv .venv
  .\.venv\Scripts\pip install -r BackendAI\requirements.txt
  ```

  On machines without Python, install it from python.org or the Microsoft Store and tick "Add to PATH".
- **Flutter** for `spotifake_mobile/` (only to build the APK).

## Starting the pieces

| What | Command | URL |
|---|---|---|
| Spring Boot + Essentia | `start-services.bat` | http://localhost:8000, admin on http://localhost:9000 |
| Spring Boot only | `restart_backend.bat` | same |
| BackendAI / downloader web UI | `run_downloader_web.bat` | http://localhost:5000 |
| Essentia only | `cd EssentiaService; npm start` | http://localhost:3000/health |
| Everything in Docker | `docker compose up -d --build` | http://localhost:8085 |

`/admin/**` on port 8000 redirects to the admin port (9000).

## Mobile access over the internet

`start_mobile_stream.bat` opens a Cloudflare quick tunnel to port 8000 and prints a
`https://....trycloudflare.com` URL to enter in the mobile app's server settings. It uses
`%CLOUDFLARED%`, or `C:\Users\jacky\SpotifakeArchive\cloudflared.exe` if that variable is unset.

## Archived binaries

Large files were moved out of the repo into `C:\Users\jacky\SpotifakeArchive\` and are now ignored
(`*.zip`, `*.apk`, `*.exe`): `music.zip`, `uploads.zip`, `Spotifake-Server.zip`,
`spotifake-standalone.zip`, `spotifake.apk`, `cloudflared.exe`, `backendai_full_backup.db`, and
`backendai.pre-migration.db` (the database before the audio-blob migration; see database.md).

Root screenshots now live in `docs/screenshots/`, which is ignored by git.

## Outdated setup guides (removed)

The removed `QUICK_SETUP.md`, `HYBRID_SETUP.md`, `SETUP_PYTHON.md` and `MONGODB_SETUP.md` described an
ASP.NET MVC web client, a WPF desktop client, SQL Server/EF Core and a planned MongoDB store. None of
these are part of the running app: the web UI is Thymeleaf in Spring Boot, the database is SQLite, and
MongoDB is not used. The originals are in git history.
