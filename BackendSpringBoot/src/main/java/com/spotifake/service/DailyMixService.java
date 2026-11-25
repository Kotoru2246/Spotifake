package com.spotifake.service;

import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Daily mixes, built like smart shuffle: a few seed songs by an anchor artist, then every
 * other song of the same language is scored on genre, shared listening sittings, sound and
 * artist, in that order of importance. The result depends only on the user, the date and
 * plays from before today, so it is the same on every device all day.
 */
@Service
public class DailyMixService {

    static final int MIXES = 4;
    static final int MIX_SIZE = 50;
    private static final int ANCHOR_SONGS = 15;
    private static final int PER_ARTIST = 6;
    private static final int SEEDS = 5;
    private static final int SONGS_PER_EXTRA_MIX = 200;
    private static final Duration SITTING_GAP = Duration.ofMinutes(30);
    static final Pattern LIVE_OR_BACKING = Pattern.compile(
            "(?i)(\\blive\\b|instrumental|karaoke|off vocal|a ?cappella|acapella)");

    public record Play(String songKey, Instant at) {}

    public record Mix(String id, String title, String anchor, String language, String description, List<String> songIds) {}

    private final SpotifakeRepository repository;

    public DailyMixService(SpotifakeRepository repository) {
        this.repository = repository;
    }

