package com.spotifake.controller;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import com.spotifake.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final SpotifakeRepository repository;
    private final RecommendationService recommendationService;

    private final com.spotifake.service.DailyMixService dailyMixService;

    public RecommendationController(SpotifakeRepository repository, RecommendationService recommendationService,
                                    com.spotifake.service.DailyMixService dailyMixService) {
        this.repository = repository;
        this.recommendationService = recommendationService;
        this.dailyMixService = dailyMixService;
    }

    /** Today's mixes for the signed-in user (guests share one). */
    @GetMapping("/daily-mixes")
    public Map<String, Object> dailyMixes(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.spotifake.model.User user) {
        String userId = user != null ? user.getId() : "guest";
        return Map.of("date", java.time.LocalDate.now().toString(), "mixes", dailyMixService.mixesFor(userId));
    }

    @PostMapping("/smart-shuffle")
    public ResponseEntity<?> smartShuffle(
            @RequestBody(required = false) Map<String, Object> body,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.spotifake.model.User user) {
        if (body == null) body = Collections.emptyMap();
        Set<String> seedSet = new LinkedHashSet<>();
        for (String key : new String[]{"seed_track_ids", "playlist_song_ids"}) {
            if (body.get(key) instanceof List<?> raw) {
                for (Object o : raw) if (o != null && !o.toString().isBlank()) seedSet.add(o.toString().trim());
            }
            if (!seedSet.isEmpty()) break;
        }
        if (seedSet.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "seed_track_ids required"));
        }
        int count = 5;
        if (body.get("n_recommendations") instanceof Number nRec) count = nRec.intValue();
        count = Math.max(1, Math.min(500, count)); // a third of a long playlist

        List<Song> seedSongs = new ArrayList<>();
        List<Song> candidateSongs = new ArrayList<>();
        for (Song s : repository.getAllSongs()) {
            if (s.isDeleted()) continue;
            if (seedSet.contains(s.getId())) {
                seedSongs.add(s);
            } else if (!s.isHidden()) {
                candidateSongs.add(s);
            }
        }
        if (seedSongs.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "no known seed_track_ids"));
        }

        // Songs already in the playlist, or offered before, are not suggested (nor other releases of them).
        if (body.get("exclude_track_ids") instanceof List<?> raw && !raw.isEmpty()) {
            Set<String> excluded = new HashSet<>();
            for (Object o : raw) if (o != null) excluded.add(o.toString().trim());
            Set<String> excludedTitles = new HashSet<>();
            for (Song s : candidateSongs) {
                if (excluded.contains(s.getId())) excludedTitles.add(com.spotifake.service.DailyMixService.titleKey(s));
            }
            candidateSongs.removeIf(s -> excluded.contains(s.getId())
                    || excludedTitles.contains(com.spotifake.service.DailyMixService.titleKey(s)));
        }

        // The player sends the current song first; its language decides.
        List<String> order = new ArrayList<>(seedSet);
        seedSongs.sort(Comparator.comparingInt(s -> order.indexOf(s.getId())));
        List<Song> everything = new ArrayList<>(seedSongs);
        everything.addAll(candidateSongs);
        Map<String, Integer> together = dailyMixService.playedTogether(
                user != null ? user.getId() : "guest", everything, seedSet);

        List<String> recIds = recommendationService.getSmartShuffle(seedSongs, candidateSongs, count, together);
        List<Song> recommended = repository.getSongsByIds(recIds);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Song s : recommended) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("title", s.getTitle());
            map.put("displayName", s.getTitle());
            map.put("artist", s.getArtist());
            map.put("album", s.getAlbum());
            map.put("genre", s.getGenre());
            map.put("mood", s.getMood());
            map.put("fileName", s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3");
            map.put("durationSeconds", Math.round((s.getDurationMs() != 0 ? s.getDurationMs() : 180000) / 1000.0));
            map.put("coverUrl", "/api/music/cover/" + s.getId());
            result.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("recommendations", result);
        response.put("song_ids", recIds);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/knn-projection")
    public Map<String, Object> knnProjection(@RequestParam(value = "seed_id", required = false) String seedId,
                                             @RequestParam(value = "k_neighbors", defaultValue = "5") int kNeighbors) {
        List<Song> allSongs = new ArrayList<>();
        for (Song s : repository.getAllSongs()) if (!s.isDeleted() && !s.isHidden()) allSongs.add(s);
        return recommendationService.getKnnProjection(allSongs, seedId, kNeighbors);
    }

    @GetMapping("/hybrid")
    public ResponseEntity<?> hybrid(@RequestParam("seed_id") String seedId,
                                    @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Song seed = repository.getSongById(seedId);
        if (seed == null || seed.isDeleted()) {
            return ResponseEntity.status(404).body(Map.of("error", "seed song not found"));
        }
        List<Song> allSongs = new ArrayList<>();
        for (Song s : repository.getAllSongs()) if (!s.isDeleted() && !s.isHidden()) allSongs.add(s);
        List<Map<String, Object>> recs = recommendationService.getHybridRecommendations(seed, allSongs, limit);
        return ResponseEntity.ok(Map.of("recommendations", recs));
    }
}
