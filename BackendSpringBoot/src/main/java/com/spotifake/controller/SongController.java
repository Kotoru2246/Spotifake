package com.spotifake.controller;

import com.spotifake.dto.SongDTO;
import com.spotifake.entity.Song;
import com.spotifake.service.SongService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/songs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SongController {

    private final SongService songService;

    @GetMapping
    public ResponseEntity<List<Song>> getAllSongs() {
        return ResponseEntity.ok(songService.getAllSongs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> getSongById(@PathVariable UUID id) {
        return ResponseEntity.ok(songService.getSongById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Song>> searchSongs(@RequestParam String query) {
        return ResponseEntity.ok(songService.searchSongs(query));
    }

    @GetMapping("/top")
    public ResponseEntity<List<Song>> getTopSongs() {
        return ResponseEntity.ok(songService.getTopSongs());
    }

    @GetMapping("/genre/{genre}")
    public ResponseEntity<List<Song>> getSongsByGenre(@PathVariable String genre) {
        return ResponseEntity.ok(songService.getSongsByGenre(genre));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ARTIST', 'ADMIN')")
    public ResponseEntity<Song> createSong(@Valid @RequestBody SongDTO dto, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(songService.createSong(dto, username));
    }

    @PostMapping("/{id}/play")
    public ResponseEntity<Void> recordPlay(@PathVariable UUID id) {
        songService.incrementPlayCount(id);
        return ResponseEntity.ok().build();
    }
}
