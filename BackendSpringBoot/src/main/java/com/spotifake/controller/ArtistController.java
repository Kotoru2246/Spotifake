package com.spotifake.controller;

import com.spotifake.model.*;
import com.spotifake.repository.SpotifakeRepository;
import com.spotifake.service.SongService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Controller
@RequestMapping("/artist")
public class ArtistController {

    private final SpotifakeRepository repository;
    private final SongService songService;

    private final com.spotifake.service.AudioAnalysisService audioAnalysisService;

    public ArtistController(SpotifakeRepository repository, SongService songService,
                            com.spotifake.service.AudioAnalysisService audioAnalysisService) {
        this.audioAnalysisService = audioAnalysisService;
        this.repository = repository;
        this.songService = songService;
    }

    private User getEffectiveArtistUser(User authUser) {
        if (authUser != null) return authUser;
        return repository.getUserByUsername("artist_test");
    }

    private static boolean isAdmin(User u) {
        return u != null && "ADMIN".equalsIgnoreCase(u.getRole());
    }

    /** True if the caller is an admin or the album belongs to the caller's artist id. */
    private boolean canManageAlbum(User authUser, String albumId) {
        if (authUser == null) return false;
        Album album = repository.getAlbumById(albumId);
        if (album == null || !album.getId().equals(albumId)) return false;
        if (isAdmin(authUser)) return true;
        ArtistProfile profile = repository.getArtistProfileByUserId(authUser.getId());
        String artistId = profile != null ? profile.getArtistId() : authUser.getId();
        return artistId != null && artistId.equals(album.getArtistId());
    }

    /** True if the caller is an admin or uploaded the song (same rule as the songs list page). */
    private boolean canManageSong(User authUser, String songId) {
        if (authUser == null) return false;
        Song song = repository.getSongById(songId);
        if (song == null || !song.getId().equals(songId)) return false;
        return isAdmin(authUser) || authUser.getId().equals(song.getUserId());
    }

    @GetMapping({"/manager", "/dashboard"})
    public String dashboard(@AuthenticationPrincipal User authUser, Model model) {
        User user = getEffectiveArtistUser(authUser);
        Map<String, Object> stats = repository.getArtistDashboardStats(user.getId());
        ArtistProfile profile = repository.getArtistProfileByUserId(user.getId());

        model.addAttribute("stats", stats);
        model.addAttribute("profile", profile);
        model.addAttribute("artistUser", user);
        model.addAttribute("activeTab", "dashboard");
        return "Artist/Dashboard";
    }

    @GetMapping({"/manager/studio", "/studio"})
    public String studio(@AuthenticationPrincipal User authUser, Model model) {
        User user = getEffectiveArtistUser(authUser);
        ArtistProfile profile = repository.getArtistProfileByUserId(user.getId());
        model.addAttribute("profile", profile);
        model.addAttribute("artistUser", user);
        model.addAttribute("activeTab", "studio");
        return "Artist/Studio";
    }


    @GetMapping({"/manager/albums", "/albums"})
    public String albums(@AuthenticationPrincipal User authUser, Model model) {
        User user = getEffectiveArtistUser(authUser);
        ArtistProfile profile = repository.getArtistProfileByUserId(user.getId());
        String artistId = profile != null ? profile.getArtistId() : user.getId();
        List<Album> albumList = repository.getAlbumsByArtist(artistId);

        model.addAttribute("albums", albumList);
        model.addAttribute("profile", profile);
        model.addAttribute("activeTab", "albums");
        return "Artist/Albums";
    }

    @PostMapping({"/manager/albums/create", "/albums/create"})
    public String createAlbum(@AuthenticationPrincipal User authUser,
                              @RequestParam String title,
                              @RequestParam(required = false) String description,
                              @RequestParam(value = "coverArt", required = false) MultipartFile coverArt) throws IOException {
        User user = getEffectiveArtistUser(authUser);
        ArtistProfile profile = repository.getArtistProfileByUserId(user.getId());
        String artistId = profile != null ? profile.getArtistId() : user.getId();

        byte[] coverBytes = (coverArt != null && !coverArt.isEmpty()) ? coverArt.getBytes() : null;
        repository.createAlbum(artistId, title, description, "", coverBytes);
        return "redirect:/artist/manager/albums";
    }

