package com.spotifake.service;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Replaces the audio of a song an admin confirmed as wrong. The song keeps its ID, album and
 * playlist entries; only the file on disk changes, and the old file is kept as a backup.
 * spotdl runs inside a temporary folder, where its Spotifake database import cannot load,
 * so a re-download never creates or edits song rows.
 */
@Service
public class SongRedownloadService {

    private static final Logger log = LoggerFactory.getLogger(SongRedownloadService.class);
    private static final int TIMEOUT_MINUTES = 10;
    private static final Set<String> FORMATS = Set.of("m4a", "mp3", "flac", "ogg", "opus", "wav");
    private static final Pattern SPOTIFY_TRACK =
            Pattern.compile("^https://open\\.spotify\\.com/(?:intl-[a-z]+/)?track/[A-Za-z0-9]+(?:\\?.*)?$");
    private static final Pattern YOUTUBE = Pattern.compile(
            "^https://(?:(?:www\\.|music\\.|m\\.)?youtube\\.com/watch\\?(?:[^#]*&)?v=|youtu\\.be/)([A-Za-z0-9_-]{11})(?:[?&#].*)?$");

    private final SpotifakeRepository repository;
    private final SongService songService;
    private final AudioAnalysisService analysisService;
    private final DownloaderService downloaderService;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    /** Report ID to the latest status text shown on the admin page. */
    private final Map<Integer, String> status = new ConcurrentHashMap<>();
    private final Set<String> busySongs = ConcurrentHashMap.newKeySet();

    public SongRedownloadService(SpotifakeRepository repository, SongService songService,
                                 AudioAnalysisService analysisService, DownloaderService downloaderService) {
        this.repository = repository;
        this.songService = songService;
        this.analysisService = analysisService;
        this.downloaderService = downloaderService;
    }

    public Map<Integer, String> statuses() {
        return Map.copyOf(status);
    }

    /** Returns the canonical watch URL, "" when none was given, or null when it is not a YouTube video link. */
    static String normalizeYoutubeUrl(String url) {
        if (url == null || url.isBlank()) return "";
        Matcher m = YOUTUBE.matcher(url.trim());
        return m.matches() ? "https://www.youtube.com/watch?v=" + m.group(1) : null;
    }

    /** Queues a re-download. Returns an error message, or null when it was queued. */
    public String start(int reportId, String songId, String youtubeUrl, String adminUser) {
        String youtube = normalizeYoutubeUrl(youtubeUrl);
        if (youtube == null) return "That is not a YouTube video link";
        Song song = songId == null || songId.isBlank() ? null : repository.getSongById(songId);
        if (song == null) return "This report is not linked to a song";
        String spotify = song.getSourceId() == null ? "" : song.getSourceId().trim();
        if (!SPOTIFY_TRACK.matcher(spotify).matches()) return "This song has no Spotify link to download from";
        File target = songService.getSongAudioFile(song.getId());
        if (target == null) return "The song's audio file was not found";
        String format = extension(target.getName());
        if (!FORMATS.contains(format)) return "Unsupported audio format: " + format;
        if (!busySongs.add(song.getId())) return "This song is already being re-downloaded";

        // "youtube|spotify" makes spotdl use that video with the Spotify track's metadata.
        String query = youtube.isEmpty() ? spotify : youtube + "|" + spotify;
        status.put(reportId, "Re-downloading...");
        executor.execute(() -> {
            try {
                replaceAudio(song.getId(), target.toPath(), query, format);
                repository.resolveContentReport(reportId, "Resolved", "Audio re-downloaded and replaced", adminUser);
                repository.logAdminAction(adminUser, "SONG_REDOWNLOAD", "Song", song.getId(), "Report " + reportId);
                status.remove(reportId);
                analysisService.analyzeAsync(song.getId());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                status.put(reportId, "Re-download was interrupted");
            } catch (Exception e) {
                log.warn("Re-download failed for song {}: {}", song.getId(), e.toString());
                status.put(reportId, "Re-download failed: " + e.getMessage());
            } finally {
                busySongs.remove(song.getId());
            }
        });
        return null;
    }

    private void replaceAudio(String songId, Path target, String query, String format)
            throws IOException, InterruptedException {
        Path work = Files.createTempDirectory("spotifake-redownload");
        try {
            Path downloaded = download(work, query, format);
            if (downloaded == null || !Files.isRegularFile(downloaded) || Files.size(downloaded) == 0) {
                throw new IOException("spotdl did not produce an audio file");
            }
            Path backups = target.resolveSibling("replaced");
            Files.createDirectories(backups);
            Files.copy(target, backups.resolve(songId + "-" + System.currentTimeMillis() + "." + format));
            Files.move(downloaded, target, StandardCopyOption.REPLACE_EXISTING);
        } finally {
            deleteTree(work);
        }
    }

    /** Runs spotdl in {@code work} and returns the audio file it saved, or null. */
    protected Path download(Path work, String query, String format) throws IOException, InterruptedException {
        String python = downloaderService.pythonExecutable(downloaderService.projectRoot());
        ProcessBuilder pb = new ProcessBuilder(python, "-u", "-m", "spotdl",
                "--audio", "youtube-music", "youtube",
                "--format", format,
                "--output", "audio.{output-ext}",
                "--overwrite", "force",
                "download", "--", query);
        pb.directory(work.toFile());
        pb.environment().remove("PYTHONPATH");
        Path logFile = work.resolve("spotdl.log");
        pb.redirectErrorStream(true);
        pb.redirectOutput(logFile.toFile());
        Process p = pb.start();
        if (!p.waitFor(TIMEOUT_MINUTES, TimeUnit.MINUTES)) {
            p.descendants().forEach(ProcessHandle::destroyForcibly);
            p.destroyForcibly();
            throw new IOException("spotdl timed out after " + TIMEOUT_MINUTES + " minutes");
        }
        Path audio = work.resolve("audio." + format);
        if (!Files.isRegularFile(audio)) {
            log.warn("spotdl produced no file (exit {}): {}", p.exitValue(),
                    new String(Files.readAllBytes(logFile), java.nio.charset.StandardCharsets.UTF_8));
            return null;
        }
        return audio;
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static void deleteTree(Path root) {
        try (var paths = Files.walk(root)) {
            paths.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
        } catch (IOException e) {
            log.warn("Could not clean {}: {}", root, e.toString());
        }
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }
}
