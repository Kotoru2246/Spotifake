package com.spotifake;

import com.spotifake.config.JwtUtil;
import com.spotifake.model.Song;
import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.AopTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the full app against a throw-away SQLite file and uploads folder.
 * SpotifakeRepository falls back to ../backendai.db when app.db.path does not exist,
 * so the temp file is created up front and {@link #guardAgainstRealDatabase()} checks it is used.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class IntegrationTestBase {

    protected static final Path TEMP_DIR;
    protected static final Path DB_FILE;
    protected static final Path UPLOADS_DIR;
    protected static final String SONG_ID = "test-song-0001";
    protected static final String SONG_FILE = SONG_ID + ".mp3";
    protected static final int SONG_BYTES = 10_000;

    static {
        try {
            TEMP_DIR = Files.createTempDirectory("spotifake-test");
            DB_FILE = Files.createFile(TEMP_DIR.resolve("test.db"));
            UPLOADS_DIR = Files.createDirectories(TEMP_DIR.resolve("uploads"));
            byte[] audio = new byte[SONG_BYTES];
            for (int i = 0; i < audio.length; i++) audio[i] = (byte) (i % 251);
            Files.write(UPLOADS_DIR.resolve(SONG_FILE), audio);
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @DynamicPropertySource
    static void testProperties(DynamicPropertyRegistry registry) {
        registry.add("app.db.path", DB_FILE::toString);
        // The actuator health check queries the DataSource; keep it off the real database too
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DB_FILE);
        registry.add("app.uploads.dir", UPLOADS_DIR::toString);
        registry.add("spotifake.analysis.url", () -> "http://127.0.0.1:1"); // closed port: never reach a real analyzer
    }

    @Autowired protected MockMvc mvc;
    @Autowired protected SpotifakeRepository repository;
    @Autowired protected JwtUtil jwtUtil;

    @BeforeEach
    void guardAgainstRealDatabase() throws Exception {
        Field f = SpotifakeRepository.class.getDeclaredField("dbUrl");
        f.setAccessible(true);
        Object target = AopTestUtils.getUltimateTargetObject(repository); // @Repository beans are proxied
        assertThat((String) f.get(target)).isEqualTo("jdbc:sqlite:" + DB_FILE.toFile().getAbsolutePath());
        if (repository.getSongById(SONG_ID) == null) {
            Song song = new Song();
            song.setId(SONG_ID);
            song.setUserId("00000000-0000-0000-0000-000000000002");
            song.setTitle("Test Song");
            song.setArtist("Test Artist");
            song.setDurationMs(1000);
            song.setFilePath(SONG_FILE);
            song.setLyrics("[00:01.00] hello");
            repository.insertSong(song);
        }
    }

    /** Bearer header for one of the seeded accounts: user_test, artist_test, admin_test. */
    protected String bearer(String username) {
        User user = repository.getUserByUsername(username);
        assertThat(user).as("seeded user " + username).isNotNull();
        return "Bearer " + jwtUtil.generateToken(user);
    }
}
