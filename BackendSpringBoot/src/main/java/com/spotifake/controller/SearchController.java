package com.spotifake.controller;

import com.spotifake.model.Album;
import com.spotifake.model.ArtistProfile;
import com.spotifake.model.Song;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class SearchController {

    private final SpotifakeRepository repository;

    public SearchController(SpotifakeRepository repository) {
        this.repository = repository;
    }

    @GetMapping({"/api/search", "/search/global"})
    public Map<String, Object> search(@RequestParam(value = "q", required = false) String q,
                                      @RequestParam(value = "query", required = false) String query) {
        String searchTerm = q != null ? q : query;
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return Map.of("items", Collections.emptyList());
        }

        String lower = searchTerm.trim().toLowerCase();
        List<Map<String, Object>> items = new ArrayList<>();

        // 1. Songs via targeted query
        List<Song> songs = repository.searchSongs(lower, 15);
        for (Song s : songs) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "Song");
            item.put("Type", "Song");
            item.put("id", s.getId());
            item.put("Id", s.getId());
            item.put("title", s.getTitle());
            item.put("Title", s.getTitle());
            item.put("creator", s.getArtist() != null ? s.getArtist() : "Unknown");
            item.put("Creator", s.getArtist() != null ? s.getArtist() : "Unknown");
            item.put("imageUrl", s.getCoverArtUrl() != null ? s.getCoverArtUrl() : "");
            item.put("ImageUrl", s.getCoverArtUrl() != null ? s.getCoverArtUrl() : "");
            String fn = s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3";
            item.put("fileName", fn);
            item.put("FileName", fn);
            item.put("albumId", s.getAlbumId());
            item.put("AlbumId", s.getAlbumId());
            String artistIdentifier = s.getUserId() != null && !s.getUserId().isBlank() ? s.getUserId() : (s.getArtist() != null ? s.getArtist() : "");
            item.put("artistId", artistIdentifier);
            item.put("ArtistId", artistIdentifier);
            items.add(item);
        }

        // 2. Albums via targeted query
        List<Album> albums = repository.searchAlbums(lower, 8);
        Set<String> seenAlbumTitles = new HashSet<>();
        for (Album a : albums) {
            String titleKey = a.getTitle() != null ? a.getTitle().trim().toLowerCase() : "";
            if (!titleKey.isEmpty() && !seenAlbumTitles.add(titleKey)) {
                continue; // Prevent duplicate album entries
            }
            Map<String, Object> item = new HashMap<>();
            item.put("type", "Album");
            item.put("Type", "Album");
            item.put("id", a.getId());
            item.put("Id", a.getId());
            item.put("title", a.getTitle());
            item.put("Title", a.getTitle());
            item.put("creator", "Album");
            item.put("Creator", "Album");
            item.put("imageUrl", a.getCoverArtUrl() != null ? a.getCoverArtUrl() : "");
            item.put("ImageUrl", a.getCoverArtUrl() != null ? a.getCoverArtUrl() : "");
            item.put("fileName", "");
            item.put("FileName", "");
            items.add(item);
        }

        // 3. Playlists via targeted query
        List<Map<String, Object>> playlists = repository.searchPlaylists(lower);
        for (Map<String, Object> pl : playlists) {
            Map<String, Object> item = new HashMap<>();
            item.put("type", "Playlist");
            item.put("Type", "Playlist");
            item.put("id", pl.get("id"));
            item.put("Id", pl.get("id"));
            item.put("title", pl.get("name"));
            item.put("Title", pl.get("name"));
            String owner = (String) pl.get("ownerName");
            item.put("creator", owner != null && !owner.isEmpty() ? owner : "Playlist");
            item.put("Creator", owner != null && !owner.isEmpty() ? owner : "Playlist");
            item.put("imageUrl", pl.get("imageUrl") != null ? pl.get("imageUrl") : "");
            item.put("ImageUrl", pl.get("imageUrl") != null ? pl.get("imageUrl") : "");
            item.put("fileName", "");
            item.put("FileName", "");
            items.add(item);
        }

        // 4. Artists (from registered ArtistProfiles AND distinct artists in Songs library)
        Set<String> seenArtists = new HashSet<>();
        List<ArtistProfile> artists = repository.searchArtists(lower, 6);
        for (ArtistProfile ap : artists) {
            seenArtists.add(ap.getStageName().toLowerCase());
            Map<String, Object> item = new HashMap<>();
            item.put("type", "Artist");
            item.put("Type", "Artist");
            item.put("id", ap.getArtistId());
            item.put("Id", ap.getArtistId());
            item.put("title", ap.getStageName());
            item.put("Title", ap.getStageName());
            item.put("creator", "Artist");
            item.put("Creator", "Artist");
            item.put("imageUrl", ap.getProfileImageUrl() != null ? ap.getProfileImageUrl() : "");
            item.put("ImageUrl", ap.getProfileImageUrl() != null ? ap.getProfileImageUrl() : "");
            item.put("fileName", "");
            item.put("FileName", "");
            items.add(item);
        }

        List<Map<String, String>> distinctArtists = repository.searchDistinctSongArtists(lower, 8);
        for (Map<String, String> artMap : distinctArtists) {
            String cleanArt = artMap.get("artistName").trim();
            if (!seenArtists.contains(cleanArt.toLowerCase())) {
                seenArtists.add(cleanArt.toLowerCase());
                Map<String, Object> item = new HashMap<>();
                item.put("type", "Artist");
                item.put("Type", "Artist");
                item.put("id", cleanArt);
                item.put("Id", cleanArt);
                item.put("title", cleanArt);
                item.put("Title", cleanArt);
                item.put("creator", "Artist");
                item.put("Creator", "Artist");
                item.put("imageUrl", artMap.get("coverArtUrl"));
                item.put("ImageUrl", artMap.get("coverArtUrl"));
                item.put("fileName", "");
                item.put("FileName", "");
                items.add(item);
            }
        }

        // Sort exact matches to top
        items.sort((a, b) -> {
            String titleA = String.valueOf(a.get("title")).toLowerCase();
            String titleB = String.valueOf(b.get("title")).toLowerCase();
            boolean exactA = titleA.equals(lower);
            boolean exactB = titleB.equals(lower);
            if (exactA && !exactB) return -1;
            if (!exactA && exactB) return 1;
            return 0;
        });

        return Map.of("items", items);
    }
}
