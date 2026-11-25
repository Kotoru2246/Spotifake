package com.spotifake;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PlaylistCoverTest extends IntegrationTestBase {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4, 5, 6};

    private String uniqueName() { return "pl-" + UUID.randomUUID(); }

    private JsonNode findByName(MvcResult r, String name) throws Exception {
        for (JsonNode n : JSON.readTree(r.getResponse().getContentAsString())) {
            if (name.equals(n.path("name").asText())) return n;
        }
        throw new AssertionError("playlist not found: " + name);
    }

    private JsonNode createMultipart(String name, MockMultipartFile cover) throws Exception {
        var req = multipart("/api/playlists");
        if (cover != null) req.file(cover);
        MvcResult r = mvc.perform(req.param("name", name).header("Authorization", bearer("user_test"))).andExpect(status().isOk()).andReturn();
        return findByName(r, name);
    }

    private MockMultipartFile png() { return new MockMultipartFile("cover", "c.png", "image/png", PNG); }

    @Test
    void jsonCreateStillWorks() throws Exception {
        String name = uniqueName();
        String body = "{\"name\":\"" + name + "\",\"imageUrl\":\"http://x/y.png\",\"songFileNames\":[\"" + SONG_FILE + "\"]}";
        MvcResult r = mvc.perform(post("/api/playlists").header("Authorization", bearer("user_test"))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk()).andReturn();
        JsonNode pl = findByName(r, name);
        assertThat(pl.get("imageUrl").asText()).isEqualTo("http://x/y.png");
        assertThat(pl.get("songs")).hasSize(1);
    }

    @Test
    void multipartCreateWithoutCover() throws Exception {
        JsonNode pl = createMultipart(uniqueName(), null);
        assertThat(pl.get("imageUrl").asText()).isEmpty();
    }

    @Test
    void multipartCreateWithCoverAndFetch() throws Exception {
        JsonNode pl = createMultipart(uniqueName(), png());
        assertThat(pl.get("imageUrl").asText()).matches("^/api/playlists/[^/]+/cover\\?v=\\d+$");
        mvc.perform(get("/api/playlists/" + pl.get("id").asText() + "/cover"))
           .andExpect(status().isOk())
           .andExpect(content().contentType("image/png"))
           .andExpect(content().bytes(PNG));
    }

    @Test
    void invalidCoversRejected() throws Exception {
        var text = new MockMultipartFile("cover", "c.txt", "text/plain", "hello".getBytes());
        var fake = new MockMultipartFile("cover", "c.png", "image/png", "hello".getBytes());
        for (var f : new MockMultipartFile[]{text, fake}) {
            mvc.perform(multipart("/api/playlists").file(f).param("name", uniqueName())
                    .header("Authorization", bearer("user_test"))).andExpect(status().isBadRequest());
        }
        byte[] big = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, big, 0, PNG.length);
        mvc.perform(multipart("/api/playlists").file(new MockMultipartFile("cover", "b.png", "image/png", big))
                .param("name", uniqueName()).header("Authorization", bearer("user_test")))
           .andExpect(status().isBadRequest());
    }

    @Test
    void deleteCoverClears() throws Exception {
        JsonNode pl = createMultipart(uniqueName(), png());
        String id = pl.get("id").asText();
        mvc.perform(delete("/api/playlists/" + id + "/cover").header("Authorization", bearer("user_test")))
           .andExpect(status().isOk());
        mvc.perform(get("/api/playlists/" + id + "/cover")).andExpect(status().isNotFound());
        MvcResult r = mvc.perform(get("/api/playlists/" + id)).andExpect(status().isOk()).andReturn();
        assertThat(JSON.readTree(r.getResponse().getContentAsString()).get("imageUrl").asText()).isEmpty();
    }

    @Test
    void putUpdatesAndValidates() throws Exception {
        JsonNode pl = createMultipart(uniqueName(), png());
        String id = pl.get("id").asText();
        String auth = bearer("user_test");
        String newName = uniqueName();
        MvcResult r = mvc.perform(put("/api/playlists/" + id).header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + newName + "\"}"))
                .andExpect(status().isOk()).andReturn();
        JsonNode updated = JSON.readTree(r.getResponse().getContentAsString());
        assertThat(updated.get("name").asText()).isEqualTo(newName);
        assertThat(updated.get("imageUrl").asText()).isEqualTo(pl.get("imageUrl").asText());
        mvc.perform(get("/api/playlists/" + id + "/cover")).andExpect(status().isOk());

        mvc.perform(put("/api/playlists/" + id).header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
           .andExpect(status().isBadRequest());
        mvc.perform(put("/api/playlists/" + UUID.randomUUID()).header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\"}"))
           .andExpect(status().isNotFound());

        mvc.perform(put("/api/playlists/" + id).header("Authorization", auth)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + newName + "\",\"imageUrl\":\"http://x/z.png\"}"))
           .andExpect(status().isOk());
        mvc.perform(get("/api/playlists/" + id + "/cover")).andExpect(status().isNotFound());
    }

    @Test
    void nonOwnerForbidden() throws Exception {
        String id = createMultipart(uniqueName(), png()).get("id").asText();
        String other = bearer("artist_test");
        mvc.perform(put("/api/playlists/" + id).header("Authorization", other)
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\"}")).andExpect(status().isForbidden());
        mvc.perform(multipart("/api/playlists/" + id + "/cover").file(png()).header("Authorization", other))
           .andExpect(status().isForbidden());
        mvc.perform(delete("/api/playlists/" + id + "/cover").header("Authorization", other))
           .andExpect(status().isForbidden());
    }

    @Test
    void anonymousWritesUnauthorized() throws Exception {
        JsonNode pl = createMultipart(uniqueName(), png());
        String id = pl.get("id").asText();
        mvc.perform(put("/api/playlists/" + id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"hacked\"}")).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/playlists/" + id + "/cover").file(png())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/playlists/" + id + "/cover")).andExpect(status().isUnauthorized());
        MvcResult r = mvc.perform(get("/api/playlists/" + id)).andExpect(status().isOk()).andReturn();
        JsonNode after = JSON.readTree(r.getResponse().getContentAsString());
        assertThat(after.get("name").asText()).isEqualTo(pl.get("name").asText());
        assertThat(after.get("imageUrl").asText()).isEqualTo(pl.get("imageUrl").asText());
        mvc.perform(get("/api/playlists/" + id + "/cover")).andExpect(status().isOk());
    }

    @Test
    void likedAndUnknownCoverAre404()throws Exception {
        mvc.perform(get("/api/playlists/liked-songs-user_test/cover")).andExpect(status().isNotFound());
        mvc.perform(get("/api/playlists/" + UUID.randomUUID() + "/cover")).andExpect(status().isNotFound());
    }
}
