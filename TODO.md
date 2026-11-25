# TODO

Remaining work after the 2026-11 cleanup (disk hygiene, `/api` routes, downloader hardening,
site.js module split, tests). Most important first.

## Security

- [ ] **JWT secret is committed** in `application.properties` (`app.jwt.secret`), and `JwtUtil` pads
      short keys predictably. Load it from an env var, fail startup if it is missing or short, and
      rotate it. `BackendAI/main.py` has the same default secret.
- [ ] **Default-allow**: `SecurityConfig` ends with `.anyRequest().permitAll()`. Switch to
      default-deny and list the public routes explicitly.
- [ ] **Anonymous uploads**: `POST /api/music/upload` is public and falls back to a hard-coded user
      id. Require ARTIST/ADMIN.
- [ ] **CSRF is disabled** while the JWT is also accepted from a cookie, so cookie-authenticated
      form posts (admin dashboard, artist manager) can be forged cross-site. Enable CSRF for
      cookie-authenticated requests, or set `SameSite=Strict` and require the Bearer header for
      state-changing calls.
- [ ] Controllers fall back to demo accounts when nobody is logged in (`PlaylistsController` →
      `user_test`, `ArtistController` → `artist_test`, `AdminDashboardController` → `admin_test`).
      Return 401 instead.
- [ ] Mobile downloader: `/api/downloader/**` is now ADMIN-only, and `spotifake_mobile` sends no
      token, so "Add album" on mobile gets 401. Add login to the app, or drop the feature there.

## API cleanup

- [ ] Remove the legacy aliases once a new APK is out: `GET /api/playlists/my`,
      `POST /api/downloader/download`, `GET /artist/details` (update `spotifake_mobile/lib/services/api_service.dart`).
- [ ] Front-end calls with no backend route (pre-existing 404s, listed in docs/API.md): record-play,
      import, download, album/playlist save/unsave, playlist rename/visibility, song features,
      studio album list/create, studio test upload. Implement or remove them.
- [ ] `ArtistApiController` delegates to `ArtistController.getArtistDetails`. Move that logic into a service.
- [ ] `POST /api/music/upload` without a multipart body returns 500; it should be 400.
- [ ] `Range: bytes=-N` (suffix range) returns 416 by design. Browsers rarely send it, but RFC 9110
      allows serving the last N bytes; decide whether to support it.
- [ ] `AI_SERVICE_URL` is now used (`spotifake.analysis.url`); `ESSENTIA_URL` is still ignored by Spring Boot, so
      wire it up or remove it from compose.

## Bugs found during the cleanup (pre-existing)

- [ ] Covers stored as `uploads/covers/<name>.jpg` return 404 under both `/uploads/covers/...` and
      `/covers/...`, although the files exist. Check `spring.web.resources.static-locations` and
      the `SecurityConfig` `/uploads/**` matcher.
- [ ] `Home/Index.html` inline handlers call `setModalOpen(...)` and `openAllMixesView(...)`, which
      were never exposed on `window` (ReferenceError on click). Add them to
      `static/js/modules/windowBindings.js` or remove the handlers.
- [ ] `BackendAI/start_backend.py` defaults to port 8000, which clashes with Spring Boot; the
      Dockerfile and `run_downloader_web.bat` use 5000.

## Refactoring

- [ ] Split `SpotifakeRepository.java` (~2,400 lines) into `SongRepository`, `UserRepository`,
      `PlaylistRepository`, `AdminRepository`, `PaymentRepository`, etc.
- [ ] Replace the ~160 inline `on*="..."` handlers in `Home/Index.html` with `addEventListener`,
      then shrink `windowBindings.js`.
- [ ] Remove the unused `spring.datasource.*` properties (DataSource auto-config is excluded).
- [ ] Decide whether `CoverArtData` (about 33 MB) should also move to `uploads/covers/`.

## Tests

- [ ] Add tests for playlists, auth login/register, subscription checkout (Stripe mocked) and the
      admin dashboard pages.
- [ ] Add a browser smoke test (Playwright) for the web player.
