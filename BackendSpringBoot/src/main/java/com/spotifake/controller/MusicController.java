package com.spotifake.controller;

import com.spotifake.model.Song;
import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import com.spotifake.service.SongService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequestMapping({"/api/music", "/music", "/songs", "/api/songs"})
public class MusicController {

    private final SpotifakeRepository repository;
    private final SongService songService;

    public MusicController(SpotifakeRepository repository, SongService songService) {
        this.repository = repository;
        this.songService = songService;
    }

    @GetMapping({"", "/list", "/library"})
    public List<Map<String, Object>> getSongList() {

        List<Song> songs = repository.getAllSongs();
        List<Map<String, Object>> list = new ArrayList<>();
        for (Song s : songs) {
            if (s.isDeleted()) continue;
            Map<String, Object> map = new HashMap<>();
            String fn = s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3";
            map.put("fileName", fn);
            map.put("title", s.getTitle());
            map.put("displayName", s.getTitle());
            map.put("artist", s.getArtist());
            map.put("album", s.getAlbum());
            map.put("artistId", s.getUserId() != null ? s.getUserId() : "");
            map.put("albumId", s.getAlbumId() != null ? s.getAlbumId() : "");
            map.put("durationSeconds", Math.round((s.getDurationMs() != 0 ? s.getDurationMs() : 180000) / 1000.0));
            map.put("id", s.getId());
            map.put("coverArtUrl", s.getCoverArtUrl());
            map.put("storageUrl", s.getStorageUrl());
            map.put("playCount", s.getPlayCount());
            map.put("releaseDate", s.getReleaseDate() != null ? s.getReleaseDate() : "");
            map.put("genre", s.getGenre() != null ? s.getGenre() : "");
            map.put("mood", s.getMood() != null ? s.getMood() : "");
            map.put("lyrics", s.getLyrics() != null ? s.getLyrics() : "");
            list.add(map);
        }
        return list;
    }

    @GetMapping(value = {"/stream/{identifier}", "/stream", "/{identifier}/stream"})
    public void streamAudio(@PathVariable(required = false) String identifier,
                            @RequestParam(required = false) String fileName,
                            HttpServletRequest request,
                            HttpServletResponse response) throws IOException {
        String target = identifier != null ? identifier : fileName;
        if (target == null) {
            response.setStatus(404);
            return;
        }

        File audioFile = songService.getSongAudioFile(target);
        if (audioFile == null || !audioFile.exists()) {
            response.setStatus(404);
            return;
        }

        long length = audioFile.length();
        String rangeHeader = request.getHeader("Range");

        response.setContentType("audio/mpeg");
        response.setHeader("Accept-Ranges", "bytes");

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            String[] parts = rangeHeader.substring(6).split("-");
            long start = Long.parseLong(parts[0]);
            long end = parts.length > 1 && !parts[1].isEmpty() ? Long.parseLong(parts[1]) : length - 1;

            if (end >= length) end = length - 1;
            long contentLength = end - start + 1;

            response.setStatus(HttpServletResponse.SC_PARTIAL_CONTENT);
            response.setHeader("Content-Range", "bytes " + start + "-" + end + "/" + length);
            response.setHeader("Content-Length", String.valueOf(contentLength));

            try (RandomAccessFile raf = new RandomAccessFile(audioFile, "r");
                 OutputStream os = response.getOutputStream()) {
                raf.seek(start);
                byte[] buffer = new byte[8192];
                long remaining = contentLength;
                while (remaining > 0) {
                    int read = raf.read(buffer, 0, (int) Math.min(buffer.length, remaining));
                    if (read == -1) break;
                    os.write(buffer, 0, read);
                    remaining -= read;
                }
            }
        } else {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setHeader("Content-Length", String.valueOf(length));
            Files.copy(audioFile.toPath(), response.getOutputStream());
        }
    }

    @GetMapping({"/cover/{songId}", "/{songId}/cover"})
    public ResponseEntity<byte[]> getCoverArt(@PathVariable String songId) {
        byte[] data = songService.getCoverArtData(songId);
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @PostMapping({"/play", "/listen", "/api/play", "/api/listen"})
    public ResponseEntity<?> recordPlay(@RequestBody(required = false) Map<String, String> body,
                                        HttpServletRequest request,
                                        @AuthenticationPrincipal User user) {
        String fileName = body != null ? body.get("fileName") : null;
        String songId = body != null ? body.get("songId") : null;
        String target = songId != null ? songId : fileName;
        if (target != null && !target.trim().isEmpty()) {
            String uid = user != null ? user.getId() : "guest";
            String userAgent = request.getHeader("User-Agent");
            String deviceType = (userAgent != null && userAgent.toLowerCase().contains("mobile")) ? "Mobile Player" : "Web Player";
            String ip = request.getRemoteAddr();
            repository.recordSongPlay(target.trim(), uid, deviceType, ip);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadTrack(@RequestParam("file") MultipartFile file,
                                         @RequestParam(value = "coverArt", required = false) MultipartFile coverArt,
                                         @RequestParam(value = "title", required = false) String title,
                                         @RequestParam(value = "artist", required = false) String artist,
                                         @RequestParam(value = "album", required = false) String album,
                                         @RequestParam(value = "genre", required = false) String genre,
                                         @AuthenticationPrincipal User user) {
        try {
            String userId = user != null ? user.getId() : "00000000-0000-0000-0000-000000000001";
            Song song = songService.uploadSong(file, coverArt, title, artist, album, genre, userId);
            return ResponseEntity.ok(song);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/detail/{songId}")
    public ResponseEntity<?> getSongDetail(@PathVariable String songId) {
        Song song = repository.getSongById(songId);
        if (song == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(song);
    }

    @GetMapping({"/lyrics/{songIdOrFileName}", "/{songIdOrFileName}/lyrics"})
    public ResponseEntity<?> getLyrics(@PathVariable String songIdOrFileName) {
        Song song = repository.getSongByFilePathOrTitle(songIdOrFileName);
        if (song == null) {
            song = repository.getSongById(songIdOrFileName);
        }
        if (song == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of(
            "title", song.getTitle() != null ? song.getTitle() : "",
            "artist", song.getArtist() != null ? song.getArtist() : "",
            "lyrics", song.getLyrics() != null ? song.getLyrics() : ""
        ));
    }
}