    public List<Mix> mixesFor(String userId) {
        LocalDate today = LocalDate.now();
        return build(repository.getAllSongs(), repository.getPlays(userId),
                userId, today, today.atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    static List<Mix> build(List<Song> library, List<Play> allPlays, String userId, LocalDate date, Instant startOfDay) {
        List<Song> songs = new ArrayList<>();
        for (Song s : library) {
            if (!s.isDeleted() && s.getLanguage() != null && !s.getLanguage().isBlank()) songs.add(s);
        }
        if (songs.isEmpty()) return List.of();
        songs.sort(Comparator.comparing(Song::getId)); // stable input for the seeded random
        Random random = new Random(Objects.hash(userId, date.toString()));

        // Play logs hold either a song ID or a file path.
        Map<String, Song> byKey = new HashMap<>();
        for (Song s : songs) {
            byKey.put(s.getId(), s);
            if (s.getFilePath() != null) byKey.put(s.getFilePath(), s);
        }
        List<Play> plays = new ArrayList<>();
        for (Play p : allPlays) if (byKey.containsKey(p.songKey()) && p.at().isBefore(startOfDay)) plays.add(p);
        // A new listener has nothing from before today; use what there is.
        if (plays.isEmpty()) for (Play p : allPlays) if (byKey.containsKey(p.songKey())) plays.add(p);
        plays.sort(Comparator.comparing(Play::at));

        Map<String, Integer> playCount = new HashMap<>();
        Map<String, Double> artistWeight = new HashMap<>();
        List<Set<String>> sittings = sittings(plays, byKey);
        for (Play p : plays) {
            Song s = byKey.get(p.songKey());
            playCount.merge(s.getId(), 1, Integer::sum);
            double ageDays = Math.max(0, Duration.between(p.at(), startOfDay).toHours() / 24.0);
            artistWeight.merge(artist(s), Math.exp(-ageDays / 30.0), Double::sum);
        }

        Map<String, List<Song>> byArtist = new TreeMap<>();
        for (Song s : songs) byArtist.computeIfAbsent(artist(s), k -> new ArrayList<>()).add(s);

        List<Mix> mixes = new ArrayList<>();
        Set<String> used = new HashSet<>();
        for (String anchor : anchors(byArtist, artistWeight, random)) {
            Mix mix = mix(mixes.size() + 1, anchor, byArtist.get(anchor), songs, playCount, sittings, used, random);
            if (mix != null) mixes.add(mix);
        }
        return mixes;
    }

    /** Plays with less than {@link #SITTING_GAP} between them form one sitting. Expects plays oldest first. */
    private static List<Set<String>> sittings(List<Play> plays, Map<String, Song> byKey) {
        List<Set<String>> sittings = new ArrayList<>();
        Instant previous = null;
        for (Play p : plays) {
            if (previous == null || Duration.between(previous, p.at()).compareTo(SITTING_GAP) > 0) {
                sittings.add(new HashSet<>());
            }
            sittings.get(sittings.size() - 1).add(byKey.get(p.songKey()).getId());
            previous = p.at();
        }
        return sittings;
    }

    private static Map<String, Integer> together(List<Set<String>> sittings, Set<String> seedIds) {
        Map<String, Integer> together = new HashMap<>();
        for (Set<String> sitting : sittings) {
            if (Collections.disjoint(sitting, seedIds)) continue;
            for (String id : sitting) together.merge(id, 1, Integer::sum);
        }
        return together;
    }

    /** For each song, how many of the user's sittings it shared with one of the seeds. */
    static Map<String, Integer> playedTogether(Collection<Song> songs, List<Play> allPlays, Set<String> seedIds) {
        Map<String, Song> byKey = new HashMap<>();
        for (Song s : songs) {
            byKey.put(s.getId(), s);
            if (s.getFilePath() != null) byKey.put(s.getFilePath(), s);
        }
        List<Play> plays = new ArrayList<>();
        for (Play p : allPlays) if (byKey.containsKey(p.songKey())) plays.add(p);
        plays.sort(Comparator.comparing(Play::at));
        return together(sittings(plays, byKey), seedIds);
    }

    public Map<String, Integer> playedTogether(String userId, Collection<Song> songs, Set<String> seedIds) {
        return playedTogether(songs, repository.getPlays(userId), seedIds);
    }

    /** Favourite artists first, preferring ones that differ in language or genre; the library fills any gap. */
    private static List<String> anchors(Map<String, List<Song>> byArtist, Map<String, Double> weight, Random random) {
        List<String> ranked = new ArrayList<>(weight.keySet());
        ranked.sort(Comparator.<String>comparingDouble(a -> -weight.get(a)).thenComparing(a -> a));
        List<String> others = new ArrayList<>();
        for (var e : byArtist.entrySet()) {
            if (!weight.containsKey(e.getKey()) && e.getValue().size() >= 10) others.add(e.getKey());
        }
        Collections.shuffle(others, random);

        // A small language library only fills one mix; two would be nearly the same songs.
        Map<String, Integer> librarySize = new HashMap<>();
        for (List<Song> list : byArtist.values()) {
            for (Song s : list) librarySize.merge(s.getLanguage(), 1, Integer::sum);
        }
        Map<String, Integer> perLanguage = new HashMap<>();
        List<String> chosen = new ArrayList<>();
        Set<String> tastes = new HashSet<>();
        for (boolean newTasteOnly : new boolean[]{true, false}) {
            for (List<String> source : List.of(ranked, others)) {
                for (String a : source) {
                    if (chosen.size() >= MIXES || chosen.contains(a)) continue;
                    String language = mostCommon(byArtist.get(a).stream().map(Song::getLanguage).toList());
                    int room = Math.max(1, librarySize.get(language) / SONGS_PER_EXTRA_MIX);
                    if (perLanguage.getOrDefault(language, 0) >= room) continue;
                    if (!tastes.add(taste(byArtist.get(a))) && newTasteOnly) continue;
                    perLanguage.merge(language, 1, Integer::sum);
                    chosen.add(a);
                }
            }
        }
        return chosen;
    }

    private static Mix mix(int number, String anchor, List<Song> anchorSongs, List<Song> songs,
                           Map<String, Integer> playCount, List<Set<String>> sittings,
                           Set<String> used, Random random) {
        String language = mostCommon(anchorSongs.stream().map(Song::getLanguage).toList());

        List<Song> own = new ArrayList<>();
        for (Song s : anchorSongs) if (eligible(s, language, playCount, used)) own.add(s);
        if (own.isEmpty()) return null;
        Collections.shuffle(own, random);
        own.sort(Comparator.comparingInt(s -> -playCount.getOrDefault(s.getId(), 0)));
        List<Song> seeds = new ArrayList<>(own.subList(0, Math.min(SEEDS, own.size())));

        Set<String> genres = new HashSet<>();
        Set<String> people = new HashSet<>();
        Set<String> seedIds = new HashSet<>();
        for (Song s : seeds) {
            genres.addAll(split(s.getGenre()));
            people.addAll(people(s));
            seedIds.add(s.getId());
        }
        Map<String, Integer> together = together(sittings, seedIds);
        int mostTogether = together.values().stream().mapToInt(Integer::intValue).max().orElse(1);

        List<Song> candidates = new ArrayList<>();
        for (Song s : songs) {
            if (!artist(s).equals(anchor) && eligible(s, language, playCount, used)) candidates.add(s);
        }
        Map<String, Double> sound = RecommendationService.soundSimilarity(seeds, candidates);
        Map<String, Double> score = new HashMap<>();
        for (Song s : candidates) {
            double value = 0;
            if (!Collections.disjoint(split(s.getGenre()), genres)) value += 0.40;
            value += 0.30 * together.getOrDefault(s.getId(), 0) / mostTogether;
            value += 0.20 * sound.getOrDefault(s.getId(), 0.0);
            if (!Collections.disjoint(people(s), people)) value += 0.10;
            // Day-to-day variety, kept well below the gap a genre match makes.
            value += 0.15 * random.nextDouble();
            score.put(s.getId(), value);
        }
        candidates.sort(Comparator.comparingDouble(s -> -score.get(s.getId())));

        // The anchor's part: some familiar favourites, the rest picked freshly each day.
        List<Song> anchorPick = new ArrayList<>();
        Set<String> titles = new HashSet<>();
        List<Song> ownOrder = new ArrayList<>(own.subList(0, Math.min(ANCHOR_SONGS / 2, own.size())));
        List<Song> rest = new ArrayList<>(own.subList(ownOrder.size(), own.size()));
        Collections.shuffle(rest, random);
        ownOrder.addAll(rest);
        for (Song s : ownOrder) {
            if (anchorPick.size() < ANCHOR_SONGS && titles.add(titleKey(s))) anchorPick.add(s);
        }

        List<Song> related = new ArrayList<>();
        Map<String, Integer> perArtist = new HashMap<>();
        // A second pass with a looser cap fills mixes in languages with few artists.
        for (int cap : new int[]{PER_ARTIST, 2 * PER_ARTIST}) {
            for (Song s : candidates) {
                if (anchorPick.size() + related.size() >= MIX_SIZE) break;
                if (perArtist.getOrDefault(artist(s), 0) >= cap || !titles.add(titleKey(s))) continue;
                perArtist.merge(artist(s), 1, Integer::sum);
                related.add(s);
            }
        }

        List<Song> all = new ArrayList<>(anchorPick);
        all.addAll(related);
        Collections.shuffle(all, random);
        spreadArtists(all);
        for (Song s : all) used.add(titleKey(s));

        List<String> names = new ArrayList<>();
        names.add(anchor);
        perArtist.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .limit(2).forEach(e -> names.add(e.getKey()));
        return new Mix("mix-daily-" + number, "Daily Mix " + number, anchor, language,
                String.join(", ", names) + " and more", all.stream().map(Song::getId).toList());
    }

    private static boolean eligible(Song s, String language, Map<String, Integer> playCount, Set<String> used) {
        if (!language.equals(s.getLanguage()) || used.contains(titleKey(s))) return false;
        // Live and backing versions only when the listener has actually played them.
        return playCount.containsKey(s.getId())
                || !LIVE_OR_BACKING.matcher(s.getTitle() + " | " + Objects.toString(s.getAlbum(), "")).find();
    }

    private static void spreadArtists(List<Song> list) {
        for (int i = 1; i < list.size(); i++) {
            if (!artist(list.get(i)).equals(artist(list.get(i - 1)))) continue;
            for (int j = i + 1; j < list.size(); j++) {
                if (!artist(list.get(j)).equals(artist(list.get(i - 1)))) {
                    Collections.swap(list, i, j);
                    break;
                }
            }
        }
    }

    static String artist(Song s) {
        String name = Objects.toString(s.getArtist(), "").split("[/,;]")[0].trim();
        return name.isEmpty() ? "Unknown Artist" : name;
    }

    static Set<String> people(Song s) {
        Set<String> out = split(Objects.toString(s.getArtist(), "").replace('/', ','));
        out.addAll(split(s.getCollabArtists()));
        return out;
    }

    private static Set<String> split(String csv) {
        Set<String> out = new HashSet<>();
        if (csv == null) return out;
        for (String part : csv.split("[,;]")) {
            String t = part.trim().toLowerCase(Locale.ROOT);
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }

    /** Same song on another release or as a remix or version counts once. */
    public static String titleKey(Song s) {
        String title = Objects.toString(s.getTitle(), "").toLowerCase(Locale.ROOT)
                .replaceAll("\\(.*?\\)|\\[.*?]| - .*$", "").trim();
        return title + "|" + artist(s).toLowerCase(Locale.ROOT);
    }

    private static String taste(List<Song> songs) {
        return mostCommon(songs.stream().map(Song::getLanguage).toList()) + "|"
                + mostCommon(songs.stream().map(s -> Objects.toString(s.getGenre(), "").split(",")[0].trim()).toList());
    }

    private static String mostCommon(List<String> values) {
        Map<String, Integer> counts = new TreeMap<>();
        for (String v : values) counts.merge(v, 1, Integer::sum);
        return Collections.max(counts.entrySet(), Map.Entry.comparingByValue()).getKey();
    }
}
