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
import java.net.URI;
import java.nio.file.Files;
import java.util.*;

@RestController
@RequestMapping("/api/music")
public class MusicController {

    private final SpotifakeRepository repository;
    private final SongService songService;

    public MusicController(SpotifakeRepository repository, SongService songService) {
        this.repository = repository;
        this.songService = songService;
    }

    @GetMapping("")
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
            map.put("hasLyrics", s.getLyrics() != null && !s.getLyrics().isBlank());
            list.add(map);
        }
        return list;
    }

    // "/stream?fileName=..." is kept for file names containing "/" (encoded slashes are rejected in paths).
    @GetMapping(value = {"/stream/{identifier}", "/stream"})
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

        response.setContentType(resolveAudioMimeType(audioFile.getName()));
        response.setHeader("Accept-Ranges", "bytes");

        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            long[] range = parseSingleRange(rangeHeader.substring(6).trim(), length);
            if (range == null) {
                response.setStatus(HttpServletResponse.SC_REQUESTED_RANGE_NOT_SATISFIABLE);
                response.setHeader("Content-Range", "bytes */" + length);
                return;
            }
            long start = range[0];
            long end = range[1];
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

    @GetMapping("/cover/{songId}")
    public ResponseEntity<?> getCoverArt(@PathVariable String songId) {
        Song s = repository.getSongById(songId);
        if (s == null) s = repository.getSongByFilePathOrTitle(songId);
        if (s != null && s.getCoverArtUrl() != null && s.getCoverArtUrl().startsWith("http")) {
            return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(s.getCoverArtUrl())).build();
        }
        byte[] data = songService.getCoverArtData(songId);
        if (data == null || data.length == 0) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_JPEG);
        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @PostMapping("/play")
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

    @GetMapping("/lyrics/{songIdOrFileName}")
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

    @PostMapping("/report")
    public ResponseEntity<?> reportSong(@RequestBody(required = false) Map<String, Object> body,
                                        @AuthenticationPrincipal User user) {
        Map<String, Object> reqBody = body != null ? body : Collections.emptyMap();
        String idStr = String.valueOf(reqBody.getOrDefault("songId", ""));
        Song song = null;
        if (!idStr.isEmpty()) {
            song = repository.getSongById(idStr);
            if (song == null) {
                song = repository.getSongByFilePathOrTitle(idStr);
            }
        }

        int numericId = 0;
        try {
            if (song != null) {
                numericId = Integer.parseInt(song.getId());
            } else if (!idStr.isEmpty()) {
                numericId = Integer.parseInt(idStr);
            }
        } catch (Exception ignored) {}

        String title = song != null
                ? (song.getTitle() + " - " + song.getArtist())
                : String.valueOf(reqBody.getOrDefault("title", "Song #" + idStr));
        String reason = String.valueOf(reqBody.getOrDefault("reason", "Inappropriate Content"));
        String description = String.valueOf(reqBody.getOrDefault("description", ""));
        String reporter = user != null ? user.getUsername() : String.valueOf(reqBody.getOrDefault("reportedBy", "anonymous"));

        repository.createContentReport("Song", numericId, title, reason, description, reporter);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Report submitted successfully. Thank you for helping keep Spotifake safe."
        ));
    }

    /**
     * Parses "start-end" or "start-" for a file of the given length.
     * Returns {start, end} (end clamped to length-1), or null when the range is malformed,
     * a multi-range, a suffix range ("-N"), or starts at/after the end of the file.
     */
    static long[] parseSingleRange(String spec, long length) {
        if (spec.isEmpty() || spec.contains(",")) return null;
        int dash = spec.indexOf('-');
        if (dash <= 0) return null; // no dash, or suffix range "-N"
        try {
            long start = Long.parseLong(spec.substring(0, dash).trim());
            String endPart = spec.substring(dash + 1).trim();
            long end = endPart.isEmpty() ? length - 1 : Long.parseLong(endPart);
            if (start < 0 || start >= length || end < start) return null;
            return new long[] { start, Math.min(end, length - 1) };
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String resolveAudioMimeType(String fileName) {
        if (fileName == null) return "audio/mpeg";
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".m4a") || lower.endsWith(".mp4")) return "audio/mp4";
        if (lower.endsWith(".aac")) return "audio/aac";
        if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
        if (lower.endsWith(".opus")) return "audio/opus";
        if (lower.endsWith(".flac")) return "audio/flac";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".webm")) return "audio/webm";
        return "audio/mpeg";
    }
}
