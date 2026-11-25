package com.spotifake;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The default app.uploads.dir is relative ("uploads"). Needs a real Tomcat: it resolves a relative
 * MultipartFile.transferTo target against its own temp folder, which MockMvc does not imitate.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {"management.server.port=0", "server.admin.port=0"})
class RelativeUploadDirTest {

    private static final Path RELATIVE_UPLOADS = Path.of("target", "relative-uploads-test");

    @DynamicPropertySource
    static void testProperties(DynamicPropertyRegistry registry) throws IOException {
        // Must exist up front: the repository falls back to ../backendai.db when app.db.path is missing
        Path db = Files.createFile(Files.createTempDirectory("spotifake-upload-test").resolve("test.db"));
        registry.add("app.db.path", db::toString);
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + db);
        registry.add("app.uploads.dir", RELATIVE_UPLOADS::toString);
        registry.add("spotifake.analysis.url", () -> "http://127.0.0.1:1");
    }

    @Autowired TestRestTemplate http;

    @Test
    void uploadIsSavedInsideTheRelativeUploadFolder() {
        byte[] audio = new byte[2048];
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("file", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return "Tester - Relative.mp3";
            }
        });

        ResponseEntity<Map> response = http.postForEntity("/api/music/upload", form, Map.class);

        assertThat(response.getStatusCode()).as("%s", response.getBody()).isEqualTo(HttpStatus.OK);
        Path saved = RELATIVE_UPLOADS.resolve(response.getBody().get("id") + ".mp3");
        assertThat(saved).exists().hasSize(audio.length);
    }
}
