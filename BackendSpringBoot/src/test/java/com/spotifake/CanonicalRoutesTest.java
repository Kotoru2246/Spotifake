package com.spotifake;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Phase 2 route consolidation: canonical /api paths answer, removed aliases are gone (see docs/API.md). */
class CanonicalRoutesTest extends IntegrationTestBase {

    @ParameterizedTest
    @ValueSource(strings = {
        "/api/music",                              // was /songs, /music/list, /api/music/library
        "/api/music/stream/" + SONG_ID,            // was /songs/{id}/stream
        "/api/music/stream?fileName=" + SONG_FILE, // was /music/stream?fileName=
        "/api/music/lyrics/" + SONG_ID,            // was /api/music/{id}/lyrics
        "/api/albums",                             // was /album/list, /api/albums/list
        "/api/search?q=test",                      // was /search/global
        "/api/playlists",                          // was /playlists/my
        "/api/playlists/my",                       // legacy alias kept for spotifake_mobile
        "/api/artists?name=Test%20Artist",         // was /artist/details?name=, /artist/api/details
        "/artist/details?name=Test%20Artist",      // legacy alias kept for spotifake_mobile
        "/api/recommendations/knn-projection",     // was /api/knn-projection
        "/api/public/settings",                    // was /admin/dashboard/api/public/settings
        "/api/public/announcements",               // was /admin/dashboard/api/public/announcements
    })
    void canonicalGetRoutesWork(String url) throws Exception {
        mvc.perform(get(url)).andExpect(status().isOk());
    }

    @Test
    void canonicalPostRoutesWork() throws Exception {
        // was /music/listen, /api/music/listen
        mvc.perform(post("/api/music/play").contentType(MediaType.APPLICATION_JSON).content("{\"songId\":\"" + SONG_ID + "\"}"))
           .andExpect(status().isOk());
        // was /api/smart-shuffle
        mvc.perform(post("/api/recommendations/smart-shuffle").contentType(MediaType.APPLICATION_JSON).content("{\"seed_track_ids\":[\"" + SONG_ID + "\"]}"))
           .andExpect(status().isOk());
        // was /playlists/my/liked/toggle
        mvc.perform(post("/api/playlists/toggle-favorite").header("Authorization", bearer("user_test"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"songId\":\"" + SONG_ID + "\"}"))
           .andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "/songs", "/music/list", "/api/songs/" + SONG_ID + "/cover", "/search/global?q=a",
        "/album/list", "/albums", "/playlists/my", "/api/music/list", "/api/albums/list",
    })
    void removedAliasesAre404(String url) throws Exception {
        mvc.perform(get(url)).andExpect(status().isNotFound());
    }
}
