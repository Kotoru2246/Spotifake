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

## Multi-Agent Workflow
Subagents live in `.claude/agents/` (model / effort): `planner` (opus/medium, read-only), `implementer` (sonnet/low), `reviewer` (opus/medium, read-only), `debugger` (sonnet/high), `tester` (haiku/medium), `auditor` (haiku/high, read-only), `ui-tester` (haiku/medium, Playwright on `localhost:8000`).
- The main session orchestrates. **After every agent finishes, summarize its result and wait for the user's OK before starting the next agent.**
- At the start of a workflow, call `mcp__agent-monitor__plan_agents` with the numbered steps (title = the Agent call's `description`, `agent` = type, `after` = steps it waits for) so the Agents pane shows them under "Planned".
- **Feature:** planner → user → implementer (one step at a time) → user → reviewer → user → tester → user.
- **Bug:** debugger → user → tester → user (reviewer optional).
- **Audit:** auditor → user picks items → Feature or Bug workflow.
- **UI check:** ensure backend is up (`restart_backend.bat`) → ui-tester → user → debugger for broken items.
- Cheap non-Claude work (summaries, explanations, log digests) can go to Gemini Flash via the `agent-monitor` mod: `/gemini <prompt>` or the `ask_gemini` tool (read-only).

## Build & Run Commands
- **Maven (`BackendSpringBoot\run_mvn.cmd` sets `JAVA_HOME` & `M2_HOME`)**: `cmd /c "cd /d BackendSpringBoot && call .\run_mvn.cmd package -DskipTests"` (or `... call .\run_mvn.cmd test`). Use `.\` — Claude Code's shell doesn't run scripts from the current folder by name. Run it from the PowerShell tool; from the Bash tool write `cmd //c` (Git Bash rewrites `/c` and cmd silently does nothing). Stop the running backend first: it locks `target\spotifake-backend-2.0.0.jar` and repackage fails with "Unable to rename".
- From Claude Code, start the backend with `Start-Process cmd -ArgumentList '/c','set "NoDefaultCurrentDirectoryInExePath=" && restart_backend.bat'` so its window can run `start_springboot.cmd`.
- **Restart Spring Boot backend**: `restart_backend.bat` (runs `BackendSpringBoot\start_springboot.cmd` -> `java -jar target\spotifake-backend-2.0.0.jar`). Rebuild the jar with `run_mvn.cmd package -DskipTests` before restarting if you edited Java or Thymeleaf templates. Static JS/CSS is served from `src/main/resources/static/` first, so those edits only need a browser refresh (`application.properties` changes only need a restart).
- **Start Essentia + Spring Boot together**: `start-services.bat`.
