package com.spotifake;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spotifake.service.AudioAnalysisClient;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AudioAnalysisFailSoftTest extends IntegrationTestBase {

    private JsonNode upload(String genre) throws Exception {
        var file = new MockMultipartFile("file", "Some Artist - Fail Soft.mp3", "audio/mpeg", new byte[2000]);
        var req = multipart("/api/music/upload").file(file);
        if (genre != null) req.param("genre", genre);
        String body = mvc.perform(req.header("Authorization", bearer("artist_test")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return new ObjectMapper().readTree(body);
    }

    @Test
    void uploadSucceedsWhenAnalysisServiceDown() throws Exception {
        JsonNode song = upload(null);
        assertThat(song.get("tempo").asDouble()).isZero();
        assertThat(song.get("energy").asDouble()).isZero();
        assertThat(song.get("danceability").asDouble()).isZero();
        assertThat(song.get("valence").asDouble()).isZero();
        assertThat(song.get("acousticness").asDouble()).isZero();
        assertThat(song.get("instrumentalness").asDouble()).isZero();
        assertThat(song.get("genre").asText()).isEmpty();
    }

    @Test
    void uploadKeepsUserGenre() throws Exception {
        assertThat(upload("  Jazz ").get("genre").asText()).isEqualTo("Jazz");
    }

    @Test
    void backfillRequiresAdmin() throws Exception {
        mvc.perform(post("/api/admin/analysis/backfill")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/analysis/backfill").header("Authorization", bearer("user_test")))
           .andExpect(status().isForbidden());
    }

    @Test
    void backfillReturns503WhenServiceDown() throws Exception {
        mvc.perform(post("/api/admin/analysis/backfill").header("Authorization", bearer("admin_test")))
           .andExpect(status().isServiceUnavailable())
           .andExpect(jsonPath("$.error").value("analysis service unavailable"))
           .andExpect(jsonPath("$.remaining").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    @Test
    void statusCountsUnanalyzed() throws Exception {
        int expected = repository.countUnanalyzedSongs();
        assertThat(expected).isGreaterThanOrEqualTo(1); // seeded test song has zero features
        mvc.perform(get("/api/admin/analysis/status").header("Authorization", bearer("admin_test")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.unanalyzed").value(expected));
    }

    @Test
    void placeholderHelperAndLimitClamp() {
        var p = (java.util.function.Predicate<String>) com.spotifake.service.AudioAnalysisService::isPlaceholder;
        assertThat(p.test(null)).isTrue();
        assertThat(p.test("  ")).isTrue();
        assertThat(p.test("Analyzing...")).isTrue();
        assertThat(p.test("Rock")).isFalse();
        assertThat(com.spotifake.controller.AdminAnalysisController.clampLimit(0)).isEqualTo(1);
        assertThat(com.spotifake.controller.AdminAnalysisController.clampLimit(50)).isEqualTo(5);
        assertThat(com.spotifake.controller.AdminAnalysisController.clampLimit(3)).isEqualTo(3);
    }

    @Test
    void titleCaseGenre() {
        assertThat(AudioAnalysisClient.titleCaseGenre("hip-hop")).isEqualTo("Hip-Hop");
        assertThat(AudioAnalysisClient.titleCaseGenre("rock, pop")).isEqualTo("Rock, Pop");
        assertThat(AudioAnalysisClient.titleCaseGenre("  ")).isNull();
        assertThat(AudioAnalysisClient.titleCaseGenre(null)).isNull();
    }
}
