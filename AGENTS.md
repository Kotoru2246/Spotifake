# Spotifake Agent Rules & Project Map

## Search, Read & Edit Rules (Speed First)
- **Never** use `Bash(python -c ...)` (or inline shell scripts) to search, open, slice, or edit source files.
- Use built-in **Grep** to locate symbol/line numbers, then built-in **Read** with generous line ranges (`StartLine`/`EndLine`, ~100-150 lines) to read complete functions in one call instead of small character slices.
- Use built-in **Edit** for code modifications; reserve shell commands for builds, tests, and running services.
- When searching across the workspace, ignore generated/vendor/media directories: `.venv/`, `graphify-out/`, `BackendSpringBoot/target/`, `BackendSpringBoot/src/main/resources/static/lib/`, `EssentiaService/node_modules/`, `music/`, and `uploads/`.
- Use built-in **Grep** (or `rg -n` when searching from shell; fall back to `Select-String` only if `rg` is not on `PATH`).

## Project Map
- **Active Web App (`BackendSpringBoot/`, port `8000`)**
  - Java source: `BackendSpringBoot/src/main/java/com/spotifake/` (`controller/`, `service/`, `repository/SpotifakeRepository.java`, `model/`, `dto/`, `config/`)
  - Config: `BackendSpringBoot/src/main/resources/application.properties` (SQLite DB at `../backendai.db`)
  - Thymeleaf views: `BackendSpringBoot/src/main/resources/templates/` (`Home/`, `Auth/`, `Artist/`, `AdminDashboard/`, `Shared/`)
  - JSON endpoints all live under `/api/...` (one prefix per controller); non-`/api` paths are Thymeleaf pages. Route table and legacy mobile aliases: `docs/API.md`.
  - Web player JS: `static/js/main.js` (ES module entry) + `static/js/modules/*.js` (`api`, `state`, `dom`, `utils`, `platform`, `history`, `auth`, `player`, `queue`, `lyrics`, `library`, `playlists`, `home`, `search`, `songDetail`, `artist`, `admin`, `checkout`). `Grep` for the symbol across `static/js/modules/` first.
    - Shared mutable state is `state.<name>` from `state.js`; never reassign an imported binding.
    - Functions used by inline `on*="..."` handlers must be exported and assigned in `modules/windowBindings.js` (the only place that writes `window.<fn>`).
  - CSS: `static/css/site.css`, `static/css/dashboard.css`
  - Tests: `BackendSpringBoot/src/test/java/com/spotifake/` (`IntegrationTestBase` uses a temp SQLite DB; never point tests at `backendai.db`).
- **Audio Analysis Service (`EssentiaService/`, port `3000`)**: Node.js service.
- **Python AI Service (`BackendAI/`, port `5000`)**: FastAPI + ChromaDB, downloader web UI, genre models.
- **Mobile app (`spotifake_mobile/`)**: Flutter; API calls in `lib/services/api_service.dart`.
- **Docs (`docs/`)**: `setup.md`, `architecture.md`, `database.md`, `API.md`; remaining work in `TODO.md`. Screenshots go in `docs/screenshots/` (git-ignored).
- **Legacy / Secondary Folders (do not modify unless explicitly requested)**: `WebClient/`, `WebClientMvc/`, `DesktopClient/`, `DataAccess/`, `spotify-downloader/`.

## Build & Run Commands
- **Maven (`run_mvn.cmd` sets `JAVA_HOME` & `M2_HOME`)**: `cd BackendSpringBoot && call run_mvn.cmd package -DskipTests` (or `call run_mvn.cmd test`).
- **Restart Spring Boot backend**: `restart_backend.bat` (runs `BackendSpringBoot\start_springboot.cmd` -> `java -jar target\spotifake-backend-2.0.0.jar`). Rebuild the jar with `run_mvn.cmd package -DskipTests` before restarting if you edited Java, Thymeleaf templates, or static JS/CSS.
- **Start Essentia + Spring Boot together**: `start-services.bat`.
