package com.spotifake.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/downloader")
public class DownloaderController {

    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final Map<String, Map<String, Object>> jobs = new ConcurrentHashMap<>();

    @PostMapping({"/start", "/download" /* legacy alias for spotifake_mobile */})
    public ResponseEntity<?> startDownload(@RequestBody Map<String, String> body) {
        String query = body.get("query");
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query or Spotify URL is required"));
        }
        String q = query.trim();
        String jobId = UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        Map<String, Object> job = new ConcurrentHashMap<>();
        job.put("id", jobId);
        job.put("query", q);
        job.put("status", "QUEUED");
        job.put("progress", "Queued for download...");
        job.put("created_at", new Date().toString());
        jobs.put(jobId, job);

        executor.submit(() -> runDownloadJob(jobId, q));
        return ResponseEntity.ok(job);
    }

    @GetMapping("/jobs")
    public List<Map<String, Object>> getJobs() {
        List<Map<String, Object>> list = new ArrayList<>(jobs.values());
        list.sort((a, b) -> b.get("id").toString().compareTo(a.get("id").toString()));
        return list;
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJob(@PathVariable String jobId) {
        Map<String, Object> job = jobs.get(jobId);
        if (job == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(job);
    }

    private void runDownloadJob(String jobId, String query) {
        Map<String, Object> job = jobs.get(jobId);
        if (job == null) return;

        try {
            job.put("status", "DOWNLOADING");
            job.put("progress", "Searching and downloading audio streams...");

            File projectRoot = new File("..").getCanonicalFile();
            File venvPython = new File(projectRoot, ".venv/Scripts/python.exe");
            String pythonPath = venvPython.exists() ? venvPython.getAbsolutePath() : "python";

            List<String> spotdlCmd = List.of(
                pythonPath,
                "-u",
                "-m",
                "spotdl",
                "download",
                query,
                "--audio",
                "youtube-music",
                "youtube",
                "--sponsor-block",
                "--generate-lrc",
                "--format",
                "m4a",
                "--output",
                "music/{title} - {artist}.{output-ext}",
                "--overwrite",
                "force"
            );

            ProcessBuilder pb = new ProcessBuilder(spotdlCmd);
            pb.directory(projectRoot);
            pb.redirectErrorStream(true);
            Process p = pb.start();

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (!line.isEmpty()) {
                        job.put("progress", line);
                    }
                }
            }
            p.waitFor();

            job.put("status", "IMPORTING");
            job.put("progress", "Importing downloaded tracks into Spotifake database...");

            File importerScript = new File(projectRoot, "BackendAI/spotifake_importer.py");
            if (importerScript.exists()) {
                ProcessBuilder impPb = new ProcessBuilder(pythonPath, importerScript.getAbsolutePath());
                impPb.directory(projectRoot);
                impPb.redirectErrorStream(true);
                Process impP = impPb.start();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(impP.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        if (!line.trim().isEmpty()) {
                            job.put("progress", line.trim());
                        }
                    }
                }
                impP.waitFor();
            }

            job.put("status", "COMPLETED");
            job.put("progress", "Album successfully imported and ready to play!");
        } catch (Exception e) {
            job.put("status", "FAILED");
            job.put("progress", "Error: " + e.getMessage());
        }
    }
}
