package com.spotifake.controller;

import com.spotifake.service.DownloaderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** spotdl downloader. ADMIN only (see SecurityConfig). */
@RestController
@RequestMapping("/api/downloader")
public class DownloaderController {

    private final DownloaderService downloaderService;

    public DownloaderController(DownloaderService downloaderService) {
        this.downloaderService = downloaderService;
    }

    @PostMapping({"/start", "/download" /* legacy alias for spotifake_mobile */})
    public ResponseEntity<?> startDownload(@RequestBody(required = false) Map<String, String> body) {
        String query = body != null ? body.get("query") : null;
        String error = DownloaderService.validateQuery(query);
        if (error != null) {
            return ResponseEntity.badRequest().body(Map.of("error", error));
        }
        return ResponseEntity.ok(downloaderService.startJob(query));
    }

    @GetMapping("/jobs")
    public List<Map<String, Object>> getJobs() {
        return downloaderService.listJobs();
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJob(@PathVariable String jobId) {
        Map<String, Object> job = downloaderService.getJob(jobId);
        if (job == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(job);
    }
}
