package com.spotifake.controller;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import com.spotifake.service.RecommendationService;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping({"/api/recommendations", "/api"})
public class RecommendationController {

    private final SpotifakeRepository repository;
    private final RecommendationService recommendationService;

    public RecommendationController(SpotifakeRepository repository, RecommendationService recommendationService) {
        this.repository = repository;
        this.recommendationService = recommendationService;
    }

    @PostMapping({"/smart-shuffle", "/recommendations/smart-shuffle"})
    public Map<String, Object> smartShuffle(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = Collections.emptyMap();
        @SuppressWarnings("unchecked")
        List<String> seedIds = (List<String>) body.get("seed_track_ids");
        if (seedIds == null || seedIds.isEmpty()) {
            @SuppressWarnings("unchecked")
            List<String> playlistSongIds = (List<String>) body.get("playlist_song_ids");
            seedIds = playlistSongIds;
        }
        Number nRec = (Number) body.get("n_recommendations");
        int count = nRec != null ? nRec.intValue() : 5;

        List<Song> allSongs = repository.getAllSongs();
        List<Song> seedSongs = new ArrayList<>();
        List<Song> candidateSongs = new ArrayList<>();

        Set<String> seedSet = new HashSet<>(seedIds != null ? seedIds : Collections.emptyList());
        for (Song s : allSongs) {
            if (seedSet.contains(s.getId())) {
                seedSongs.add(s);
            } else {
                candidateSongs.add(s);
            }
        }

        if (seedSongs.isEmpty() && !allSongs.isEmpty()) {
            seedSongs.add(allSongs.get(0));
        }
        if (candidateSongs.isEmpty()) {
            candidateSongs.addAll(allSongs);
        }

        List<String> recIds = recommendationService.getSmartShuffle(seedSongs, candidateSongs, count);
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
            map.put("coverUrl", "/api/songs/" + s.getId() + "/cover");
            result.add(map);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("recommendations", result);
        response.put("song_ids", recIds);
        return response;
    }

    @GetMapping({"/knn-projection", "/recommendations/knn-projection"})
    public Map<String, Object> knnProjection(@RequestParam(value = "seed_id", required = false) String seedId,
                                             @RequestParam(value = "k_neighbors", defaultValue = "5") int kNeighbors) {
        List<Song> allSongs = repository.getAllSongs();
        return recommendationService.getKnnProjection(allSongs, seedId, kNeighbors);
    }

    @GetMapping({"/hybrid", "/recommendations/hybrid"})
    public Map<String, Object> hybrid(@RequestParam("seed_id") String seedId,
                                      @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Song seed = repository.getSongById(seedId);
        List<Song> allSongs = repository.getAllSongs();
        List<Map<String, Object>> recs = recommendationService.getHybridRecommendations(seed, allSongs, limit);
        return Map.of("recommendations", recs);
    }
}
