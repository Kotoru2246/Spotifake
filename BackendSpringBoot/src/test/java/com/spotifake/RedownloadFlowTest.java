package com.spotifake;

import com.spotifake.model.ContentReport;
import com.spotifake.model.Song;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RedownloadFlowTest extends IntegrationTestBase {

    private static final org.springframework.test.web.servlet.request.RequestPostProcessor ADMIN_PORT = request -> {
        request.setLocalPort(9000);
        request.setServerPort(9000);
        return request;
    };

    private ContentReport report() throws Exception {
        mvc.perform(post("/api/music/report").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"songId\":\"" + SONG_ID + "\",\"reason\":\"Wrong Audio / Wrong Version\"}"))
                .andExpect(status().isOk());
        return repository.getAllContentReports("Pending").stream()
                .filter(r -> SONG_ID.equals(r.getSongId())).findFirst().orElseThrow();
    }

    @Test
    void reportKeepsTheStringSongIdAndShowsOnTheAdminPage() throws Exception {
        report();
        mvc.perform(get("/admin/dashboard/reports").header("Authorization", bearer("admin_test")).with(ADMIN_PORT))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/api/music/stream/" + SONG_ID)))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Re-download")));
    }

    @Test
    void onlyAdminsCanRedownload() throws Exception {
        int id = report().getId();
        mvc.perform(post("/admin/dashboard/reports/" + id + "/redownload").header("Authorization", bearer("user_test")).with(ADMIN_PORT))
                .andExpect(redirectedUrl("/Auth/Login?error=access_denied"));
    }

    @Test
    void songWithoutSpotifyLinkIsRefusedAndStaysPending() throws Exception {
        int id = report().getId();
        Song song = repository.getSongById(SONG_ID);
        assertThat(song.getSourceId() == null || song.getSourceId().isBlank()).isTrue();
        mvc.perform(post("/admin/dashboard/reports/" + id + "/redownload").header("Authorization", bearer("admin_test")).with(ADMIN_PORT))
                .andExpect(status().is3xxRedirection())
                .andExpect(flash().attributeExists("redownloadError"));
        assertThat(repository.getAllContentReports("Pending")).anyMatch(r -> r.getId() == id);
    }
}
