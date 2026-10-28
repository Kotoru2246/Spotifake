package com.spotifake.controller;

import com.spotifake.entity.Playlist;
import com.spotifake.service.PlaylistService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/playlists")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PlaylistController {

    private final PlaylistService playlistService;

    @Data
    public static class PlaylistCreateRequest {
        private String title;
        private String description;
        private boolean isPublic = true;
    }

    @GetMapping("/public")
    public ResponseEntity<List<Playlist>> getPublicPlaylists() {
        return ResponseEntity.ok(playlistService.getPublicPlaylists());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Playlist>> getMyPlaylists(Authentication authentication) {
        return ResponseEntity.ok(playlistService.getUserPlaylists(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playlist> getPlaylistById(@PathVariable UUID id) {
        return ResponseEntity.ok(playlistService.getPlaylistById(id));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Playlist> createPlaylist(@RequestBody PlaylistCreateRequest request, Authentication authentication) {
        return ResponseEntity.ok(playlistService.createPlaylist(
                request.getTitle(),
                request.getDescription(),
                request.isPublic(),
                authentication.getName()
        ));
    }

    @PostMapping("/{playlistId}/tracks/{songId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Playlist> addTrack(@PathVariable UUID playlistId, @PathVariable UUID songId) {
        return ResponseEntity.ok(playlistService.addSongToPlaylist(playlistId, songId));
    }

    @DeleteMapping("/{playlistId}/tracks/{songId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Playlist> removeTrack(@PathVariable UUID playlistId, @PathVariable UUID songId) {
        return ResponseEntity.ok(playlistService.removeSongFromPlaylist(playlistId, songId));
    }
}
