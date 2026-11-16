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
  - Frontend JS/CSS: `BackendSpringBoot/src/main/resources/static/js/site.js` (~4,761 lines — always `Grep` for the function/symbol first, then `Read` the full block), `css/site.css`, `css/dashboard.css`
- **Audio Analysis Service (`EssentiaService/`, port `3000`)**: Node.js service.
- **Python AI Service (`BackendAI/`)**: FastAPI + ChromaDB recommendation service.
- **Legacy / Secondary Folders (do not modify unless explicitly requested)**: `WebClient/`, `WebClientMvc/`, `DesktopClient/`, `DataAccess/`, `spotify-downloader/`.

## Build & Run Commands
- **Maven (`run_mvn.cmd` sets `JAVA_HOME` & `M2_HOME`)**: `cd BackendSpringBoot && call run_mvn.cmd package -DskipTests` (or `call run_mvn.cmd test`).
- **Restart Spring Boot backend**: `restart_backend.bat` (runs `BackendSpringBoot\start_springboot.cmd` -> `java -jar target\spotifake-backend-2.0.0.jar`). Rebuild the jar with `run_mvn.cmd package -DskipTests` before restarting if you edited Java, Thymeleaf templates, or static JS/CSS.
- **Start Essentia + Spring Boot together**: `start-services.bat`.
