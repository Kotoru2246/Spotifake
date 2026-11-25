package com.spotifake;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.spotifake.model.Song;
import com.spotifake.model.User;
import com.spotifake.service.ShortcutService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ShortcutsTest extends IntegrationTestBase {

    private static final ObjectMapper JSON = new ObjectMapper();
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4, 5, 6};
    private static final String ARTIST_UID = "00000000-0000-0000-0000-000000000002";

    // ---------------------------------------------------------------- helpers

    private User newUser() {
        String n = "sc" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        User u = repository.createUser(UUID.randomUUID().toString(), n, n + "@example.test", "x", "user", n);
        assertThat(u).isNotNull();
        return u;
    }

    private Song newSong(String album, String albumId, String artist, String cover) {
        Song s = new Song();
        s.setId("sc-song-" + UUID.randomUUID());
        s.setUserId(ARTIST_UID);
        s.setTitle("T-" + UUID.randomUUID());
        s.setArtist(artist);
        s.setAlbum(album);
        s.setAlbumId(albumId);
        s.setDurationMs(1000);
        s.setFilePath(s.getId() + ".mp3");
        if (cover != null) s.setCoverArtUrl(cover);
        return repository.insertSong(s);
    }

    private String createPlaylist(User u, String... songIds) throws Exception {
        String name = "pl-" + UUID.randomUUID();
        List<String> q = new ArrayList<>();
        for (String s : songIds) q.add("\"" + s + "\"");
        String body = "{\"name\":\"" + name + "\",\"songFileNames\":[" + String.join(",", q) + "]}";
        String res = mvc.perform(post("/api/playlists").header("Authorization", bearer(u.getUsername()))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        for (JsonNode n : JSON.readTree(res)) if (name.equals(n.path("name").asText())) return n.get("id").asText();
        throw new AssertionError("playlist not created");
    }

    private void play(User u, String ctxType, String ctxId) throws Exception {
        String body = "{\"songId\":\"" + SONG_ID + "\",\"contextType\":\"" + ctxType + "\",\"contextId\":\"" + ctxId + "\"}";
        var req = post("/api/music/play").contentType(MediaType.APPLICATION_JSON).content(body);
        if (u != null) req.header("Authorization", bearer(u.getUsername()));
        mvc.perform(req).andExpect(status().isOk());
    }

    private JsonNode shortcuts(User u, String query) throws Exception {
        var req = get("/api/me/shortcuts" + query);
        if (u != null) req.header("Authorization", bearer(u.getUsername()));
        String res = mvc.perform(req).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JSON.readTree(res);
    }

    // ---------------------------------------------------------------- tests

    @Test
    void guestGetsEmptyList() throws Exception {
        assertThat(shortcuts(null, "")).isEmpty();
    }

    @Test
    void legacyBodiesStillWork() throws Exception {
        User u = newUser();
        String auth = bearer(u.getUsername());
        mvc.perform(post("/api/music/play").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"songId\":\"" + SONG_ID + "\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/music/play").header("Authorization", auth).contentType(MediaType.APPLICATION_JSON)
                .content("{\"fileName\":\"" + SONG_FILE + "\"}")).andExpect(status().isOk());
        mvc.perform(post("/api/music/play").header("Authorization", auth)).andExpect(status().isOk());
        assertThat(repository.getUserPlayContexts(u.getId(), 50)).isEmpty();
    }

    @Test
    void playlistContextRecordedWithMosaic() throws Exception {
        User u = newUser();
        Song a = newSong("A1", "alb-x-" + UUID.randomUUID(), "Art", "http://x/a.png");
        Song b = newSong("A2", "alb-y-" + UUID.randomUUID(), "Art", "http://x/b.png");
        String pid = createPlaylist(u, a.getId(), b.getId());
        for (int i = 0; i < 3; i++) play(u, "playlist", pid);
        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(1);
        JsonNode s = arr.get(0);
        assertThat(s.get("type").asText()).isEqualTo("playlist");
        assertThat(s.get("id").asText()).isEqualTo(pid);
        assertThat(s.get("openId").asText()).isEqualTo(pid);
        assertThat(s.get("playlistId").asText()).isEqualTo(pid);
        assertThat(s.get("playCount").asInt()).isEqualTo(3);
        assertThat(s.get("lastPlayedAt").asText()).isNotEmpty();
        assertThat(s.get("subtitle").asText()).startsWith("Playlist");
        assertThat(s.get("coverMosaic")).hasSize(2);
        assertThat(s.get("coverMosaic").get(0).asText()).isEqualTo("http://x/a.png");
    }

    @Test
    void customPlaylistCoverReturned() throws Exception {
        User u = newUser();
        String name = "pl-" + UUID.randomUUID();
        String res = mvc.perform(multipart("/api/playlists")
                .file(new MockMultipartFile("cover", "c.png", "image/png", PNG)).param("name", name)
                .header("Authorization", bearer(u.getUsername()))).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String pid = null;
        for (JsonNode n : JSON.readTree(res)) if (name.equals(n.path("name").asText())) pid = n.get("id").asText();
        play(u, "playlist", pid);
        JsonNode s = shortcuts(u, "").get(0);
        assertThat(s.get("coverUrl").asText()).matches("^/api/playlists/[^/]+/cover\\?v=\\d+$");
    }

    @Test
    void albumByIdAndByTitle() throws Exception {
        User u = newUser();
        String albumId = repository.createAlbum(ARTIST_UID, "Album " + UUID.randomUUID(), "", "", null);
        newSong("x", albumId, "Some Artist", "http://x/al.png");
        play(u, "album", "alb-" + albumId);

        String title = "Solo Album";
        newSong(title, null, "Solo Artist", "http://x/solo.png");
        play(u, "album", "alb-" + title);

        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(2);
        boolean byId = false, byTitle = false;
        for (JsonNode n : arr) {
            if (n.get("id").asText().equals(albumId)) {
                byId = true;
                assertThat(n.get("albumId").asText()).isEqualTo(albumId);
            } else if (n.get("id").asText().equals("title:solo album")) {
                byTitle = true;
                assertThat(n.get("albumId").isNull()).isTrue();
                assertThat(n.get("openId").asText()).isEqualTo("Solo Album");
                assertThat(n.get("subtitle").asText()).endsWith("Album");
            }
        }
        assertThat(byId).isTrue();
        assertThat(byTitle).isTrue();
    }

    @Test
    void albumByIdAndByTitleCanonicalizeToOneTile() throws Exception {
        User u = newUser();
        String title = "Canon " + UUID.randomUUID();
        String albumId = repository.createAlbum(ARTIST_UID, title, "", "", null);
        newSong(title, albumId, "Some Artist", "http://x/c.png");
        play(u, "album", "alb-" + albumId);
        play(u, "album", "alb-" + title);
        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(1);
        assertThat(arr.get(0).get("id").asText()).isEqualTo(albumId);
        assertThat(arr.get(0).get("playCount").asInt()).isEqualTo(2);
    }

    @Test
    void artistByName() throws Exception {
        User u = newUser();
        String name = "Zed" + UUID.randomUUID().toString().substring(0, 8);
        newSong("x", null, name, null);
        play(u, "artist", "artist-" + name);
        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(1);
        assertThat(arr.get(0).get("id").asText()).isEqualTo("name:" + name.toLowerCase());
        assertThat(arr.get(0).get("title").asText()).isEqualTo(name);
        assertThat(arr.get(0).get("subtitle").asText()).isEqualTo("Artist");
        assertThat(arr.get(0).get("coverMosaic")).isEmpty();
    }

    @Test
    void invalidContextsIgnored() throws Exception {
        User u = newUser();
        play(u, "song", SONG_ID);
        play(u, "playlist", UUID.randomUUID().toString());
        play(u, "playlist", "liked-songs-x");
        play(u, "playlist", "mix-1");
        play(u, "playlist", " ");
        play(u, "playlist", "a".repeat(300));
        play(u, "album", "no-such-album-" + UUID.randomUUID());
        assertThat(repository.getUserPlayContexts(u.getId(), 50)).isEmpty();
        assertThat(shortcuts(u, "")).isEmpty();
    }

    @Test
    void privatePlaylistNotLeaked() throws Exception {
        User owner = newUser();
        User other = newUser();
        String pid = createPlaylist(owner);
        repository.setPlaylistVisibility(pid, false);
        play(other, "playlist", pid);
        assertThat(repository.getUserPlayContexts(other.getId(), 50)).isEmpty();

        repository.setPlaylistVisibility(pid, true);
        play(other, "playlist", pid);
        assertThat(shortcuts(other, "")).hasSize(1);

        repository.setPlaylistVisibility(pid, false);
        assertThat(shortcuts(other, "")).isEmpty();
        // the owner still sees it
        play(owner, "playlist", pid);
        assertThat(shortcuts(owner, "")).hasSize(1);
    }

    @Test
    void deletedPlaylistDropped() throws Exception {
        User u = newUser();
        String keep = createPlaylist(u);
        String gone = createPlaylist(u);
        play(u, "playlist", keep);
        play(u, "playlist", gone);
        assertThat(shortcuts(u, "")).hasSize(2);
        mvc.perform(delete("/api/playlists/" + gone).header("Authorization", bearer(u.getUsername())))
           .andExpect(status().isOk());
        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(1);
        assertThat(arr.get(0).get("id").asText()).isEqualTo(keep);
        assertThat(repository.getUserPlayContexts(u.getId(), 50)).hasSize(1);
    }

    @Test
    void scoreRanking() {
        long now = 1_000_000_000_000L;
        long min = 60_000L;
        // frequency only wins between plays a few minutes apart
        assertThat(ShortcutService.score(now - 2 * min, 20, now)).isGreaterThan(ShortcutService.score(now - min, 1, now));
        // a newer play beats a much more frequent but older one
        assertThat(ShortcutService.score(now - 30 * min, 1, now)).isGreaterThan(ShortcutService.score(now - 60 * min, 100, now));
        assertThat(ShortcutService.score(now, 1, now)).isGreaterThan(ShortcutService.score(now - 48 * 60 * min, 20, now));
    }

    @Test
    void endToEndOrder() throws Exception {
        User u = newUser();
        String p1 = createPlaylist(u), p2 = createPlaylist(u), p3 = createPlaylist(u);
        long now = System.currentTimeMillis();
        long min = 60_000L;
        // 20 plays 2 min ago beats 1 play 1 min ago and 1 play now (frequency only matters within minutes)
        for (int i = 0; i < 20; i++) repository.upsertUserPlayContext(u.getId(), "playlist", p1, now - 2 * min);
        repository.upsertUserPlayContext(u.getId(), "playlist", p2, now - min);
        repository.upsertUserPlayContext(u.getId(), "playlist", p3, now);
        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(3);
        assertThat(arr.get(0).get("id").asText()).isEqualTo(p1);
        assertThat(arr.get(1).get("id").asText()).isEqualTo(p3);
        assertThat(arr.get(2).get("id").asText()).isEqualTo(p2);
    }

    @Test
    void newerPlayBeatsOlderFrequentOne() throws Exception {
        User u = newUser();
        String old = createPlaylist(u), fresh = createPlaylist(u);
        long now = System.currentTimeMillis();
        long h = 3_600_000L;
        for (int i = 0; i < 10; i++) repository.upsertUserPlayContext(u.getId(), "playlist", old, now - h);
        repository.upsertUserPlayContext(u.getId(), "playlist", fresh, now);
        JsonNode arr = shortcuts(u, "");
        assertThat(arr.get(0).get("id").asText()).isEqualTo(fresh);
        assertThat(arr.get(1).get("id").asText()).isEqualTo(old);
    }

    @Test
    void newAccountBackfillsOwnPlaylists() throws Exception {
        User u = newUser();
        createPlaylist(u);
        createPlaylist(u);
        JsonNode arr = shortcuts(u, "");
        assertThat(arr).hasSize(2);
        for (JsonNode n : arr) {
            assertThat(n.get("playCount").asInt()).isZero();
            assertThat(n.get("lastPlayedAt").isNull()).isTrue();
            assertThat(n.get("id").asText()).doesNotStartWith("liked-songs-");
        }
    }

    @Test
    void limitClamped() throws Exception {
        User u = newUser();
        for (int i = 0; i < 3; i++) createPlaylist(u);
        assertThat(shortcuts(u, "?limit=0")).hasSize(1);
        assertThat(shortcuts(u, "?limit=2")).hasSize(2);
        assertThat(shortcuts(u, "?limit=999")).hasSize(3);
        assertThat(shortcuts(u, "")).hasSize(3);
    }
}
