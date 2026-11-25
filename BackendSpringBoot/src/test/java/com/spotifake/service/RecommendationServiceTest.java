package com.spotifake.service;

import com.spotifake.model.Song;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;

class RecommendationServiceTest {

    private RecommendationService service;

    @BeforeEach
    void setUp() {
        service = new RecommendationService(null);
        service.setRandom(new Random(42) {
            @Override public double nextDouble() { return 0.0; }
        });
    }

    private static Song song(String id, String genre, String artist, double tempo, double energy,
                             double dance, double valence, double acoustic, double instr) {
        Song s = new Song();
        s.setId(id);
        s.setTitle(id);
        s.setGenre(genre);
        s.setArtist(artist);
        s.setTempo(tempo);
        s.setEnergy(energy);
        s.setDanceability(dance);
        s.setValence(valence);
        s.setAcousticness(acoustic);
        s.setInstrumentalness(instr);
        return s;
    }

    private static Song plain(String id, String genre, String artist) {
        return song(id, genre, artist, 0, 0, 0, 0, 0, 0);
    }

    @Test
    void unanalyzedCandidatesGetFlatVectorScore() {
        Song seed = song("seed", "Rock", "A", 120, 0.8, 0.7, 0.6, 0.2, 0.1);
        Song close = song("close", "Jazz", "B", 121, 0.8, 0.7, 0.6, 0.2, 0.1);
        Song far = song("far", "Jazz", "C", 60, 0.1, 0.1, 0.1, 0.9, 0.9);
        Song none = plain("none", "Jazz", "D");
        List<String> ids = service.getSmartShuffle(List.of(seed), List.of(none, far, close), 3);
        // unanalyzed gets the flat 0.15 vector score: below the close analyzed song, above the far one
        assertThat(ids).containsExactly("close", "none", "far");
    }

    @Test
    void unanalyzedSeedFallsBackToGenreArtist() {
        Song seed = plain("seed", "Rock", "Artist1");
        Song genreMatch = song("genre", "rock", "X", 100, 0.5, 0.5, 0.5, 0.5, 0.5);
        Song artistMatch = song("artist", "Pop", "artist1", 100, 0.5, 0.5, 0.5, 0.5, 0.5);
        Song neither = song("neither", "Pop", "Y", 100, 0.5, 0.5, 0.5, 0.5, 0.5);
        List<String> ids = service.getSmartShuffle(List.of(seed), List.of(neither, artistMatch, genreMatch), 3);
        assertThat(ids).containsExactly("genre", "artist", "neither");

        List<Map<String, Object>> hybrid = service.getHybridRecommendations(seed, List.of(neither, artistMatch, genreMatch), 3);
        assertThat(hybrid.get(0).get("id")).isEqualTo("genre");
        assertThat(hybrid.get(0).get("similarity_distance")).isNull();
    }

    @Test
    void constantFeatureDoesNotDominateWeights() {
        List<Song> seeds = new ArrayList<>();
        seeds.add(song("s1", "G", "A", 100, 0.5, 0.5, 0.2, 0.5, 0.0));
        seeds.add(song("s2", "G", "A", 140, 0.5, 0.5, 0.8, 0.5, 0.0));
        seeds.add(song("s3", "G", "A", 180, 0.5, 0.5, 0.5, 0.5, 0.01));
        List<Song> cands = List.of(song("c1", "G", "B", 120, 0.5, 0.5, 0.5, 0.5, 0.0));
        // constant features give z = 0 and a bounded weight, so the result is finite and ranked
        assertThat(service.getSmartShuffle(seeds, cands, 1)).containsExactly("c1");

        double[] w = RecommendationService.computeWeights(List.of(
                new double[]{0, 0, 0, 0, 0, 0},
                new double[]{3, 0, 0, 0, 0, 0},
                new double[]{-3, 0, 0, 0, 0, 0}));
        for (double x : w) assertThat(x).isLessThanOrEqualTo(3.0 + 1e-9).isPositive();
    }

    @Test
    void closestStandardizedNeighbourRanksFirst() {
        // tempo is on a 100x larger scale than the others; standardizing keeps energy relevant
        Song seed = song("seed", "G", "A", 120, 0.50, 0.5, 0.5, 0.5, 0.5);
        Song near = song("near", "H", "B", 122, 0.52, 0.5, 0.5, 0.5, 0.5);
        Song mid = song("mid", "H", "C", 130, 0.70, 0.6, 0.5, 0.5, 0.5);
        Song far = song("far", "H", "D", 180, 0.95, 0.9, 0.9, 0.1, 0.1);
        List<String> ids = service.getSmartShuffle(List.of(seed), List.of(far, mid, near), 3);
        assertThat(ids).containsExactly("near", "mid", "far");

        List<Map<String, Object>> hybrid = service.getHybridRecommendations(seed, List.of(far, mid, near), 3);
        assertThat(hybrid).extracting(m -> m.get("id")).containsExactly("near", "mid", "far");
    }

    @Test
    void smartShuffleKeepsLanguageAndFavoursSongsPlayedTogether() {
        Song seed = plain("seed", "Pop", "A");
        Song other = plain("other", "Pop", "B");
        Song sitting = plain("sitting", "Pop", "C");
        Song foreign = plain("foreign", "Pop", "D");
        seed.setLanguage("ja");
        other.setLanguage("ja");
        sitting.setLanguage("ja");
        foreign.setLanguage("en");

        List<String> ids = service.getSmartShuffle(List.of(seed), List.of(foreign, other, sitting), 3,
                Map.of("sitting", 2, "foreign", 5));

        assertThat(ids).containsExactly("sitting", "other");
    }

    @Test
    void commaSeparatedGenreMatches() {
        Song seed = plain("seed", "Pop, Dance Pop", "A");
        Song match = plain("match", "dance pop", "B");
        Song miss = plain("miss", "Metal", "C");
        List<String> ids = service.getSmartShuffle(List.of(seed), List.of(miss, match), 2);
        assertThat(ids).containsExactly("match", "miss");
    }

    @Test
    void knnProjectionEmptyWhenFewerThanFiveAnalyzed() {
        List<Song> songs = new ArrayList<>();
        for (int i = 0; i < 4; i++) songs.add(song("a" + i, "G", "A", 100 + i * 10, 0.1 * (i + 1), 0.5, 0.5, 0.5, 0.5));
        for (int i = 0; i < 10; i++) songs.add(plain("u" + i, "G", "A"));
        Map<String, Object> r = service.getKnnProjection(songs, "a0", 5);
        assertThat((List<?>) r.get("points")).isEmpty();
        assertThat(r.get("k_neighbors")).isEqualTo(0);

        songs.add(song("a4", "G", "A", 150, 0.9, 0.2, 0.1, 0.3, 0.4));
        Map<String, Object> ok = service.getKnnProjection(songs, "a0", 2);
        assertThat((List<?>) ok.get("points")).hasSize(5);
        assertThat(ok.get("k_neighbors")).isEqualTo(2);

        Map<String, Object> noSeed = service.getKnnProjection(songs, "u1", 2);
        assertThat(noSeed.get("k_neighbors")).isEqualTo(0);
        assertThat(((List<Map<String, Object>>) noSeed.get("points"))).allMatch(p -> "candidate".equals(p.get("type")));
    }
}
