package com.spotifake.controller;

import com.spotifake.model.Album;
import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

    private final SpotifakeRepository repository;

    public AlbumController(SpotifakeRepository repository) {
        this.repository = repository;
    }

    @GetMapping("")
    public List<Album> getAllAlbums() {
        return repository.getAllAlbums();
    }

    @GetMapping("/{albumId}")
    public ResponseEntity<?> getAlbum(@PathVariable String albumId) {
        Album album = repository.getAlbumById(albumId);
        if (album == null) {
            return ResponseEntity.notFound().build();
        }

        List<Song> songs = repository.getSongsByAlbum(album.getId());
        if (songs.isEmpty() && album.getTitle() != null) {
            songs = repository.getSongsByAlbum(album.getTitle());
        }

        List<Map<String, Object>> albumSongs = new ArrayList<>();
        for (Song s : songs) {
            if (s.isDeleted()) continue;
            Map<String, Object> songMap = new HashMap<>();
            String fn = s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3";
            songMap.put("fileName", fn);
            songMap.put("displayName", s.getTitle());
            songMap.put("title", s.getTitle());
            songMap.put("artist", s.getArtist());
            songMap.put("artistId", album.getArtistId());
            songMap.put("albumId", album.getId());
            songMap.put("durationSeconds", Math.round((s.getDurationMs() != 0 ? s.getDurationMs() : 180000) / 1000.0));
            songMap.put("id", s.getId());
            songMap.put("coverArtUrl", s.getCoverArtUrl());
            songMap.put("storageUrl", s.getStorageUrl());
            songMap.put("playCount", s.getPlayCount());
            albumSongs.add(songMap);
        }

        Map<String, Object> dto = new HashMap<>();
        dto.put("id", album.getId());
        dto.put("name", album.getTitle());
        dto.put("title", album.getTitle());
        dto.put("imageUrl", album.getCoverArtUrl() != null ? album.getCoverArtUrl() : "");
        dto.put("coverUrl", album.getCoverArtUrl() != null ? album.getCoverArtUrl() : "");
        dto.put("isPublic", true);
        dto.put("isOwner", false);
        dto.put("type", "Album");
        dto.put("songs", albumSongs);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/artist/{artistId}")
    public List<Album> getArtistAlbums(@PathVariable String artistId) {
        return repository.getAlbumsByArtist(artistId);
    }
}
