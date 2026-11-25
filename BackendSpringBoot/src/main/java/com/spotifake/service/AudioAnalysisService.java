package com.spotifake.service;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Service
public class AudioAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AudioAnalysisService.class);

    private final SongService songService;
    private final SpotifakeRepository repository;
    private final AudioAnalysisClient client;
    private final ThreadPoolExecutor executor;
    private final java.util.concurrent.locks.ReentrantLock analysisLock = new java.util.concurrent.locks.ReentrantLock();

    public AudioAnalysisService(SongService songService, SpotifakeRepository repository, AudioAnalysisClient client) {
        this.songService = songService;
        this.repository = repository;
        this.client = client;
        this.executor = new ThreadPoolExecutor(1, 1, 0L, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(100),
                r -> {
                    Thread t = new Thread(r, "audio-analysis");
                    t.setDaemon(true);
                    return t;
                },
                (r, ex) -> log.warn("Audio analysis queue full; task discarded"));
    }

    /** True for null, blank, or the "analyzing..." placeholder. */
    public static boolean isPlaceholder(String v) {
        return v == null || v.isBlank() || v.trim().equalsIgnoreCase("analyzing...");
    }

    /** Note: getSongAudioFile may write a legacy FileData cache into uploads; that file is shared with streaming, so it is kept. */
    public boolean analyzeAndStore(String songId) {
        analysisLock.lock();
        try {
            return doAnalyzeAndStore(songId);
        } finally {
            analysisLock.unlock();
        }
    }

    private boolean doAnalyzeAndStore(String songId) {
        try {
            Song song = repository.getSongById(songId);
            if (song == null) return false;
            File audio = songService.getSongAudioFile(songId);
            if (audio == null) {
                log.warn("Audio analysis: no audio file for song {}", songId);
                return false;
            }
            Optional<AudioAnalysisClient.AnalysisResult> res = client.analyze(audio);
            if (res.isEmpty()) return false;
            AudioAnalysisClient.AnalysisResult r = res.get();

            Map<String, Object> fields = new LinkedHashMap<>();
            fields.put("Tempo", r.tempo());
            fields.put("Energy", r.energy());
            fields.put("Danceability", r.danceability());
            fields.put("Valence", r.valence());
            fields.put("Acousticness", r.acousticness());
            fields.put("Instrumentalness", r.instrumentalness());
            if (r.key() != null) fields.put("Key", r.key());
            if (r.mode() != null) fields.put("Mode", r.mode());
            if (repository.updateSongChecked(songId, fields) < 0) return false;
            String genre = (r.genre() != null && isPlaceholder(song.getGenre())) ? r.genre() : null;
            String mood = (r.mood() != null && isPlaceholder(song.getMood())) ? r.mood() : null;
            if (genre != null || mood != null) {
                return repository.setGenreMoodIfBlank(songId, genre, mood);
            }
            return true;
        } catch (Exception e) {
            log.warn("Audio analysis failed for song {}: {}", songId, e.toString());
            return false;
        }
    }

    public void analyzeAsync(String songId) {
        if (songId == null) return;
        try {
            executor.execute(() -> {
                try {
                    analyzeAndStore(songId);
                } catch (Throwable t) {
                    log.warn("Audio analysis task failed for {}: {}", songId, t.toString());
                }
            });
        } catch (Exception e) {
            log.warn("Could not queue audio analysis for {}: {}", songId, e.toString());
        }
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
    }
}
