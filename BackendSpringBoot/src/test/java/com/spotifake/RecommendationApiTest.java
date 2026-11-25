package com.spotifake;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spotifake.model.Song;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RecommendationApiTest extends IntegrationTestBase {

    private Song insert(String id, String title, byte[] fileData) {
        Song s = new Song();
        s.setId(id);
        s.setUserId("00000000-0000-0000-0000-000000000002");
        s.setTitle(title);
        s.setArtist("Rec Artist");
        s.setDurationMs(1000);
        s.setFilePath(id + ".mp3");
        s.setFileData(fileData);
        if (repository.getSongById(id) == null) repository.insertSong(s);
        return s;
    }

    @Test
    void getSongsByIdsPreservesInputOrderAndSkipsBlobs() {
        insert("rec-order-1", "One", new byte[]{1, 2, 3});
        insert("rec-order-2", "Two", new byte[]{4, 5, 6});
        List<Song> songs = repository.getSongsByIds(List.of("rec-order-2", "missing-id", "rec-order-1", "rec-order-2"));
        assertThat(songs).extracting(Song::getId).containsExactly("rec-order-2", "rec-order-1");
        assertThat(songs).allSatisfy(s -> assertThat(s.getFileData()).isNull());
        assertThat(repository.getSongById("rec-order-1").getFileData()).isNotNull();
    }

    @Test
    void smartShuffleUnknownSeedReturns400() throws Exception {
        mvc.perform(post("/api/recommendations/smart-shuffle").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"seed_track_ids\":[\"nope-nope\"]}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("no known seed_track_ids"));
    }

    @Test
    void smartShuffleMissingSeedReturns400() throws Exception {
        mvc.perform(post("/api/recommendations/smart-shuffle").contentType(MediaType.APPLICATION_JSON).content("{}"))
           .andExpect(status().isBadRequest())
           .andExpect(jsonPath("$.error").value("seed_track_ids required"));
        mvc.perform(post("/api/recommendations/smart-shuffle").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"seed_track_ids\":[]}"))
           .andExpect(status().isBadRequest());
    }

    @Test
    void smartShuffleNeverReturnsSeed() throws Exception {
        insert("rec-seed-1", "Seed", null);
        insert("rec-cand-1", "Cand", null);
        String body = mvc.perform(post("/api/recommendations/smart-shuffle").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"seed_track_ids\":[\"rec-seed-1\"],\"n_recommendations\":50}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode ids = new ObjectMapper().readTree(body).get("song_ids");
        assertThat(ids.isArray()).isTrue();
        for (JsonNode id : ids) assertThat(id.asText()).isNotEqualTo("rec-seed-1");
        assertThat(body).contains("rec-cand-1");
    }

    @Test
    void knnProjectionHasNoDemoPoints() throws Exception {
        String body = mvc.perform(get("/api/recommendations/knn-projection"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.k_neighbors").value(0))
                .andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("Demo Artist").doesNotContain("Acoustic Track");
        assertThat(new ObjectMapper().readTree(body).get("points")).isEmpty();
    }

    @Test
    void hybridUnknownSeedReturns404() throws Exception {
        mvc.perform(get("/api/recommendations/hybrid").param("seed_id", "nope-nope"))
           .andExpect(status().isNotFound());
    }
}
