package com.spotifake.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublisher;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

/** Calls BackendAI POST /internal/analyze. Fail-soft: every failure yields Optional.empty(). */
@Component
public class AudioAnalysisClient {

    private static final Logger log = LoggerFactory.getLogger(AudioAnalysisClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public record AnalysisResult(double tempo, double energy, double danceability, double valence,
                                 double acousticness, double instrumentalness,
                                 Integer key, Integer mode, String genre, String mood) {}

    private final String baseUrl;
    private final String token;
    private final boolean enabled;
    private final Duration readTimeout;
    private final HttpClient http;

    public AudioAnalysisClient(@Value("${spotifake.analysis.url:http://localhost:5000}") String baseUrl,
                               @Value("${spotifake.analysis.token:}") String token,
                               @Value("${spotifake.analysis.enabled:true}") boolean enabled,
                               @Value("${spotifake.analysis.connect-timeout-ms:2000}") long connectTimeoutMs,
                               @Value("${spotifake.analysis.read-timeout-ms:120000}") long readTimeoutMs) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.token = token == null ? "" : token.trim();
        this.enabled = enabled;
        this.readTimeout = Duration.ofMillis(readTimeoutMs);
        this.http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofMillis(connectTimeoutMs)).build();
    }

    public boolean isHealthy() {
        if (!enabled) return false;
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(baseUrl + "/health"))
                    .timeout(Duration.ofSeconds(3)).GET().build();
            return http.send(req, HttpResponse.BodyHandlers.discarding()).statusCode() == 200;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    public Optional<AnalysisResult> analyze(File audio) {
        if (!enabled) {
            log.warn("Audio analysis disabled; skipping {}", audio == null ? null : audio.getName());
            return Optional.empty();
        }
        if (audio == null || !audio.isFile()) return Optional.empty();
        try {
            String boundary = "----spotifake" + UUID.randomUUID().toString().replace("-", "");
            String filename = audio.getName().replace("\"", "").replace("\r", "").replace("\n", "");
            byte[] head = ("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\""
                    + filename + "\"\r\nContent-Type: application/octet-stream\r\n\r\n")
                    .getBytes(StandardCharsets.UTF_8);
            byte[] tail = ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8);
            BodyPublisher body = BodyPublishers.concat(
                    BodyPublishers.ofByteArray(head),
                    BodyPublishers.ofFile(audio.toPath()),
                    BodyPublishers.ofByteArray(tail));

            HttpRequest.Builder rb = HttpRequest.newBuilder(URI.create(baseUrl + "/internal/analyze"))
                    .timeout(readTimeout)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(body);
            if (!token.isEmpty()) rb.header("X-Internal-Token", token);

            HttpResponse<String> resp = http.send(rb.build(), HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() != 200) {
                log.warn("Audio analysis returned HTTP {} for {}", resp.statusCode(), filename);
                return Optional.empty();
            }
            return parse(resp.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Audio analysis interrupted for {}", audio.getName());
            return Optional.empty();
        } catch (IOException e) {
            log.warn("Audio analysis failed for {}: {}", audio.getName(), e.toString());
            return Optional.empty();
        } catch (RuntimeException e) {
            log.warn("Audio analysis error for {}: {}", audio.getName(), e.toString());
            return Optional.empty();
        }
    }

    static Optional<AnalysisResult> parse(String json) {
        try {
            JsonNode root = MAPPER.readTree(json);
            JsonNode f = root == null ? null : root.get("features");
            if (f == null || !f.isObject()) {
                log.warn("Audio analysis response had no features");
                return Optional.empty();
            }
            double tempo = num(f, "tempo"), energy = num(f, "energy"), dance = num(f, "danceability"),
                    valence = num(f, "valence"), acoustic = num(f, "acousticness"),
                    instr = num(f, "instrumentalness");
            if (tempo == 0 && energy == 0 && dance == 0 && valence == 0 && acoustic == 0 && instr == 0) {
                log.warn("Audio analysis returned empty features");
                return Optional.empty();
            }
            Integer key = intOrNull(f, "key");
            Integer mode = intOrNull(f, "mode");
            String genre = titleCaseGenre(text(root, "genre"));
            String mood = text(root, "mood");
            if (mood != null && mood.isBlank()) mood = null;
            return Optional.of(new AnalysisResult(tempo, energy, dance, valence, acoustic, instr, key, mode, genre, mood));
        } catch (IOException | RuntimeException e) {
            log.warn("Audio analysis response unparsable: {}", e.toString());
            return Optional.empty();
        }
    }

    private static double num(JsonNode n, String k) {
        JsonNode v = n.get(k);
        return v != null && v.isNumber() ? v.asDouble() : 0.0;
    }

    private static Integer intOrNull(JsonNode n, String k) {
        JsonNode v = n.get(k);
        return v != null && v.isNumber() ? v.asInt() : null;
    }

    private static String text(JsonNode n, String k) {
        JsonNode v = n.get(k);
        return v != null && v.isTextual() ? v.asText() : null;
    }

    /** "hip-hop" -> "Hip-Hop", "rock, pop" -> "Rock, Pop"; blank -> null. */
    public static String titleCaseGenre(String raw) {
        if (raw == null || raw.isBlank()) return null;
        StringBuilder sb = new StringBuilder();
        boolean up = true;
        for (char c : raw.trim().toCharArray()) {
            if (c == '-' || c == ' ' || c == ',' || c == '/' || c == '&') {
                sb.append(c);
                up = true;
            } else {
                sb.append(up ? Character.toUpperCase(c) : Character.toLowerCase(c));
                up = false;
            }
        }
        return sb.toString();
    }
}