    @PostMapping({"/manager/albums/{id}/delete", "/albums/{id}/delete"})
    public String deleteAlbum(@AuthenticationPrincipal User authUser, @PathVariable String id) {
        if (!canManageAlbum(authUser, id)) return "redirect:/artist/manager/albums?error=forbidden";
        repository.deleteAlbum(id);
        return "redirect:/artist/manager/albums";
    }

    @PostMapping({"/manager/albums/{id}/update", "/albums/{id}/update"})
    public String updateAlbum(@AuthenticationPrincipal User authUser,
                              @PathVariable String id,
                              @RequestParam(required = false) String title,
                              @RequestParam(required = false) String description,
                              @RequestParam(required = false) String coverArtUrl) {
        if (!canManageAlbum(authUser, id)) return "redirect:/artist/manager/albums?error=forbidden";
        repository.updateAlbum(id,
                (title != null && !title.isBlank()) ? title : null,
                description,
                (coverArtUrl != null && !coverArtUrl.isBlank()) ? coverArtUrl : null);
        return "redirect:/artist/manager/albums";
    }

    @GetMapping({"/manager/songs", "/songs"})
    public String songs(@AuthenticationPrincipal User authUser, Model model) {
        User user = getEffectiveArtistUser(authUser);
        List<Song> all = repository.getAllSongs();
        List<Song> artistSongs = new ArrayList<>();
        for (Song s : all) {
            if (user.getId().equals(s.getUserId())) {
                artistSongs.add(s);
            }
        }
        model.addAttribute("songs", artistSongs);
        model.addAttribute("activeTab", "songs");
        return "Artist/Songs";
    }

    @PostMapping({"/manager/songs/upload", "/songs/upload"})
    public String uploadSong(@AuthenticationPrincipal User authUser,
                             @RequestParam("audioFile") MultipartFile audioFile,
                             @RequestParam(value = "albumId", required = false) String albumId) {
        User user = getEffectiveArtistUser(authUser);
        if (audioFile == null || audioFile.isEmpty()) return "redirect:/artist/manager/songs?error=nofile";
        ArtistProfile profile = repository.getArtistProfileByUserId(user.getId());
        String artistName = profile != null && profile.getStageName() != null ? profile.getStageName() : user.getUsername();
        try {
            Song song = songService.uploadSong(audioFile, null, null, artistName, null, null, user.getId());
            if (song != null) audioAnalysisService.analyzeAsync(song.getId());
            if (song != null && albumId != null && !albumId.isBlank() && canManageAlbum(authUser, albumId)) {
                Album album = repository.getAlbumById(albumId);
                Map<String, Object> fields = new HashMap<>();
                fields.put("AlbumID", album.getId());
                fields.put("Album", album.getTitle());
                repository.updateSong(song.getId(), fields);
            }
        } catch (Exception e) {
            return "redirect:/artist/manager/songs?error=upload";
        }
        return "redirect:/artist/manager/songs";
    }

    @PostMapping({"/manager/songs/{id}/edit", "/songs/{id}/edit"})
    public String editSong(@AuthenticationPrincipal User authUser,
                           @PathVariable String id,
                           @RequestParam(required = false) String title,
                           @RequestParam(required = false) String mood,
                           @RequestParam(required = false) String language,
                           @RequestParam(required = false) String tags,
                           @RequestParam(required = false) String lyrics,
                           @RequestParam(value = "customGenre", required = false) String genre,
                           @RequestParam(required = false) String credits) {
        if (!canManageSong(authUser, id)) return "redirect:/artist/manager/songs?error=forbidden";
        Map<String, Object> fields = new HashMap<>();
        if (genre != null) fields.put("Genre", genre);
        if (credits != null) fields.put("Credits", credits);
        if (title != null) fields.put("Title", title);
        if (mood != null) fields.put("Mood", mood);
        if (language != null) fields.put("Language", language);
        if (tags != null) fields.put("Tags", tags);
        if (lyrics != null) fields.put("Lyrics", lyrics);
        repository.updateSong(id, fields);
        return "redirect:/artist/manager/songs";
    }

    @PostMapping({"/manager/songs/{id}/delete", "/songs/{id}/delete"})
    public String deleteSong(@AuthenticationPrincipal User authUser, @PathVariable String id) {
        if (!canManageSong(authUser, id)) return "redirect:/artist/manager/songs?error=forbidden";
        repository.deleteSong(id);
        return "redirect:/artist/manager/songs";
    }

