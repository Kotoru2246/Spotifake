package com.spotifake;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spotifake.model.Song;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SongCommentsTest extends IntegrationTestBase {

    private static final ObjectMapper JSON = new ObjectMapper();

    private String newSongId() {
        Song s = new Song();
        s.setId("cm-song-" + UUID.randomUUID());
        s.setUserId("00000000-0000-0000-0000-000000000002");
        s.setTitle("T-" + UUID.randomUUID());
        s.setArtist("Commented Artist");
        s.setDurationMs(1000);
        s.setFilePath(s.getId() + ".mp3");
        return repository.insertSong(s).getId();
    }

    private JsonNode comments(String songId) throws Exception {
        return JSON.readTree(mvc.perform(get("/api/music/comments/" + songId))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private void postExpecting(String songId, String username, String body, int expected) throws Exception {
        var req = post("/api/music/comments/" + songId).contentType(MediaType.APPLICATION_JSON).content(body);
        if (username != null) req.header("Authorization", bearer(username));
        mvc.perform(req).andExpect(status().is(expected));
    }

    @Test
    void signedInUserPostsAndEveryoneReadsInTimelineOrder() throws Exception {
        String songId = newSongId();
        assertThat(comments(songId)).isEmpty();

        postExpecting(songId, "user_test", "{\"timestampMs\":9000,\"content\":\"later\"}", 200);
        String created = mvc.perform(post("/api/music/comments/" + songId)
                        .header("Authorization", bearer("user_test"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"timestampMs\":1500,\"content\":\"  <b>first</b>  \",\"userId\":\"spoofed\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        String userId = repository.getUserByUsername("user_test").getId();
        JsonNode one = JSON.readTree(created);
        assertThat(one.get("id").asText()).isNotBlank();
        assertThat(one.get("songId").asText()).isEqualTo(songId);
        assertThat(one.get("userId").asText()).isEqualTo(userId);
        assertThat(one.get("createdAt").asText()).isNotBlank();

        JsonNode list = comments(songId);
        assertThat(list).hasSize(2);
        assertThat(list.get(0).get("timestampMs").asLong()).isEqualTo(1500);
        // stored as typed (trimmed); the player renders it as text, not HTML
        assertThat(list.get(0).get("content").asText()).isEqualTo("<b>first</b>");
        assertThat(list.get(1).get("content").asText()).isEqualTo("later");
        assertThat(comments(newSongId())).isEmpty();
    }

    @Test
    void guestCannotPost() throws Exception {
        String songId = newSongId();
        postExpecting(songId, null, "{\"timestampMs\":1,\"content\":\"hi\"}", 401);
        assertThat(comments(songId)).isEmpty();
    }

    @Test
    void invalidCommentsRejected() throws Exception {
        String songId = newSongId();
        postExpecting(songId, "user_test", "{\"timestampMs\":1,\"content\":\"   \"}", 400);
        postExpecting(songId, "user_test", "{\"timestampMs\":1}", 400);
        postExpecting(songId, "user_test", "{\"content\":\"" + "a".repeat(501) + "\"}", 400);
        postExpecting("no-such-song", "user_test", "{\"content\":\"hi\"}", 404);
        assertThat(comments(songId)).isEmpty();

        // a missing or negative position lands at the start of the track
        postExpecting(songId, "user_test", "{\"timestampMs\":-50,\"content\":\"hi\"}", 200);
        assertThat(comments(songId).get(0).get("timestampMs").asLong()).isZero();
    }

    @Test
    void unknownSongHasNoCommentsRatherThanAnError() throws Exception {
        assertThat(comments("no-such-song")).isEmpty();
    }
}
