package com.spotifake.controller;

import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistsController {

    private final SpotifakeRepository repository;

    public PlaylistsController(SpotifakeRepository repository) {
        this.repository = repository;
    }

    private String resolveUsername(User user) {
        return user != null ? user.getUsername() : "user_test";
    }

    @GetMapping({"", "/my" /* legacy alias for spotifake_mobile */})
    public List<Map<String, Object>> getPlaylists(@AuthenticationPrincipal User user) {

        String username = resolveUsername(user);
        return repository.getUserPlaylists(username);
    }

    @GetMapping("/{playlistId}")
    public ResponseEntity<?> getPlaylistDetails(@PathVariable String playlistId) {
        Map<String, Object> details = repository.getPlaylistDetails(playlistId);
        if (details == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(details);
    }

    @PostMapping("")
    public ResponseEntity<?> createPlaylist(@RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal User user) {
        String username = resolveUsername(user);
        String name = (String) body.get("name");
        String imageUrl = (String) body.get("imageUrl");
        @SuppressWarnings("unchecked")
        List<String> songs = (List<String>) body.get("songFileNames");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Playlist name is required"));
        }

        repository.createPlaylist(username, name, imageUrl, songs);
        return ResponseEntity.ok(repository.getUserPlaylists(username));
    }

    @PostMapping(value = "", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPlaylistMultipart(@RequestParam("name") String name,
                                                     @RequestParam(value = "cover", required = false) MultipartFile cover,
                                                     @AuthenticationPrincipal User user) throws IOException {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Playlist name is required"));
        }
        boolean hasCover = cover != null && !cover.isEmpty();
        if (hasCover) {
            ResponseEntity<?> bad = validateCover(cover);
            if (bad != null) return bad;
        }
        String username = resolveUsername(user);
        Map<String, Object> created = repository.createPlaylist(username, name.trim(), "", null);
        if (created == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not create playlist"));
        }
        if (hasCover) {
            storeCover((String) created.get("id"), cover.getBytes());
        }
        return ResponseEntity.ok(repository.getUserPlaylists(username));
    }

    @PutMapping("/{playlistId}")
    public ResponseEntity<?> updatePlaylist(@PathVariable String playlistId,
                                            @RequestBody Map<String, Object> body,
                                            @AuthenticationPrincipal User user) {
        Object n = body.get("name");
        String name = n instanceof String ? (String) n : null;
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Playlist name is required"));
        }
        ResponseEntity<?> denied = checkOwner(playlistId, user);
        if (denied != null) return denied;
        Object i = body.get("imageUrl");
        String imageUrl = i instanceof String ? (String) i : null;
        repository.updatePlaylistDetails(playlistId, name.trim(), imageUrl);
        return getPlaylistDetails(playlistId);
    }

    @GetMapping("/{playlistId}/cover")
    public ResponseEntity<?> getCover(@PathVariable String playlistId) {
        byte[] data = repository.getPlaylistCoverData(playlistId);
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        String type = sniffImageType(data);
        return ResponseEntity.ok()
                .header("Cache-Control", "max-age=86400")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(type != null ? type : "application/octet-stream"))
                .body(data);
    }

    @PostMapping(value = "/{playlistId}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadCover(@PathVariable String playlistId,
                                         @RequestParam("cover") MultipartFile cover,
                                         @AuthenticationPrincipal User user) throws IOException {
        ResponseEntity<?> denied = checkOwner(playlistId, user);
        if (denied != null) return denied;
        ResponseEntity<?> bad = validateCover(cover);
        if (bad != null) return bad;
        storeCover(playlistId, cover.getBytes());
        return getPlaylistDetails(playlistId);
    }

    @DeleteMapping("/{playlistId}/cover")
    public ResponseEntity<?> deleteCover(@PathVariable String playlistId,
                                         @AuthenticationPrincipal User user) {
        ResponseEntity<?> denied = checkOwner(playlistId, user);
        if (denied != null) return denied;
        repository.setPlaylistCover(playlistId, null, "");
        return getPlaylistDetails(playlistId);
    }

    private static final long MAX_COVER_BYTES = 5L * 1024 * 1024;

    static String sniffImageType(byte[] b) {
        if (b == null || b.length < 4) return null;
        if ((b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "image/jpeg";
        if ((b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "image/png";
        if (b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') return "image/gif";
        if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "image/webp";
        return null;
    }

    private ResponseEntity<?> validateCover(MultipartFile cover) throws IOException {
        if (cover == null || cover.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cover image is required"));
        }
        String ct = cover.getContentType();
        if (ct == null || !ct.toLowerCase().startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cover must be an image"));
        }
        if (cover.getSize() > MAX_COVER_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cover image must be 5 MB or smaller"));
        }
        if (sniffImageType(cover.getBytes()) == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Unsupported or invalid image file"));
        }
        return null;
    }

    private ResponseEntity<?> checkOwner(String playlistId, User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Sign in required"));
        }
        String owner = repository.getPlaylistOwnerId(playlistId);
        if (owner == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Playlist not found"));
        }
        if (!owner.equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not your playlist"));
        }
        return null;
    }

    private String storeCover(String playlistId, byte[] bytes) {
        String url = "/api/playlists/" + playlistId + "/cover?v=" + System.currentTimeMillis();
        repository.setPlaylistCover(playlistId, bytes, url);
        return url;
    }

    @DeleteMapping("/{playlistId}")
    public ResponseEntity<?> deletePlaylist(@PathVariable String playlistId,
                                            @AuthenticationPrincipal User user) {
        repository.deletePlaylist(playlistId);
        String username = resolveUsername(user);
        return ResponseEntity.ok(repository.getUserPlaylists(username));
    }

    @PostMapping("/{playlistId}/songs")
    public ResponseEntity<?> addSong(@PathVariable String playlistId,
                                     @RequestBody Map<String, String> body,
                                     @AuthenticationPrincipal User user) {
        String song = body.get("songFileName");
        if (song == null) song = body.get("fileName");
        if (song == null) song = body.get("songId");
        if (song != null) {
            repository.addSongToPlaylist(playlistId, song);
        }
        String username = resolveUsername(user);
        return ResponseEntity.ok(repository.getUserPlaylists(username));
    }

    @DeleteMapping({"/{playlistId}/songs", "/{playlistId}/songs/{songFileName}"})
    public ResponseEntity<?> removeSong(@PathVariable String playlistId,
                                        @PathVariable(required = false) String songFileName,
                                        @RequestBody(required = false) Map<String, String> body,
                                        @AuthenticationPrincipal User user) {
        String song = songFileName;
        if (song == null && body != null) {
            song = body.get("songFileName");
            if (song == null) song = body.get("fileName");
            if (song == null) song = body.get("songId");
        }
        if (song != null) {
            repository.removeSongFromPlaylist(playlistId, song);
        }
        String username = resolveUsername(user);
        return ResponseEntity.ok(repository.getUserPlaylists(username));
    }

    @PostMapping("/toggle-favorite")
    public ResponseEntity<?> toggleFavorite(@RequestBody Map<String, String> body,
                                            @AuthenticationPrincipal User user) {
        String username = resolveUsername(user);
        String song = body.get("songFileName");
        if (song == null) song = body.get("fileName");
        if (song == null) song = body.get("songId");
        repository.toggleUserFavorite(username, song);
        return ResponseEntity.ok(repository.getUserPlaylists(username));
    }
}