    @GetMapping({"/manager/profile", "/profile"})
    public String profile(@AuthenticationPrincipal User authUser, Model model) {
        User user = getEffectiveArtistUser(authUser);
        ArtistProfile prof = repository.getArtistProfileByUserId(user.getId());
        model.addAttribute("profile", prof);
        model.addAttribute("artistUser", user);
        model.addAttribute("activeTab", "profile");
        return "Artist/Profile";
    }

    @PostMapping({"/manager/profile", "/profile"})
    public String updateProfile(@AuthenticationPrincipal User authUser,
                                @RequestParam(required = false) String stageName,
                                @RequestParam(required = false) String bio,
                                @RequestParam(required = false) String website,
                                @RequestParam(required = false) String genre,
                                @RequestParam(required = false) String nationality) {
        User user = getEffectiveArtistUser(authUser);
        Map<String, Object> data = new HashMap<>();
        if (stageName != null) data.put("StageName", stageName);
        if (bio != null) data.put("Bio", bio);
        if (website != null) data.put("Website", website);
        if (genre != null) data.put("Genre", genre);
        if (nationality != null) data.put("Nationality", nationality);
        repository.updateArtistProfile(user.getId(), data);
        return "redirect:/artist/manager/profile";
    }

    @GetMapping("/register")
    public String registerPage(@AuthenticationPrincipal User user, Model model) {
        if (user == null) return "redirect:/Auth/Login?returnUrl=/artist/register";
        model.addAttribute("user", user);
        return "Artist/Register";
    }

    @PostMapping("/register")
    public String submitArtistApplication(@AuthenticationPrincipal User authUser,
                                          @RequestParam String stageName,
                                          @RequestParam(required = false) String bio,
                                          @RequestParam(value = "cv", required = false) MultipartFile cv,
                                          @RequestParam(value = "demo", required = false) MultipartFile demo,
                                          Model model) throws IOException {
        if (authUser == null) return "redirect:/Auth/Login?returnUrl=/artist/register";
        User user = authUser;
        String cvName = cv != null ? cv.getOriginalFilename() : "resume.pdf";
        byte[] cvData = cv != null ? cv.getBytes() : null;
        String demoName = demo != null ? demo.getOriginalFilename() : "demo.mp3";
        byte[] demoData = demo != null ? demo.getBytes() : null;

        repository.createArtistRequest(user.getId(), stageName, bio, cvName, cvData, demoName, demoData);
        model.addAttribute("successMessage", "Your artist application has been submitted and is pending administrator review.");
        return "Artist/Register";
    }

    @GetMapping("/pending")
    public String pendingPage() {
        return "Artist/Pending";
    }

    // Canonical JSON route is /api/artists (ArtistApiController delegates here).
    @GetMapping("/details") // legacy alias for spotifake_mobile (?name=...)
    @ResponseBody
    public ResponseEntity<?> getArtistDetails(@PathVariable(required = false) String artistId,
                                              @RequestParam(value = "artistId", required = false) String artistParam,
                                              @RequestParam(value = "name", required = false) String nameParam) {
        String effectiveId = artistId;
        if (effectiveId == null || effectiveId.trim().isEmpty() || "undefined".equalsIgnoreCase(effectiveId)) {
            effectiveId = artistParam != null && !artistParam.trim().isEmpty() ? artistParam : nameParam;
        }
        if (effectiveId == null || effectiveId.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Artist ID or name is required"));
        }

        // If artist has collab slashes (e.g. Sam Smith/Calvin Harris), keep original but also prepare primary
        String primaryArtist = effectiveId;
        if (primaryArtist.contains("/")) {
            primaryArtist = primaryArtist.split("/")[0].trim();
        }

        ArtistProfile profile = repository.getArtistProfileById(effectiveId);
        if (profile == null) {
            profile = repository.getArtistProfileByUserId(effectiveId);
        }
        if (profile == null) {
            profile = repository.getArtistProfileByStageName(effectiveId);
        }
        if (profile == null && !primaryArtist.equals(effectiveId)) {
            profile = repository.getArtistProfileByStageName(primaryArtist);
        }

        String stageName = profile != null ? profile.getStageName() : (primaryArtist.isEmpty() ? effectiveId : primaryArtist);
        String bannerUrl = "";
        String profileUrl = "";
        boolean verified = false;

        if (profile != null) {
            stageName = profile.getStageName();
            bannerUrl = profile.getBannerImageUrl() != null ? profile.getBannerImageUrl() : "";
            profileUrl = profile.getProfileImageUrl() != null ? profile.getProfileImageUrl() : "";
            verified = profile.isVerified();
        }

        List<Song> allSongs = repository.getAllSongs();
        List<Map<String, Object>> popularSongs = new ArrayList<>();
        final String finalArtistName = stageName;
        final String searchFallback = primaryArtist;

        for (Song s : allSongs) {
            if (s.isDeleted()) continue;
            boolean match = (profile != null && profile.getUserId().equals(s.getUserId())) ||
                            (s.getArtist() != null && (s.getArtist().equalsIgnoreCase(finalArtistName) || s.getArtist().equalsIgnoreCase(searchFallback))) ||
                            (s.getArtist() != null && (s.getArtist().toLowerCase().contains(finalArtistName.toLowerCase()) || s.getArtist().toLowerCase().contains(searchFallback.toLowerCase())));
            if (match) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", s.getId());
                map.put("title", s.getTitle());
                map.put("artist", s.getArtist());
                map.put("collabArtists", s.getCollabArtists() != null ? s.getCollabArtists() : "");
                map.put("album", s.getAlbum() != null ? s.getAlbum() : "");
                map.put("coverUrl", s.getCoverArtUrl() != null ? s.getCoverArtUrl() : "");
                String fn = s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3";
                map.put("fileName", fn);
                map.put("playCount", s.getPlayCount());
                map.put("duration", Math.round((s.getDurationMs() != 0 ? s.getDurationMs() : 180000) / 1000.0));
                popularSongs.add(map);
            }
        }

