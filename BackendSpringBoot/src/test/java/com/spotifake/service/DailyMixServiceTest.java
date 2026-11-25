package com.spotifake.service;

import com.spotifake.model.Song;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class DailyMixServiceTest {

    private static final LocalDate DAY = LocalDate.of(2026, 1, 10);
    private static final Instant START = Instant.parse("2026-01-10T00:00:00Z");

    private static void add(List<Song> library, String artist, String language, String genre, int count) {
        for (int i = 0; i < count; i++) {
            Song s = new Song();
            s.setId(artist + "-" + i);
            s.setTitle(artist + " song " + i);
            s.setArtist(artist);
            s.setLanguage(language);
            s.setGenre(genre);
            s.setFilePath("uploads/" + artist + "-" + i + ".m4a");
            library.add(s);
        }
    }

    private static List<Song> library() {
        List<Song> library = new ArrayList<>();
        add(library, "Aiko", "ja", "J-Pop", 90);
        add(library, "Botan", "ja", "J-Pop", 90);
        add(library, "Chiyo", "ja", "Rock", 90);
        add(library, "Dana", "en", "Pop", 90);
        add(library, "Eve", "en", "J-Pop", 90);
        return library;
    }

    private static List<DailyMixService.Play> plays() {
        // One sitting: Aiko then Chiyo. The file path form is what old log rows hold.
        return List.of(
                new DailyMixService.Play("Aiko-0", START.minusSeconds(7200)),
                new DailyMixService.Play("uploads/Aiko-1.m4a", START.minusSeconds(7000)),
                new DailyMixService.Play("Chiyo-5", START.minusSeconds(6800)));
    }

    private static List<DailyMixService.Mix> build(LocalDate day) {
        return DailyMixService.build(library(), plays(), "u1", day, START);
    }

    @Test
    void mixNeverCrossesLanguagesAndLeadsWithThePlayedArtist() {
        DailyMixService.Mix first = build(DAY).get(0);

        assertThat(first.anchor()).isEqualTo("Aiko");
        assertThat(first.language()).isEqualTo("ja");
        assertThat(first.songIds()).noneMatch(id -> id.startsWith("Dana") || id.startsWith("Eve"));
    }

    @Test
    void sameGenreAndSameSittingSongsAreIncluded() {
        List<String> ids = build(DAY).get(0).songIds();

        assertThat(ids).filteredOn(id -> id.startsWith("Botan")).hasSizeBetween(6, 12); // capped per artist
        assertThat(ids).contains("Chiyo-5"); // different genre, but played in the same sitting
    }

    @Test
    void stableWithinADayAndNoSongTwice() {
        assertThat(build(DAY)).isEqualTo(build(DAY));
        assertThat(build(DAY.plusDays(1))).isNotEqualTo(build(DAY));

        List<String> all = build(DAY).stream().flatMap(m -> m.songIds().stream()).toList();
        assertThat(all).doesNotHaveDuplicates();
    }
}
