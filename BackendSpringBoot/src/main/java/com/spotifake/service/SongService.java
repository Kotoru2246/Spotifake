package com.spotifake.service;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.Instant;
import java.util.UUID;

@Service
public class SongService {

    private final SpotifakeRepository repository;
    private final String uploadDir;

    public SongService(SpotifakeRepository repository,
                       @Value("${app.uploads.dir:uploads}") String uploadDir) {
        this.repository = repository;
        this.uploadDir = uploadDir;
        new File(uploadDir).mkdirs();
    }

    public Song uploadSong(MultipartFile file, MultipartFile coverArt, String title, String artist, String album, String genre, String userId) throws Exception {
        String songId = UUID.randomUUID().toString();
        String originalFilename = file.getOriginalFilename();
        String ext = originalFilename != null && originalFilename.contains(".") ?
                originalFilename.substring(originalFilename.lastIndexOf(".")) : ".mp3";
        String diskFileName = songId + ext;

        File targetFile = new File(uploadDir, diskFileName);
        file.transferTo(targetFile);

        byte[] fileBytes = Files.readAllBytes(targetFile.toPath());
        byte[] coverBytes = null;
        String coverUrl = "";

        if (coverArt != null && !coverArt.isEmpty()) {
            coverBytes = coverArt.getBytes();
            coverUrl = "/api/music/cover/" + songId;
        }

        String parsedTitle = title;
        String parsedArtist = artist;
        String parsedAlbum = album;
        String parsedGenre = genre;
        long durationMs = 180000;

        if (originalFilename != null) {
            String base = originalFilename.replace(ext, "").trim();
            if (base.contains(" - ")) {
                String[] parts = base.split(" - ", 2);
                if (parsedArtist == null || parsedArtist.isEmpty()) parsedArtist = parts[0].trim();
                if (parsedTitle == null || parsedTitle.isEmpty()) parsedTitle = parts[1].trim();
            } else {
                if (parsedTitle == null || parsedTitle.isEmpty()) parsedTitle = base;
            }
        }


        if (parsedTitle == null || parsedTitle.isEmpty()) parsedTitle = originalFilename != null ? originalFilename.replace(ext, "") : "Untitled";
        if (parsedArtist == null || parsedArtist.isEmpty()) parsedArtist = "Unknown Artist";
        if (parsedGenre == null || parsedGenre.isEmpty()) parsedGenre = "Pop";

        Song song = new Song();
        song.setId(songId);
        song.setUserId(userId);
        song.setTitle(parsedTitle);
        song.setArtist(parsedArtist);
        song.setAlbum(parsedAlbum);
        song.setGenre(parsedGenre);
        song.setDurationMs(durationMs);
        song.setFilePath(diskFileName);
        song.setFileData(fileBytes);
        song.setCoverArtUrl(coverUrl);
        song.setCoverArtData(coverBytes);
        song.setStorageUrl("/api/music/stream/" + songId);
        song.setUploadedAt(Instant.now().toString());

        // Default synthetic acoustic features
        song.setTempo(120.0);
        song.setEnergy(0.7);
        song.setDanceability(0.65);
        song.setValence(0.6);
        song.setAcousticness(0.2);
        song.setInstrumentalness(0.05);

        return repository.insertSong(song);
    }

    private boolean isWithinUploads(File f) {
        if (f == null) return false;
        try {
            String canonical = f.getCanonicalPath();
            File dir1 = new File(uploadDir).getCanonicalFile();
            File dir2 = new File("../uploads").getCanonicalFile();

            String path1 = dir1.getPath();
            String path2 = dir2.getPath();

            return (canonical.equals(path1) || canonical.startsWith(path1 + File.separator))
                || (canonical.equals(path2) || canonical.startsWith(path2 + File.separator));
        } catch (IOException e) {
            return false;
        }
    }

    public File getSongAudioFile(String songIdOrFileName) {
        if (songIdOrFileName == null || songIdOrFileName.isBlank()) {
            return null;
        }
        Song s = repository.getSongByFilePathOrTitle(songIdOrFileName);
        if (s == null) s = repository.getSongById(songIdOrFileName);

        if (s != null) {
            if (s.getFilePath() != null && !s.getFilePath().isEmpty()) {
                File f = new File(uploadDir, s.getFilePath());
                if (f.exists() && isWithinUploads(f)) return f;
                File rootF = new File(s.getFilePath());
                if (rootF.exists() && isWithinUploads(rootF)) return rootF;
                File parentF = new File("..", s.getFilePath());
                if (parentF.exists() && isWithinUploads(parentF)) return parentF;

                String cleanPath = s.getFilePath().replace('\\', '/');
                if (cleanPath.startsWith("uploads/")) {
                    File parentUploads = new File("../uploads", cleanPath.substring("uploads/".length()));
                    if (parentUploads.exists() && isWithinUploads(parentUploads)) return parentUploads;
                    File directUploads = new File(uploadDir, cleanPath.substring("uploads/".length()));
                    if (directUploads.exists() && isWithinUploads(directUploads)) return directUploads;
                }
            }
            if (s.getFileData() != null && s.getFileData().length > 0) {
                try {
                    String safeId = new File(s.getId()).getName();
                    File tmp = new File(uploadDir, safeId + ".mp3");
                    if (!tmp.exists()) {
                        Files.write(tmp.toPath(), s.getFileData());
                    }
                    if (isWithinUploads(tmp)) return tmp;
                } catch (IOException ignored) {}
            }
        }

        File direct = new File(uploadDir, songIdOrFileName);
        if (direct.exists() && isWithinUploads(direct)) return direct;
        File parentDirect = new File("../uploads", songIdOrFileName);
        if (parentDirect.exists() && isWithinUploads(parentDirect)) return parentDirect;
        return null;
    }

    public byte[] getCoverArtData(String songId) {
        Song s = repository.getSongById(songId);
        if (s != null && s.getCoverArtData() != null && s.getCoverArtData().length > 0) {
            return s.getCoverArtData();
        }
        if (s != null && s.getCoverArtUrl() != null && !s.getCoverArtUrl().isBlank()) {
            String coverPath = s.getCoverArtUrl().replace('\\', '/');
            if (coverPath.startsWith("uploads/")) {
                coverPath = coverPath.substring("uploads/".length());
            }
            File coverFile = new File(uploadDir, coverPath);
            if (!coverFile.exists() || !isWithinUploads(coverFile)) {
                coverFile = new File("../uploads", coverPath);
            }
            if (coverFile.exists() && coverFile.isFile() && isWithinUploads(coverFile)) {
                try {
                    return Files.readAllBytes(coverFile.toPath());
                } catch (IOException ignored) {}
            }
        }
        return null;
    }
}