        int listeners = 688300;
        if (profile != null && profile.getFollowersCount() > 0) {
            listeners = profile.getFollowersCount();
        } else if (!popularSongs.isEmpty()) {
            listeners = 350000 + (popularSongs.size() * 45000);
        }

        popularSongs.sort((a, b) -> {
            long countA = ((Number) a.getOrDefault("playCount", 0)).longValue();
            long countB = ((Number) b.getOrDefault("playCount", 0)).longValue();
            return Long.compare(countB, countA);
        });

        // Ensure realistic Spotify-style stream numbers if play count is fresh
        for (int i = 0; i < popularSongs.size(); i++) {
            Map<String, Object> item = popularSongs.get(i);
            long pc = ((Number) item.getOrDefault("playCount", 0)).longValue();
            if (pc <= 0) {
                long baseStream = (long)(listeners * (15.0 - Math.min(i, 9) * 1.35));
                long realisticPlays = baseStream + (Math.abs(item.get("title").hashCode()) % 150000);
                item.put("playCount", realisticPlays);
            }
        }

        if (popularSongs.size() > 10) {
            popularSongs = popularSongs.subList(0, 10);
        }

        // Track counts per album name from Songs
        Map<String, List<Song>> albumSongsMap = new LinkedHashMap<>();
        for (Song s : allSongs) {
            if (s.isDeleted()) continue;
            boolean match = (profile != null && profile.getUserId().equals(s.getUserId())) ||
                            (s.getArtist() != null && (s.getArtist().equalsIgnoreCase(finalArtistName) || s.getArtist().equalsIgnoreCase(searchFallback))) ||
                            (s.getArtist() != null && (s.getArtist().toLowerCase().contains(finalArtistName.toLowerCase()) || s.getArtist().toLowerCase().contains(searchFallback.toLowerCase())));
            if (match && s.getAlbum() != null && !s.getAlbum().trim().isEmpty()) {
                albumSongsMap.computeIfAbsent(s.getAlbum().trim(), k -> new ArrayList<>()).add(s);
            }
        }

        List<Album> albums = repository.getAlbumsByArtistNameOrId(stageName);
        if (albums.isEmpty() && !primaryArtist.equals(stageName)) {
            albums = repository.getAlbumsByArtistNameOrId(primaryArtist);
        }
        if (albums.isEmpty() && profile != null) {
            albums = repository.getAlbumsByArtistNameOrId(profile.getArtistId());
        }

        List<Map<String, Object>> discography = new ArrayList<>();
        Set<String> seenAlbums = new HashSet<>();

        for (Album a : albums) {
            if (a.isDeleted() || seenAlbums.contains(a.getTitle().toLowerCase())) continue;
            seenAlbums.add(a.getTitle().toLowerCase());
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("title", a.getTitle());
            int songCount = albumSongsMap.containsKey(a.getTitle().trim()) ? albumSongsMap.get(a.getTitle().trim()).size() : 1;
            String type = songCount >= 4 ? "Album" : (songCount >= 2 ? "EP" : "Single");
            map.put("type", type);
            map.put("songCount", songCount);
            map.put("coverUrl", a.getCoverArtUrl() != null && !a.getCoverArtUrl().isEmpty() ? a.getCoverArtUrl() : "");
            String year = a.getCreatedAt() != null && a.getCreatedAt().length() >= 4 ? a.getCreatedAt().substring(0, 4) : "2024";
            map.put("year", year);
            discography.add(map);
        }

