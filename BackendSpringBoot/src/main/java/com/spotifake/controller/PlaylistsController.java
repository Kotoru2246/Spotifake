package com.spotifake.controller;

import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.http.ResponseEntity;
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
