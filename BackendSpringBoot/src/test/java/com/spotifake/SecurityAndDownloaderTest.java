package com.spotifake;

import com.spotifake.service.DownloaderService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SecurityAndDownloaderTest extends IntegrationTestBase {

    /** Mocked so no spotdl process is ever started. validateQuery is static and stays real. */
    @MockBean
    DownloaderService downloaderService;

    private static String body(String query) {
        return "{\"query\":\"" + query + "\"}";
    }

    @Test
    void downloaderRejectsAnonymous() throws Exception {
        mvc.perform(post("/api/downloader/start").contentType(MediaType.APPLICATION_JSON).content(body("Adele")))
           .andExpect(status().isUnauthorized());
        verifyNoInteractions(downloaderService);
    }

    @Test
    void downloaderRejectsNonAdmin() throws Exception {
        mvc.perform(post("/api/downloader/start").header("Authorization", bearer("user_test"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("Adele")))
           .andExpect(status().isForbidden());
        mvc.perform(get("/api/downloader/jobs").header("Authorization", bearer("artist_test")))
           .andExpect(status().isForbidden());
        verifyNoInteractions(downloaderService);
    }

    @Test
    void downloaderAcceptsAdmin() throws Exception {
        when(downloaderService.startJob(anyString())).thenReturn(Map.of("id", "job1", "status", "QUEUED"));
        mvc.perform(post("/api/downloader/start").header("Authorization", bearer("admin_test"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("https://open.spotify.com/album/abc")))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.status").value("QUEUED"));
        verify(downloaderService).startJob("https://open.spotify.com/album/abc");
    }

    @Test
    void legacyMobileDownloadAliasIsAlsoAdminOnly() throws Exception {
        mvc.perform(post("/api/downloader/download").contentType(MediaType.APPLICATION_JSON).content(body("Adele")))
           .andExpect(status().isUnauthorized());
    }

    @Test
    void queryStartingWithDashIsRejected() throws Exception {
        mvc.perform(post("/api/downloader/start").header("Authorization", bearer("admin_test"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("--help")))
           .andExpect(status().isBadRequest());
        verify(downloaderService, never()).startJob(anyString());
    }

    @Test
    void overlongQueryIsRejected() throws Exception {
        mvc.perform(post("/api/downloader/start").header("Authorization", bearer("admin_test"))
                        .contentType(MediaType.APPLICATION_JSON).content(body("a".repeat(DownloaderService.MAX_QUERY_LENGTH + 1))))
           .andExpect(status().isBadRequest());
        verify(downloaderService, never()).startJob(anyString());
    }

    @Test
    void validateQueryRules() {
        assertThat(DownloaderService.validateQuery("Ngọt - Em Dạo Này")).isNull();
        assertThat(DownloaderService.validateQuery("https://open.spotify.com/album/abc")).isNull();
        assertThat(DownloaderService.validateQuery("https://music.youtube.com/watch?v=x")).isNull();
        assertThat(DownloaderService.validateQuery("https://www.youtube.com/watch?v=x")).isNull();
        assertThat(DownloaderService.validateQuery("")).isNotNull();
        assertThat(DownloaderService.validateQuery("-o /etc")).isNotNull();
        assertThat(DownloaderService.validateQuery("https://evil.example.com/x")).isNotNull();
        assertThat(DownloaderService.validateQuery("file:///etc/passwd")).isNotNull();
        assertThat(DownloaderService.validateQuery("song\nname")).isNotNull();
    }

    @Test
    void publicSongListIsOpen() throws Exception {
        mvc.perform(get("/api/music")).andExpect(status().isOk());
    }

    @Test
    void adminApiRequiresAdmin() throws Exception {
        mvc.perform(get("/api/admin/anything")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/anything").header("Authorization", bearer("user_test")))
           .andExpect(status().isForbidden());
    }
}
