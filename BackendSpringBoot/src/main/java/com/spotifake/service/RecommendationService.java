package com.spotifake.service;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationService {

    private final SpotifakeRepository repository;

    private static final int NUM_FEATURES = 6;
    private static final double WEIGHT_CAP = 3.0;
    private static final double UNANALYZED_VEC_SCORE = 0.15;

    private Random random = new Random();

    public RecommendationService(SpotifakeRepository repository) {
        this.repository = repository;
    }

    /** Test hook: makes the jitter term deterministic. */
    void setRandom(Random random) {
        this.random = random;
    }

    private static class ScoredSong {
        String id;
        double sim;
        ScoredSong(String id, double sim) { this.id = id; this.sim = sim; }
    }

    private static class Scored {
        final Song song;
        final Double dist; // null when unanalyzed
        final double meta;
        Scored(Song song, Double dist, double meta) { this.song = song; this.dist = dist; this.meta = meta; }
    }

    /** A song counts as analyzed when at least one audio feature is non-zero. */
    public static boolean isAnalyzed(Song s) {
        return s.getTempo() != 0 || s.getEnergy() != 0 || s.getDanceability() != 0
                || s.getValence() != 0 || s.getAcousticness() != 0 || s.getInstrumentalness() != 0;
    }

    private static double[] rawFeatures(Song s) {
        return new double[]{
                s.getTempo(), s.getEnergy(), s.getDanceability(),
                s.getValence(), s.getAcousticness(), s.getInstrumentalness()
        };
    }

    /** Per-feature mean/std over analyzed songs of a pool; maps songs to clamped z-vectors. */
    private static class FeatureSpace {
        final double[] mean = new double[NUM_FEATURES];
        final double[] std = new double[NUM_FEATURES];

        FeatureSpace(Collection<Song> pool) {
            List<Song> analyzed = new ArrayList<>();
            for (Song s : pool) if (isAnalyzed(s)) analyzed.add(s);
            int n = analyzed.size();
            if (n == 0) return;
            for (Song s : analyzed) {
                double[] r = rawFeatures(s);
                for (int j = 0; j < NUM_FEATURES; j++) mean[j] += r[j] / n;
            }
            double[] var = new double[NUM_FEATURES];
            for (Song s : analyzed) {
                double[] r = rawFeatures(s);
                for (int j = 0; j < NUM_FEATURES; j++) {
                    double diff = r[j] - mean[j];
                    var[j] += diff * diff / n;
                }
            }
            for (int j = 0; j < NUM_FEATURES; j++) std[j] = Math.sqrt(var[j]);
        }

        double[] z(Song s) {
            double[] r = rawFeatures(s);
            double[] out = new double[NUM_FEATURES];
            for (int j = 0; j < NUM_FEATURES; j++) {
                out[j] = std[j] < 1e-6 ? 0 : Math.max(-3.0, Math.min(3.0, (r[j] - mean[j]) / std[j]));
            }
            return out;
        }
    }

    /** Seed-driven weights: features the seeds agree on count more; mean 1, each at most 3. */
    static double[] computeWeights(List<double[]> seedZ) {
        double[] w = new double[NUM_FEATURES];
        Arrays.fill(w, 1.0);
        int n = seedZ.size();
        if (n <= 1) return w;
        for (int j = 0; j < NUM_FEATURES; j++) {
            double m = 0;
            for (double[] z : seedZ) m += z[j] / n;
            double v = 0;
            for (double[] z : seedZ) v += (z[j] - m) * (z[j] - m) / n;
            w[j] = 1.0 / (v + 0.25);
        }
        for (int iter = 0; iter < 20; iter++) {
            double sum = 0;
            for (double x : w) sum += x;
            double mean = sum / NUM_FEATURES;
            boolean capped = false;
            for (int j = 0; j < NUM_FEATURES; j++) {
                w[j] /= mean;
                if (w[j] > WEIGHT_CAP) { w[j] = WEIGHT_CAP; capped = true; }
            }
            if (!capped) break;
        }
        for (int j = 0; j < NUM_FEATURES; j++) w[j] = Math.min(w[j], WEIGHT_CAP);
        return w;
    }

    private static double weightedDistance(double[] a, double[] b, double[] w) {
        double sum = 0;
        for (int j = 0; j < NUM_FEATURES; j++) {
            double diff = a[j] - b[j];
            sum += w[j] * diff * diff;
        }
        return Math.sqrt(sum / NUM_FEATURES);
    }

    private static Set<String> tokens(String csv) {
        Set<String> out = new HashSet<>();
        if (csv == null) return out;
        for (String part : csv.split(",")) {
            String t = part.trim().toLowerCase();
            if (!t.isEmpty() && !t.equals("analyzing...") && !t.equals("unknown")) out.add(t);
        }
        return out;
    }

    private static boolean overlaps(Set<String> a, Set<String> b) {
        for (String x : a) if (b.contains(x)) return true;
        return false;
    }

    /** How alike each candidate sounds to the seeds, 0 to 1; unanalyzed candidates are left out. */
    static Map<String, Double> soundSimilarity(List<Song> seeds, List<Song> candidates) {
        Map<String, Double> out = new HashMap<>();
        List<Song> analyzedSeeds = new ArrayList<>();
        for (Song s : seeds) if (isAnalyzed(s)) analyzedSeeds.add(s);
        if (analyzedSeeds.isEmpty()) return out;
        List<Song> pool = new ArrayList<>(seeds);
        pool.addAll(candidates);
        FeatureSpace space = new FeatureSpace(pool);
        List<double[]> seedZ = new ArrayList<>();
        for (Song s : analyzedSeeds) seedZ.add(space.z(s));
        double[] weights = computeWeights(seedZ);
        double[] centroid = new double[NUM_FEATURES];
        for (double[] z : seedZ) for (int j = 0; j < NUM_FEATURES; j++) centroid[j] += z[j] / seedZ.size();
        for (Song c : candidates) {
            if (isAnalyzed(c)) out.put(c.getId(), Math.exp(-weightedDistance(space.z(c), centroid, weights)));
        }
        return out;
    }

    public List<String> getSmartShuffle(List<Song> seedSongs, List<Song> candidateSongs, int nRecommendations) {
        return getSmartShuffle(seedSongs, candidateSongs, nRecommendations, Map.of());
    }

    /**
     * Same rules as the daily mixes: only the first (current) seed's language, then genre, shared
     * listening sittings, sound and artist, in that order of importance.
     *
     * @param together how many of the listener's sittings each song shared with a seed
     */
    public List<String> getSmartShuffle(List<Song> seedSongs, List<Song> candidateSongs, int nRecommendations,
                                        Map<String, Integer> together) {
        if (candidateSongs == null || candidateSongs.isEmpty() || seedSongs == null || seedSongs.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> seedGenres = new HashSet<>();
        Set<String> seedArtists = new HashSet<>();
        Set<String> seedMoods = new HashSet<>();
        List<Song> analyzedSeeds = new ArrayList<>();
        for (Song s : seedSongs) {
            seedGenres.addAll(tokens(s.getGenre()));
            seedArtists.addAll(DailyMixService.people(s));
            seedMoods.addAll(tokens(s.getMood()));
            if (isAnalyzed(s)) analyzedSeeds.add(s);
        }

        boolean useVector = !analyzedSeeds.isEmpty();
        FeatureSpace space = null;
        double[] weights = null;
        double[] centroid = null;
        if (useVector) {
            List<Song> pool = new ArrayList<>(seedSongs);
            pool.addAll(candidateSongs);
            space = new FeatureSpace(pool);
            List<double[]> seedZ = new ArrayList<>();
            for (Song s : analyzedSeeds) seedZ.add(space.z(s));
            weights = computeWeights(seedZ);
            centroid = new double[NUM_FEATURES];
            for (double[] z : seedZ) for (int j = 0; j < NUM_FEATURES; j++) centroid[j] += z[j] / seedZ.size();
        }

        String language = seedSongs.get(0).getLanguage();
        boolean seedsLive = seedSongs.stream().anyMatch(RecommendationService::isLiveOrBacking);
        int mostTogether = together.values().stream().mapToInt(Integer::intValue).max().orElse(1);

        List<ScoredSong> scored = new ArrayList<>();
        Map<String, Song> byId = new HashMap<>();
        for (Song c : candidateSongs) {
            if (language != null && !language.isBlank() && !language.equals(c.getLanguage())) continue;
            if (!seedsLive && !together.containsKey(c.getId()) && isLiveOrBacking(c)) continue;
            double score = 0;
            if (overlaps(tokens(c.getGenre()), seedGenres)) score += 0.40;
            score += 0.30 * together.getOrDefault(c.getId(), 0) / mostTogether;
            if (useVector) {
                score += 0.20 * (isAnalyzed(c)
                        ? Math.exp(-weightedDistance(space.z(c), centroid, weights))
                        : UNANALYZED_VEC_SCORE);
            }
            if (!Collections.disjoint(DailyMixService.people(c), seedArtists)) score += 0.10;
            if (overlaps(tokens(c.getMood()), seedMoods)) score += 0.02;
            score += 0.03 * random.nextDouble();
            scored.add(new ScoredSong(c.getId(), score));
            byId.put(c.getId(), c);
        }
        scored.sort((a, b) -> Double.compare(b.sim, a.sim));

        // No second version of a seed or of an earlier pick, and no single artist taking over.
        int wanted = Math.max(nRecommendations, 0);
        int perArtist = Math.max(2, wanted / 3);
        Set<String> titles = new HashSet<>();
        for (Song s : seedSongs) titles.add(DailyMixService.titleKey(s));
        Map<String, Integer> artistCount = new HashMap<>();
        Set<String> picked = new HashSet<>();
        for (int cap : new int[]{perArtist, wanted}) {
            for (ScoredSong sc : scored) {
                if (picked.size() >= wanted) break;
                Song c = byId.get(sc.id);
                String artist = DailyMixService.artist(c);
                if (picked.contains(sc.id) || artistCount.getOrDefault(artist, 0) >= cap
                        || !titles.add(DailyMixService.titleKey(c))) continue;
                artistCount.merge(artist, 1, Integer::sum);
                picked.add(sc.id);
            }
        }
        // Best match first, but not the same artist twice in a row while another is waiting.
        List<String> remaining = new ArrayList<>();
        for (ScoredSong sc : scored) if (picked.contains(sc.id)) remaining.add(sc.id);
        List<String> result = new ArrayList<>();
        String previous = DailyMixService.artist(seedSongs.get(0));
        while (!remaining.isEmpty()) {
            String last = previous;
            String next = remaining.stream()
                    .filter(id -> !DailyMixService.artist(byId.get(id)).equals(last))
                    .findFirst().orElse(remaining.get(0));
            remaining.remove(next);
            result.add(next);
            previous = DailyMixService.artist(byId.get(next));
        }
        return result;
    }

    private static boolean isLiveOrBacking(Song s) {
        return DailyMixService.LIVE_OR_BACKING
                .matcher(s.getTitle() + " | " + Objects.toString(s.getAlbum(), "")).find();
    }

    public List<Map<String, Object>> getHybridRecommendations(Song seedSong, List<Song> allSongs, int limit) {
        if (seedSong == null || allSongs == null) return Collections.emptyList();
        Set<String> seedGenres = tokens(seedSong.getGenre());
        String seedArtist = seedSong.getArtist() == null ? null : seedSong.getArtist().toLowerCase().trim();
        boolean seedAnalyzed = isAnalyzed(seedSong);
        FeatureSpace space = null;
        double[] seedZ = null;
        double[] ones = new double[NUM_FEATURES];
        Arrays.fill(ones, 1.0);
        if (seedAnalyzed) {
            List<Song> pool = new ArrayList<>(allSongs);
            pool.add(seedSong);
            space = new FeatureSpace(pool);
            seedZ = space.z(seedSong);
        }

        List<Scored> list = new ArrayList<>();
        for (Song s : allSongs) {
            if (s.getId().equals(seedSong.getId())) continue;
            double meta = 0;
            if (overlaps(tokens(s.getGenre()), seedGenres)) meta += 0.6;
            if (seedArtist != null && s.getArtist() != null && seedArtist.equals(s.getArtist().toLowerCase().trim())) meta += 0.4;
            Double dist = (seedAnalyzed && isAnalyzed(s)) ? weightedDistance(seedZ, space.z(s), ones) : null;
            list.add(new Scored(s, dist, meta));
        }

        list.sort((a, b) -> {
            if (a.dist != null && b.dist != null) return Double.compare(a.dist, b.dist);
            if (a.dist != null) return -1;
            if (b.dist != null) return 1;
            return Double.compare(b.meta, a.meta);
        });
        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < Math.min(Math.max(limit, 0), list.size()); i++) {
            Scored item = list.get(i);
            Map<String, Object> map = new HashMap<>();
            map.put("id", item.song.getId());
            map.put("title", item.song.getTitle());
            map.put("artist", item.song.getArtist());
            map.put("genre", item.song.getGenre());
            map.put("mood", item.song.getMood());
            map.put("source", "upload");
            map.put("similarity_distance", item.dist == null ? null : Math.round(item.dist * 10000.0) / 10000.0);
            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getKnnProjection(List<Song> songs, String seedId, int kNeighbors) {
        Map<String, Object> response = new HashMap<>();
        List<Song> analyzed = new ArrayList<>();
        if (songs != null) for (Song s : songs) if (isAnalyzed(s)) analyzed.add(s);
        if (analyzed.size() < 5) {
            response.put("points", new ArrayList<>());
            response.put("vibe_x", 0);
            response.put("vibe_y", 0);
            response.put("k_neighbors", 0);
            return response;
        }
        songs = analyzed;

        int n = songs.size();
        int d = NUM_FEATURES;
        FeatureSpace space = new FeatureSpace(songs);
        double[][] vectors = new double[n][d];
        for (int i = 0; i < n; i++) vectors[i] = space.z(songs.get(i));

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

        int seedIdx = -1;
        if (seedId != null) {
            for (int i = 0; i < n; i++) {
                if (songs.get(i).getId().equals(seedId)) {
                    seedIdx = i;
                    break;
                }
            }
        }

        Set<Integer> neighborIndices = new HashSet<>();
        if (seedIdx >= 0) {
            List<double[]> dists = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if (i == seedIdx) continue;
                double sum = 0;
                for (int j = 0; j < d; j++) {
                    double diff = vectors[seedIdx][j] - vectors[i][j];
                    sum += diff * diff;
                }
                dists.add(new double[]{i, Math.sqrt(sum)});
            }
            dists.sort((a, b) -> Double.compare(a[1], b[1]));
            int k = Math.min(Math.max(kNeighbors, 0), dists.size());
            for (int i = 0; i < k; i++) neighborIndices.add((int) dists.get(i)[0]);
        }
        int kCount = neighborIndices.size();

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
        response.put("vibe_x", seedIdx >= 0 ? Math.round(pca2d[seedIdx][0] * 1000.0) / 1000.0 : 0);
        response.put("vibe_y", seedIdx >= 0 ? Math.round(pca2d[seedIdx][1] * 1000.0) / 1000.0 : 0);
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
