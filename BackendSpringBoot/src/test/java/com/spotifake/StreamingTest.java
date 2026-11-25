package com.spotifake;

import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class StreamingTest extends IntegrationTestBase {

    private static final String URL = "/api/music/stream/" + SONG_ID;

    @Test
    void noRangeReturnsWholeFile() throws Exception {
        mvc.perform(get(URL))
           .andExpect(status().isOk())
           .andExpect(header().string("Content-Length", String.valueOf(SONG_BYTES)))
           .andExpect(header().string("Accept-Ranges", "bytes"));
    }

    @Test
    void audioMayBeCachedByTheBrowser() throws Exception {
        mvc.perform(get(URL).header("Range", "bytes=0-99"))
           .andExpect(header().string("Cache-Control", "private, max-age=3600"));
    }

    @Test
    void boundedRangeReturnsPartialContent() throws Exception {
        mvc.perform(get(URL).header("Range", "bytes=0-99"))
           .andExpect(status().isPartialContent())
           .andExpect(header().string("Content-Length", "100"))
           .andExpect(header().string("Content-Range", "bytes 0-99/" + SONG_BYTES));
    }

    @Test
    void openEndedRangeRunsToEndOfFile() throws Exception {
        mvc.perform(get(URL).header("Range", "bytes=9000-"))
           .andExpect(status().isPartialContent())
           .andExpect(header().string("Content-Length", "1000"));
    }

    @Test
    void suffixRangeIsNotSatisfiable() throws Exception {
        mvc.perform(get(URL).header("Range", "bytes=-500"))
           .andExpect(status().isRequestedRangeNotSatisfiable())
           .andExpect(header().string("Content-Range", "bytes */" + SONG_BYTES));
    }

    @Test
    void rangePastEndIsNotSatisfiable() throws Exception {
        mvc.perform(get(URL).header("Range", "bytes=999999999-"))
           .andExpect(status().isRequestedRangeNotSatisfiable());
    }

    @Test
    void malformedRangeIsNotSatisfiable() throws Exception {
        mvc.perform(get(URL).header("Range", "bytes=abc-def")).andExpect(status().isRequestedRangeNotSatisfiable());
        mvc.perform(get(URL).header("Range", "bytes=50-10")).andExpect(status().isRequestedRangeNotSatisfiable());
    }

    @Test
    void unknownSongIs404() throws Exception {
        mvc.perform(get("/api/music/stream/does-not-exist")).andExpect(status().isNotFound());
    }
}
