package com.spotifake.service;

import com.spotifake.model.Album;
import com.spotifake.model.ArtistProfile;
import com.spotifake.model.Song;
import com.spotifake.model.User;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

/** Records which playlists/albums/artists a user plays from and ranks them for the Home shortcuts grid. */
@Service
public class ShortcutService {

    private static final Set<String> TYPES = Set.of("playlist", "album", "artist");
    private static final String[] BAD_PLAYLIST_PREFIXES = {"liked-songs-", "mix-", "this-is-", "radio-"};

    private final SpotifakeRepository repository;

    public ShortcutService(SpotifakeRepository repository) {
        this.repository = repository;
    }

    /**
     * Higher is better: recency in seconds (negative, relative to now) plus a small log-scaled frequency bonus.
     * The bonus is 5 minutes * ln(1 + plays) (about 3.5 min for 1 play, 12 min for 10, 23 min for 100), so the most
     * recent play comes first and frequency only breaks ties between plays a few minutes apart.
     */
    public static double score(long lastMs, int count, long nowMs) {
        return (lastMs - nowMs) / 1000.0 + 300 * Math.log(1 + count);
    }

    // ------------------------------------------------------------------ resolve

    /** Returns canonical id + display fields, or null when the context is invalid / not visible to the viewer. */
    public Map<String, Object> resolve(String type, String rawId, String viewerUserId) {
        if (type == null || rawId == null) return null;
        String raw = rawId.trim();
        if (raw.isEmpty() || raw.length() > 200) return null;
        switch (type.toLowerCase()) {
            case "playlist": return resolvePlaylist(raw, viewerUserId);
            case "album": return resolveAlbum(raw);
            case "artist": return resolveArtist(raw);
            default: return null;
        }
    }

    private Map<String, Object> resolvePlaylist(String id, String viewerUserId) {
        String lower = id.toLowerCase();
        for (String p : BAD_PLAYLIST_PREFIXES) if (lower.startsWith(p)) return null;
        String owner = repository.getPlaylistOwnerId(id);
        if (owner == null) return null;
        Map<String, Object> d = repository.getPlaylistMeta(id);
        if (d == null) return null;
        boolean isPublic = Boolean.TRUE.equals(d.get("isPublic"));
        if (!owner.equals(viewerUserId) && !isPublic) return null;

        User ownerUser = repository.getUserById(owner);
        String ownerName = ownerUser != null && ownerUser.getDisplayName() != null ? ownerUser.getDisplayName()
                : (ownerUser != null ? ownerUser.getUsername() : "");
        Object img = d.get("imageUrl");

        Map<String, Object> out = base("playlist", id, id);
        out.put("title", String.valueOf(d.get("name")));
        out.put("subtitle", "Playlist • " + ownerName);
        out.put("coverUrl", img != null ? img.toString() : "");
        out.put("playlistId", id);
        return out;
    }

    /** Fills coverMosaic for a resolved playlist tile (kept out of resolve() so record() stays cheap). */
    private void addMosaic(Map<String, Object> r) {
        if ("playlist".equals(r.get("type")) && r.get("playlistId") != null) {
            r.put("coverMosaic", mosaic(repository.getPlaylistCoverTracks((String) r.get("playlistId"), 20)));
        }
    }

    private List<String> mosaic(Object songsObj) {
        List<?> songs = songsObj instanceof List<?> l ? l : List.of();
        List<String> explicit = collect(songs, false);
        return !explicit.isEmpty() ? explicit : collect(songs, true);
    }

    private List<String> collect(List<?> songs, boolean fallback) {
        Set<String> seen = new HashSet<>();
        List<String> urls = new ArrayList<>();
        for (Object o : songs) {
            if (urls.size() >= 4) break;
            if (!(o instanceof Map<?, ?> s)) continue;
            String url;
            if (fallback) {
                Object sid = s.get("id");
                url = sid != null && !sid.toString().isEmpty() ? "/api/music/cover/" + sid : "";
            } else {
                Object c = s.get("coverArtUrl");
                url = c != null ? c.toString() : "";
            }
            if (url.isEmpty()) continue;
            Object alb = s.get("albumId");
            String key = alb != null && !alb.toString().isEmpty() ? "album:" + alb : url;
            if (!seen.add(key)) continue;
            urls.add(url);
        }
        return urls;
    }

