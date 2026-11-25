package com.spotifake.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SongRedownloadServiceTest {

    @Test
    void acceptsYoutubeVideoLinksAndDropsExtraParameters() {
        String expected = "https://www.youtube.com/watch?v=abcDEF12_-3";
        assertThat(SongRedownloadService.normalizeYoutubeUrl("https://www.youtube.com/watch?v=abcDEF12_-3&list=xyz")).isEqualTo(expected);
        assertThat(SongRedownloadService.normalizeYoutubeUrl("https://music.youtube.com/watch?v=abcDEF12_-3")).isEqualTo(expected);
        assertThat(SongRedownloadService.normalizeYoutubeUrl("https://youtu.be/abcDEF12_-3?si=q")).isEqualTo(expected);
        assertThat(SongRedownloadService.normalizeYoutubeUrl("  ")).isEmpty();
    }

    @Test
    void rejectsAnythingElse() {
        assertThat(SongRedownloadService.normalizeYoutubeUrl("https://evil.example/watch?v=abcDEF12_-3")).isNull();
        assertThat(SongRedownloadService.normalizeYoutubeUrl("--output=/tmp/x")).isNull();
        assertThat(SongRedownloadService.normalizeYoutubeUrl("https://youtu.be/abcDEF12_-3|https://open.spotify.com/track/x")).isNotEqualTo("https://youtu.be/abcDEF12_-3|https://open.spotify.com/track/x");
        assertThat(SongRedownloadService.normalizeYoutubeUrl("https://www.youtube.com/playlist?list=xyz")).isNull();
    }
}
