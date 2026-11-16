package com.spotifake.service;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationService {

    private final SpotifakeRepository repository;

    public RecommendationService(SpotifakeRepository repository) {
        this.repository = repository;
    }

    private static class ScoredSong {
        String id;
        double sim;
        ScoredSong(String id, double sim) { this.id = id; this.sim = sim; }
    }

    private static class Scored {
        Song song;
        double dist;
        Scored(Song song, double dist) { this.song = song; this.dist = dist; }
    }

    private static class CandScore {
        int index;
        double sim;
        CandScore(int index, double sim) { this.index = index; this.sim = sim; }
    }

    private double[] featureVector(Song s) {
        double normalizedTempo = Math.min(1.0, Math.max(0.0, (s.getTempo() - 50.0) / 150.0));
        return new double[]{
                normalizedTempo,
                s.getEnergy(),
                s.getDanceability(),
                s.getValence(),
                s.getAcousticness(),
                s.getInstrumentalness()
        };
    }

    private double dotProduct(double[] a, double[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) sum += a[i] * b[i];
        return sum;
    }

    private double vectorNorm(double[] a) {
        double sum = 0;
        for (double v : a) sum += v * v;
        return Math.sqrt(sum) > 1e-9 ? Math.sqrt(sum) : 1e-9;
    }

    private double cosineSimilarity(double[] a, double[] b) {
        return dotProduct(a, b) / (vectorNorm(a) * vectorNorm(b));
    }

    private double euclideanDistance(double[] a, double[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) {
            double diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    public List<String> getSmartShuffle(List<Song> seedSongs, List<Song> candidateSongs, int nRecommendations) {
        if (candidateSongs == null || candidateSongs.isEmpty()) {
            return Collections.emptyList();
        }
        if (seedSongs == null || seedSongs.isEmpty()) {
            List<String> fallback = new ArrayList<>();
            for (int i = 0; i < Math.min(nRecommendations, candidateSongs.size()); i++) {
                fallback.add(candidateSongs.get(i).getId());
            }
            return fallback;
        }

        Set<String> seedGenres = new HashSet<>();
        Set<String> seedArtists = new HashSet<>();
        Set<String> seedMoods = new HashSet<>();
        for (Song s : seedSongs) {
            if (s.getGenre() != null && !s.getGenre().isBlank()) seedGenres.add(s.getGenre().toLowerCase().trim());
            if (s.getArtist() != null && !s.getArtist().isBlank()) seedArtists.add(s.getArtist().toLowerCase().trim());
            if (s.getMood() != null && !s.getMood().isBlank()) seedMoods.add(s.getMood().toLowerCase().trim());
        }

        int numFeatures = 6;
        int numSeeds = seedSongs.size();
        List<double[]> playlistVectors = new ArrayList<>();
        for (Song s : seedSongs) playlistVectors.add(featureVector(s));

        double[] means = new double[numFeatures];
        double[] variances = new double[numFeatures];

        for (int j = 0; j < numFeatures; j++) {
            for (int i = 0; i < numSeeds; i++) means[j] += playlistVectors.get(i)[j];
            means[j] /= numSeeds;
            for (int i = 0; i < numSeeds; i++) {
                double diff = playlistVectors.get(i)[j] - means[j];
                variances[j] += diff * diff;
            }
            variances[j] /= numSeeds;
        }

        double epsilon = 1e-5;
        double[] rawWeights = new double[numFeatures];
        double sumWeights = 0;
        for (int j = 0; j < numFeatures; j++) {
            rawWeights[j] = 1.0 / (variances[j] + epsilon);
            sumWeights += rawWeights[j];
        }

        double[] weights = new double[numFeatures];
        for (int j = 0; j < numFeatures; j++) {
            weights[j] = (rawWeights[j] / (sumWeights > 0 ? sumWeights : 1.0)) * numFeatures;
        }

        double[] vibe = new double[numFeatures];
        for (int j = 0; j < numFeatures; j++) {
            for (int i = 0; i < numSeeds; i++) {
                vibe[j] += playlistVectors.get(i)[j] * weights[j];
            }
            vibe[j] /= numSeeds;
        }

        Random rand = new Random();
        List<ScoredSong> scored = new ArrayList<>();
        for (Song candidate : candidateSongs) {
            double[] v = featureVector(candidate);
            double[] weightedV = new double[numFeatures];
            for (int j = 0; j < numFeatures; j++) weightedV[j] = v[j] * weights[j];
            double sim = cosineSimilarity(vibe, weightedV);
            if (Double.isNaN(sim) || Double.isInfinite(sim)) {
                sim = 0.0;
            }

            if (candidate.getGenre() != null && seedGenres.contains(candidate.getGenre().toLowerCase().trim())) {
                sim += 0.35;
            }
            if (candidate.getArtist() != null && seedArtists.contains(candidate.getArtist().toLowerCase().trim())) {
                sim += 0.25;
            }
            if (candidate.getMood() != null && seedMoods.contains(candidate.getMood().toLowerCase().trim())) {
                sim += 0.15;
            }
            sim += rand.nextDouble() * 0.05;

            scored.add(new ScoredSong(candidate.getId(), sim));
        }

        scored.sort((a, b) -> Double.compare(b.sim, a.sim));
        List<String> result = new ArrayList<>();
        for (int i = 0; i < Math.min(nRecommendations, scored.size()); i++) {
            result.add(scored.get(i).id);
        }
        return result;
    }

    public List<Map<String, Object>> getHybridRecommendations(Song seedSong, List<Song> allSongs, int limit) {
        if (seedSong == null || allSongs == null) return Collections.emptyList();
        double[] seedVec = featureVector(seedSong);

        List<Scored> list = new ArrayList<>();
        for (Song s : allSongs) {
            if (!s.getId().equals(seedSong.getId())) {
                double dist = euclideanDistance(seedVec, featureVector(s));
                list.add(new Scored(s, dist));
            }
        }

        list.sort(Comparator.comparingDouble(a -> a.dist));
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, list.size()); i++) {
            Scored item = list.get(i);
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.song.getId());
            map.put("title", item.song.getTitle());
            map.put("artist", item.song.getArtist());
            map.put("genre", item.song.getGenre());
            map.put("mood", item.song.getMood());
            map.put("source", "upload");
            map.put("similarity_distance", Math.round(item.dist * 10000.0) / 10000.0);
            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getKnnProjection(List<Song> songs, String seedId, int kNeighbors) {
        Map<String, Object> response = new HashMap<>();
        if (songs == null || songs.size() < 5) {
            List<Map<String, Object>> demoPoints = new ArrayList<>();
            String[] genresList = {"Pop", "Rock", "Electronic", "Hip-Hop", "Indie", "Jazz"};

            for (int i = 0; i < 3; i++) {
                Map<String, Object> p = new HashMap<>();
                p.put("id", "seed-" + (i + 1));
                p.put("title", "Seed Track " + (i + 1));
                p.put("artist", "Demo Artist");
                p.put("genre", genresList[i % genresList.length]);
                p.put("x", Math.round(((i - 1) * 1.2 + 0.1) * 1000.0) / 1000.0);
                p.put("y", Math.round(((i - 1) * 0.5 - 0.2) * 1000.0) / 1000.0);
                p.put("type", "seed");
                p.put("energy", 0.75 + (i * 0.05));
                p.put("valence", 0.65 - (i * 0.05));
                demoPoints.add(p);
            }

            Set<Integer> neighborSet = new HashSet<>(Arrays.asList(0, 1, 2, 3, 4).subList(0, Math.min(kNeighbors, 5)));
            for (int idx = 0; idx < 20; idx++) {
                boolean isNeighbor = neighborSet.contains(idx);
                double angle = (idx / 20.0) * Math.PI * 2;
                double radius = isNeighbor ? 0.8 + idx * 0.2 : 2.5 + (idx % 5) * 0.8;
                Map<String, Object> p = new HashMap<>();
                p.put("id", "song-" + (idx + 1));
                p.put("title", "Acoustic Track " + (idx + 1));
                p.put("artist", "Artist " + ((idx % 5) + 1));
                p.put("genre", genresList[idx % genresList.length]);
                p.put("x", Math.round((Math.cos(angle) * radius) * 1000.0) / 1000.0);
                p.put("y", Math.round((Math.sin(angle) * radius) * 1000.0) / 1000.0);
                p.put("type", isNeighbor ? "neighbor" : "candidate");
                p.put("energy", Math.round((0.2 + (idx % 7) * 0.1) * 100.0) / 100.0);
                p.put("valence", Math.round((0.3 + (idx % 6) * 0.1) * 100.0) / 100.0);
                demoPoints.add(p);
            }

            response.put("points", demoPoints);
            response.put("vibe_x", 0.1);
            response.put("vibe_y", -0.1);
            response.put("k_neighbors", Math.min(kNeighbors, 5));
            return response;
        }

        int n = songs.size();
        int d = 6;
        double[][] vectors = new double[n][d];
        for (int i = 0; i < n; i++) vectors[i] = featureVector(songs.get(i));

        double[] mean = new double[d];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < d; j++) mean[j] += vectors[i][j] / n;
        }

        double[][] centered = new double[n][d];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < d; j++) centered[i][j] = vectors[i][j] - mean[j];
        }

        double[][] cov = new double[d][d];
        for (int i = 0; i < d; i++) {
            for (int j = 0; j < d; j++) {
                double sum = 0;
                for (int k = 0; k < n; k++) sum += centered[k][i] * centered[k][j];
                cov[i][j] = sum / (n - 1);
            }
        }

        double[] v1 = powerIteration(cov, d, 40);
        double lambda1 = 0;
        for (int i = 0; i < d; i++) {
            for (int j = 0; j < d; j++) lambda1 += v1[i] * cov[i][j] * v1[j];
        }

        double[][] cov2 = new double[d][d];
        for (int i = 0; i < d; i++) {
            for (int j = 0; j < d; j++) cov2[i][j] = cov[i][j] - lambda1 * v1[i] * v1[j];
        }
        double[] v2 = powerIteration(cov2, d, 40);

        double[][] pca2d = new double[n][2];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < d; j++) {
                pca2d[i][0] += centered[i][j] * v1[j];
                pca2d[i][1] += centered[i][j] * v2[j];
            }
        }

        int seedIdx = 0;
        if (seedId != null) {
            for (int i = 0; i < n; i++) {
                if (songs.get(i).getId().equals(seedId)) {
                    seedIdx = i;
                    break;
                }
            }
        }

        double[] seedVec = vectors[seedIdx];
        List<CandScore> scores = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if (i != seedIdx) {
                scores.add(new CandScore(i, cosineSimilarity(seedVec, vectors[i])));
            }
        }
        scores.sort((a, b) -> Double.compare(b.sim, a.sim));
        int kCount = Math.min(kNeighbors, scores.size());
        Set<Integer> neighborIndices = new HashSet<>();
        for (int i = 0; i < kCount; i++) neighborIndices.add(scores.get(i).index);

        List<Map<String, Object>> points = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            Song s = songs.get(i);
            String type = "candidate";
            if (i == seedIdx) type = "seed";
            else if (neighborIndices.contains(i)) type = "neighbor";

            Map<String, Object> p = new HashMap<>();
            p.put("id", s.getId());
            p.put("title", s.getTitle());
            p.put("artist", s.getArtist());
            p.put("genre", s.getGenre());
            p.put("x", Math.round(pca2d[i][0] * 1000.0) / 1000.0);
            p.put("y", Math.round(pca2d[i][1] * 1000.0) / 1000.0);
            p.put("type", type);
            p.put("energy", Math.round(s.getEnergy() * 100.0) / 100.0);
            p.put("valence", Math.round(s.getValence() * 100.0) / 100.0);
            points.add(p);
        }

        response.put("points", points);
        response.put("vibe_x", Math.round(pca2d[seedIdx][0] * 1000.0) / 1000.0);
        response.put("vibe_y", Math.round(pca2d[seedIdx][1] * 1000.0) / 1000.0);
        response.put("k_neighbors", kCount);
        return response;
    }

    private double[] powerIteration(double[][] A, int d, int numIter) {
        double[] v = new double[d];
        for (int i = 0; i < d; i++) v[i] = Math.sin(i + 1);
        for (int iter = 0; iter < numIter; iter++) {
            double[] next = new double[d];
            for (int i = 0; i < d; i++) {
                for (int j = 0; j < d; j++) next[i] += A[i][j] * v[j];
            }
            double norm = 0;
            for (double val : next) norm += val * val;
            norm = Math.sqrt(norm) > 1e-9 ? Math.sqrt(norm) : 1e-9;
            for (int i = 0; i < d; i++) v[i] = next[i] / norm;
        }
        return v;
    }
}