        for (Map.Entry<String, List<Song>> entry : albumSongsMap.entrySet()) {
            String albName = entry.getKey();
            if (seenAlbums.contains(albName.toLowerCase())) continue;
            seenAlbums.add(albName.toLowerCase());
            List<Song> sList = entry.getValue();
            Song first = sList.get(0);
            Map<String, Object> map = new HashMap<>();
            map.put("id", first.getAlbumId() != null && !first.getAlbumId().isEmpty() ? first.getAlbumId() : "alb-" + albName);
            map.put("title", albName);
            int songCount = sList.size();
            String type = songCount >= 4 ? "Album" : (songCount >= 2 ? "EP" : "Single");
            map.put("type", type);
            map.put("songCount", songCount);
            map.put("coverUrl", first.getCoverArtUrl() != null && !first.getCoverArtUrl().isEmpty() ? first.getCoverArtUrl() : "");
            map.put("year", first.getReleaseDate() != null && first.getReleaseDate().length() >= 4 ? first.getReleaseDate().substring(0, 4) : "2023");
            discography.add(map);
        }

        if (!discography.isEmpty()) {
            discography.get(0).put("isLatest", true);
        }

        // Featuring Section Playlists
        List<Map<String, Object>> featuring = new ArrayList<>();
        Map<String, Object> thisIs = new HashMap<>();
        thisIs.put("id", "this-is-" + stageName.toLowerCase().replaceAll("[^a-z0-9]", "-"));
        thisIs.put("title", "This Is " + stageName);
        thisIs.put("desc", "This is " + stageName + ". The essential tracks, all in one playlist.");
        thisIs.put("type", "Playlist");
        thisIs.put("badge", "THIS IS");
        thisIs.put("coverUrl", profileUrl.isEmpty() ? bannerUrl : profileUrl);
        featuring.add(thisIs);

        Map<String, Object> radio = new HashMap<>();
        radio.put("id", "radio-" + stageName.toLowerCase().replaceAll("[^a-z0-9]", "-"));
        radio.put("title", stageName + " Radio");
        radio.put("desc", "With Ngọt, Low G, Thịnh Suy and more.");
        radio.put("type", "Playlist");
        radio.put("badge", "RADIO");
        radio.put("coverUrl", bannerUrl.isEmpty() ? profileUrl : bannerUrl);
        featuring.add(radio);

        // Related Artists (Fans Also Like)
        List<Map<String, Object>> relatedArtists = new ArrayList<>();
        List<ArtistProfile> allProfiles = repository.getAllArtistProfiles();
        for (ArtistProfile ap : allProfiles) {
            if (ap.getStageName() != null && !ap.getStageName().equalsIgnoreCase(stageName)) {
                Map<String, Object> rm = new HashMap<>();
                rm.put("id", ap.getArtistId());
                rm.put("name", ap.getStageName());
                rm.put("profileUrl", ap.getProfileImageUrl());
                rm.put("type", "Artist");
                relatedArtists.add(rm);
                if (relatedArtists.size() >= 7) break;
            }
        }

        // About section
        Map<String, Object> about = new HashMap<>();
        about.put("monthlyListeners", listeners);
        String bio = profile != null && profile.getBio() != null && !profile.getBio().trim().isEmpty()
                ? profile.getBio()
                : stageName + " is an acclaimed recording artist recognized for profound storytelling, emotive performances, and vibrant releases.";
        about.put("bio", bio);
        about.put("bannerUrl", bannerUrl.isEmpty() ? profileUrl : bannerUrl);
        about.put("verified", verified);

        Map<String, Object> res = new HashMap<>();
        res.put("id", effectiveId);
        res.put("name", stageName);
        res.put("bannerUrl", bannerUrl);
        res.put("profileUrl", profileUrl);
        res.put("verified", verified);
        res.put("monthlyListeners", listeners);
        res.put("popularSongs", popularSongs);
        res.put("discography", discography);
        res.put("featuring", featuring);
        res.put("relatedArtists", relatedArtists);
        res.put("about", about);
        return ResponseEntity.ok(res);
    }
}

