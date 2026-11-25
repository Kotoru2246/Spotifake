package com.spotifake.controller;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import com.spotifake.service.AudioAnalysisClient;
import com.spotifake.service.AudioAnalysisService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/analysis")
public class AdminAnalysisController {

    private final SpotifakeRepository repository;
    private final AudioAnalysisService service;
    private final AudioAnalysisClient client;

    public AdminAnalysisController(SpotifakeRepository repository, AudioAnalysisService service, AudioAnalysisClient client) {
        this.repository = repository;
        this.service = service;
        this.client = client;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of("unanalyzed", repository.countUnanalyzedSongs());
    }

    /** Backfill runs synchronously on a request thread, so keep batches small (1..5). */
    public static int clampLimit(int limit) {
        return Math.max(1, Math.min(5, limit));
    }

    @PostMapping("/backfill")
    public ResponseEntity<?> backfill(@RequestParam(defaultValue = "5") int limit,
                                      @RequestParam(required = false) String after) {
        int n = clampLimit(limit);
        if (!client.isHealthy()) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("error", "analysis service unavailable");
            err.put("remaining", repository.countUnanalyzedSongs());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(err);
        }
        List<Song> songs = repository.getUnanalyzedSongs(n, after);
        int analyzed = 0;
        List<String> failedIds = new ArrayList<>();
        String last = null;
        for (Song s : songs) {
            last = s.getId();
            if (service.analyzeAndStore(s.getId())) analyzed++; else failedIds.add(s.getId());
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("processed", songs.size());
        out.put("analyzed", analyzed);
        out.put("failed", failedIds.size());
        out.put("failedIds", failedIds);
        out.put("nextAfter", last);
        out.put("remaining", repository.countUnanalyzedSongs());
        return ResponseEntity.ok(out);
    }
}
