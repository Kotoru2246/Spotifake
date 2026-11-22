package com.spotifake.service;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Runs spotdl downloads (followed by BackendAI/spotifake_importer.py) as background jobs.
 * Jobs are kept in memory, pruned after {@link #FINISHED_JOB_TTL} or beyond {@link #MAX_JOBS}.
 */
@Service
public class DownloaderService {

    public static final int MAX_QUERY_LENGTH = 500;
    static final int MAX_JOBS = 100;
    static final Duration FINISHED_JOB_TTL = Duration.ofHours(24);
    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "open.spotify.com", "music.youtube.com", "youtube.com", "www.youtube.com", "m.youtube.com");
    private static final Set<String> FINISHED = Set.of("COMPLETED", "FAILED");

    private final ExecutorService executor = Executors.newFixedThreadPool(2);
    private final ScheduledExecutorService watchdog = Executors.newSingleThreadScheduledExecutor();
    private final Map<String, Map<String, Object>> jobs = new ConcurrentHashMap<>();

    private final String projectRootSetting;
    private final String pythonSetting;
    private final Duration timeout;

    public DownloaderService(@Value("${app.downloader.project-root:..}") String projectRoot,
                             @Value("${app.downloader.python:}") String python,
                             @Value("${app.downloader.timeout-minutes:30}") long timeoutMinutes) {
        this.projectRootSetting = projectRoot;
        this.pythonSetting = python;
        this.timeout = Duration.ofMinutes(Math.max(1, timeoutMinutes));
    }

    /** Returns an error message if the query must be rejected, otherwise null. */
    public static String validateQuery(String query) {
        if (query == null || query.trim().isEmpty()) {
            return "Query or Spotify URL is required";
        }
        String q = query.trim();
        if (q.length() > MAX_QUERY_LENGTH) {
            return "Query is too long (max " + MAX_QUERY_LENGTH + " characters)";
        }
        if (q.startsWith("-")) {
            return "Query must not start with '-'";
        }
        for (int i = 0; i < q.length(); i++) {
            if (Character.isISOControl(q.charAt(i))) {
                return "Query must not contain control characters";
            }
        }
        boolean looksLikeUrl = q.contains("://") || q.toLowerCase(Locale.ROOT).startsWith("www.");
        if (looksLikeUrl) {
            try {
                URI uri = URI.create(q.contains("://") ? q : "https://" + q);
                String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
                String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
                if (!(scheme.equals("https") || scheme.equals("http")) || !ALLOWED_HOSTS.contains(host)) {
                    return "Only open.spotify.com, music.youtube.com and youtube.com URLs are allowed";
                }
            } catch (IllegalArgumentException e) {
                return "Invalid URL";
            }
        }
        return null;
    }

    public Map<String, Object> startJob(String query) {
        String q = query.trim();
        String jobId = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        Instant now = Instant.now();

        Map<String, Object> job = new ConcurrentHashMap<>();
        job.put("id", jobId);
        job.put("query", q);
        job.put("status", "QUEUED");
        job.put("progress", "Queued for download...");
        job.put("created_at", now.toString());
        job.put("created_at_ms", now.toEpochMilli());
        pruneJobs();
        jobs.put(jobId, job);

        executor.submit(() -> runDownloadJob(job, q));
        return job;
    }

    public List<Map<String, Object>> listJobs() {
        pruneJobs();
        List<Map<String, Object>> list = new ArrayList<>(jobs.values());
        list.sort(Comparator.comparingLong(DownloaderService::createdAt).reversed());
        return list;
    }

    public Map<String, Object> getJob(String jobId) {
        return jobs.get(jobId);
    }

    void pruneJobs() {
        long cutoff = Instant.now().minus(FINISHED_JOB_TTL).toEpochMilli();
        jobs.values().removeIf(j -> FINISHED.contains(String.valueOf(j.get("status"))) && createdAt(j) < cutoff);
        if (jobs.size() >= MAX_JOBS) {
            List<Map<String, Object>> finished = new ArrayList<>();
            for (Map<String, Object> j : jobs.values()) {
                if (FINISHED.contains(String.valueOf(j.get("status")))) finished.add(j);
            }
            finished.sort(Comparator.comparingLong(DownloaderService::createdAt));
            for (Map<String, Object> j : finished) {
                if (jobs.size() < MAX_JOBS) break;
                jobs.remove(String.valueOf(j.get("id")));
            }
        }
    }

    private static long createdAt(Map<String, Object> job) {
        Object v = job.get("created_at_ms");
        return v instanceof Number n ? n.longValue() : 0L;
    }

    File projectRoot() throws IOException {
        return new File(projectRootSetting).getCanonicalFile();
    }

    String pythonExecutable(File root) {
        if (pythonSetting != null && !pythonSetting.isBlank()) {
            return pythonSetting;
        }
        File winVenv = new File(root, ".venv/Scripts/python.exe");
        if (winVenv.exists()) return winVenv.getAbsolutePath();
        File unixVenv = new File(root, ".venv/bin/python");
        if (unixVenv.exists()) return unixVenv.getAbsolutePath();
        return "python";
    }

    static List<String> buildSpotdlCommand(String python, String query) {
        // Options first, then the operation, then "--" so the query is never parsed as an option.
        return List.of(
                python, "-u", "-m", "spotdl",
                "--audio", "youtube-music", "youtube",
                "--sponsor-block",
                "--generate-lrc",
                "--format", "m4a",
                "--output", "music/{title} - {artist}.{output-ext}",
                "--overwrite", "force",
                "download",
                "--",
                query);
    }

    private void runDownloadJob(Map<String, Object> job, String query) {
        try {
            job.put("status", "DOWNLOADING");
            job.put("progress", "Searching and downloading audio streams...");

            File root = projectRoot();
            String python = pythonExecutable(root);

            int exit = runProcess(job, buildSpotdlCommand(python, query), root, "spotdl");
            if (exit != 0) {
                return;
            }

            File importerScript = new File(root, "BackendAI/spotifake_importer.py");
            if (importerScript.exists()) {
                job.put("status", "IMPORTING");
                job.put("progress", "Importing downloaded tracks into Spotifake database...");
                exit = runProcess(job, List.of(python, importerScript.getAbsolutePath()), root, "importer");
                if (exit != 0) {
                    return;
                }
            }

            job.put("status", "COMPLETED");
            job.put("progress", "Album successfully imported and ready to play!");
        } catch (Exception e) {
            job.put("status", "FAILED");
            job.put("progress", "Error: " + e.getMessage());
        } finally {
            job.put("finished_at", Instant.now().toString());
        }
    }

    /** Runs a step, streaming its output into the job; marks the job FAILED on non-zero exit or timeout. */
    private int runProcess(Map<String, Object> job, List<String> command, File dir, String step)
            throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(dir);
        pb.redirectErrorStream(true);
        Process p = pb.start();

        AtomicBoolean timedOut = new AtomicBoolean(false);
        ScheduledFuture<?> kill = watchdog.schedule(() -> {
            if (p.isAlive()) {
                timedOut.set(true);
                p.descendants().forEach(ProcessHandle::destroyForcibly);
                p.destroyForcibly();
            }
        }, timeout.toMillis(), TimeUnit.MILLISECONDS);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty()) job.put("progress", line);
            }
        } finally {
            kill.cancel(false);
        }
        int exit = p.waitFor();
        job.put(step + "_exit_code", exit);
        if (timedOut.get()) {
            job.put("status", "FAILED");
            job.put("exit_code", exit);
            job.put("progress", "Error: " + step + " timed out after " + timeout.toMinutes() + " minutes and was stopped");
        } else if (exit != 0) {
            job.put("status", "FAILED");
            job.put("exit_code", exit);
            job.put("progress", "Error: " + step + " exited with code " + exit + " (last output: " + job.get("progress") + ")");
        }
        return timedOut.get() ? -1 : exit;
    }

    @PreDestroy
    void shutdown() {
        executor.shutdownNow();
        watchdog.shutdownNow();
    }
}
