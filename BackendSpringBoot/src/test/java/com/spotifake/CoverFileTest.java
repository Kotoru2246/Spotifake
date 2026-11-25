package com.spotifake;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CoverFileTest extends IntegrationTestBase {

    @Test
    void savedCoverIsServedFromTheUploadsFolder() throws Exception {
        Path covers = Files.createDirectories(UPLOADS_DIR.resolve("covers"));
        byte[] image = {1, 2, 3, 4};
        Files.write(covers.resolve("Test Song - Artist_cover.jpg"), image);

        mvc.perform(get("/uploads/covers/{name}", "Test Song - Artist_cover.jpg"))
           .andExpect(status().isOk())
           .andExpect(content().bytes(image));
    }
}