    private Map<String, Object> resolveAlbum(String raw) {
        String id = raw;
        String low = id.toLowerCase();
        if (low.startsWith("alb-")) id = id.substring(4);
        else if (low.startsWith("album-")) id = id.substring(6);
        id = id.trim();
        if (id.isEmpty()) return null;

        Album a = repository.getAlbumById(id);
        if (a != null && !a.isDeleted()) {
            List<Song> songs = repository.getSongsByAlbum(a.getId());
            String artistName = null;
            if (a.getArtistId() != null) {
                ArtistProfile p = repository.getArtistProfileById(a.getArtistId());
                if (p != null) artistName = p.getStageName();
            }
            if ((artistName == null || artistName.isBlank()) && !songs.isEmpty()) artistName = songs.get(0).getArtist();
            String cover = a.getCoverArtUrl() != null && !a.getCoverArtUrl().isBlank() ? a.getCoverArtUrl()
                    : (!songs.isEmpty() ? "/api/music/cover/" + songs.get(0).getId() : "");
            Map<String, Object> out = base("album", a.getId(), a.getId());
            out.put("title", a.getTitle());
            out.put("subtitle", (artistName != null && !artistName.isBlank() ? artistName : "Unknown artist") + " • Album");
            out.put("coverUrl", cover);
            out.put("albumId", a.getId());
            return out;
        }

        String titleKey = id.toLowerCase().startsWith("title:") ? id.substring(6).trim() : id;
        if (titleKey.isEmpty()) return null;
        List<Song> songs = repository.getSongsByAlbum(titleKey);
        if (songs.isEmpty()) return null;
        String title = songs.get(0).getAlbum();
        if (title == null || title.isBlank()) return null;
        String tl = title.trim().toLowerCase();
        if (tl.equals("single") || tl.equals("unknown album")) return null;
        Song first = songs.get(0);
        String songAlbumId = first.getAlbumId();
        if (songAlbumId != null && !songAlbumId.isBlank() && !songAlbumId.equals(id)) {
            Album real = repository.getAlbumById(songAlbumId);
            if (real != null && !real.isDeleted()) return resolveAlbum(real.getId());
        }
        String artist = first.getArtist() != null ? first.getArtist() : "";
        Map<String, Object> out = base("album", "title:" + tl, title.trim());
        out.put("title", title.trim());
        out.put("subtitle", (artist.isBlank() ? "Unknown artist" : artist) + " • Album");
        out.put("coverUrl", first.getCoverArtUrl() != null && !first.getCoverArtUrl().isBlank()
                ? first.getCoverArtUrl() : "/api/music/cover/" + first.getId());
        return out;
    }

    private Map<String, Object> resolveArtist(String raw) {
        String id = raw;
        if (id.toLowerCase().startsWith("artist-")) id = id.substring(7);
        id = id.trim();
        if (id.toLowerCase().startsWith("name:")) id = id.substring(5).trim();
        if (id.isEmpty()) return null;

        ArtistProfile p = repository.getArtistProfileById(id);
        if (p == null) p = repository.getArtistProfileByUserId(id);
        if (p == null) p = repository.getArtistProfileByStageName(id);
        if (p != null && !"approved".equalsIgnoreCase(p.getStatus())) p = null;
        if (p != null) {
            if (p.isDeleted()) return null;
            String cover = p.getProfileImageUrl() != null ? p.getProfileImageUrl() : "";
            if (cover.isBlank()) {
                Song s = repository.findFirstSongByArtistName(p.getStageName());
                cover = s != null ? songCover(s) : "";
            }
            Map<String, Object> out = base("artist", p.getArtistId(), p.getArtistId());
            out.put("title", p.getStageName());
            out.put("subtitle", "Artist");
            out.put("coverUrl", cover);
            out.put("artistId", p.getArtistId());
            return out;
        }

        Song s = repository.findFirstSongByArtistName(id);
        if (s == null) return null;
        String display = s.getArtist() != null && s.getArtist().trim().equalsIgnoreCase(id) ? s.getArtist().trim() : id;
        Map<String, Object> out = base("artist", "name:" + id.toLowerCase(), display);
        out.put("title", display);
        out.put("subtitle", "Artist");
        out.put("coverUrl", songCover(s));
        out.put("artistId", display);
        return out;
    }

    private static String songCover(Song s) {
        return s.getCoverArtUrl() != null && !s.getCoverArtUrl().isBlank() ? s.getCoverArtUrl() : "/api/music/cover/" + s.getId();
    }

    private Map<String, Object> base(String type, String canonicalId, String openId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", type);
        m.put("id", canonicalId);
        m.put("openId", openId);
        m.put("title", "");
        m.put("subtitle", "");
        m.put("coverUrl", "");
        m.put("coverMosaic", List.of());
        m.put("playlistId", null);
        m.put("albumId", null);
        m.put("artistId", null);
        return m;
    }

    // ------------------------------------------------------------------ record / read

    public void record(String userId, String type, String id) {
        if (userId == null || type == null || id == null) return;
        String t = type.trim().toLowerCase();
        if (!TYPES.contains(t)) return;
        Map<String, Object> r = resolve(t, id, userId);
        if (r == null) return;
        repository.upsertUserPlayContext(userId, t, (String) r.get("id"), System.currentTimeMillis());
    }

    public List<Map<String, Object>> getShortcuts(User user, Integer limitParam) {
        if (user == null) return List.of();
        int limit = limitParam == null ? 8 : Math.max(1, Math.min(20, limitParam));
        long now = System.currentTimeMillis();
        List<Map<String, Object>> rows = new ArrayList<>(repository.getUserPlayContexts(user.getId(), 50));
        List<Map<String, Object>> out = new ArrayList<>();

        if (rows.isEmpty()) {
            for (Map<String, Object> pl : repository.getUserPlaylists(user.getUsername())) {
                if (out.size() >= limit) break;
                String pid = String.valueOf(pl.get("id"));
                if (pid.startsWith("liked-songs-")) continue;
                Map<String, Object> r = resolve("playlist", pid, user.getId());
                if (r == null) continue;
                addMosaic(r);
                r.put("playCount", 0);
                r.put("lastPlayedAt", null);
                out.add(r);
            }
            return out;
        }

        rows.sort((a, b) -> Double.compare(
                score((Long) b.get("lastPlayedAt"), (Integer) b.get("playCount"), now),
                score((Long) a.get("lastPlayedAt"), (Integer) a.get("playCount"), now)));
        for (Map<String, Object> row : rows) {
            if (out.size() >= limit) break;
            Map<String, Object> r = resolve((String) row.get("type"), (String) row.get("id"), user.getId());
            if (r == null) continue;
            addMosaic(r);
            r.put("playCount", row.get("playCount"));
            r.put("lastPlayedAt", Instant.ofEpochMilli((Long) row.get("lastPlayedAt")).toString());
            out.add(r);
        }
        return out;
    }
}
