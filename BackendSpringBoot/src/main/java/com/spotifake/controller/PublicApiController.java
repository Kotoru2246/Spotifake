package com.spotifake.controller;

import com.spotifake.model.Advertisement;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Public settings, announcements and ads used by the web player (no login required). */
@RestController
@RequestMapping("/api/public")
public class PublicApiController {

    private final SpotifakeRepository repository;

    public PublicApiController(SpotifakeRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getPublicSettings() {
        return ResponseEntity.ok(repository.getPublicSettingsMap());
    }

    @GetMapping("/announcements")
    public ResponseEntity<?> getPublicAnnouncements(@RequestParam(required = false, defaultValue = "all") String role) {
        return ResponseEntity.ok(repository.getActiveAnnouncements(role));
    }

    @GetMapping("/ads/stream")
    public ResponseEntity<?> getStreamingAd() {
        List<Advertisement> audioAds = repository.getActiveAdvertisements("audio");
        if (audioAds.isEmpty()) {
            audioAds = repository.getActiveAdvertisements("all");
        }
        if (!audioAds.isEmpty()) {
            Advertisement ad = audioAds.get(0);
            repository.recordAdImpression(ad.getId());
            return ResponseEntity.ok(ad);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/ads/click/{id}")
    public ResponseEntity<?> recordAdClick(@PathVariable int id) {
        repository.recordAdClick(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }
}
