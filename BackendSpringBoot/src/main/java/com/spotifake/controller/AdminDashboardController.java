package com.spotifake.controller;

import com.spotifake.model.*;
import com.spotifake.repository.SpotifakeRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final SpotifakeRepository repository;

    public AdminDashboardController(SpotifakeRepository repository) {
        this.repository = repository;
    }

    private String getAdminUsername(User user) {
        return (user != null && user.getUsername() != null) ? user.getUsername() : "admin_test";
    }

    @GetMapping
    public String index(Model model) {
        Map<String, Object> stats = repository.getAdminOverviewStats();
        List<User> allUsers = repository.getAllUsers();
        List<Song> allSongs = repository.getAllSongs();
        List<ArtistRequest> requests = repository.getAdminRequests();

        List<User> recentUsers = allUsers.stream().limit(5).collect(Collectors.toList());
        List<Song> recentSongs = allSongs.stream().limit(5).collect(Collectors.toList());
        List<ArtistRequest> pendingRequests = requests.stream()
                .filter(r -> "Pending".equalsIgnoreCase(r.getStatus()))
                .limit(5)
                .collect(Collectors.toList());

        model.addAttribute("stats", stats);
        model.addAttribute("recentUsers", recentUsers);
        model.addAttribute("recentSongs", recentSongs);
        model.addAttribute("pendingRequests", pendingRequests);
        model.addAttribute("activeTab", "overview");
        return "AdminDashboard/Index";
    }

    @GetMapping("/chart-data")
    @ResponseBody
    public ResponseEntity<?> chartData(@RequestParam(required = false, defaultValue = "all") String period) {
        return ResponseEntity.ok(repository.getAdminChartData(period));
    }

    @GetMapping("/users")
    public String users(@RequestParam(required = false, defaultValue = "") String search,
                        @RequestParam(required = false, defaultValue = "all") String role,
                        @RequestParam(required = false, defaultValue = "all") String status,
                        @RequestParam(required = false, defaultValue = "all") String tier,
                        @RequestParam(required = false, defaultValue = "date") String sort,
                        Model model) {
        List<User> all = repository.getAllUsers();
        String s = search.trim().toLowerCase();
        List<User> filtered = new ArrayList<>();

        for (User u : all) {
            boolean matchSearch = s.isEmpty() ||
                    (u.getUsername() != null && u.getUsername().toLowerCase().contains(s)) ||
                    (u.getDisplayName() != null && u.getDisplayName().toLowerCase().contains(s)) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(s));

            boolean matchRole = "all".equalsIgnoreCase(role) ||
                    (u.getRole() != null && u.getRole().equalsIgnoreCase(role));

            boolean matchStatus = "all".equalsIgnoreCase(status) ||
                    (u.getAccountStatus() != null && u.getAccountStatus().equalsIgnoreCase(status));

            boolean matchTier = "all".equalsIgnoreCase(tier) ||
                    ("premium".equalsIgnoreCase(tier) ? (u.isPremium() || "Premium".equalsIgnoreCase(u.getSubscriptionTier()))
                            : (!u.isPremium() && !"Premium".equalsIgnoreCase(u.getSubscriptionTier())));

            if (matchSearch && matchRole && matchStatus && matchTier) {
                filtered.add(u);
            }
        }

        // Sorting
        if ("name".equalsIgnoreCase(sort)) {
            filtered.sort(Comparator.comparing(u -> (u.getDisplayName() != null && !u.getDisplayName().isEmpty()) ? u.getDisplayName().toLowerCase() : u.getUsername().toLowerCase()));
        } else if ("role".equalsIgnoreCase(sort)) {
            filtered.sort(Comparator.comparing(u -> u.getRole() != null ? u.getRole() : ""));
        } else if ("status".equalsIgnoreCase(sort)) {
            filtered.sort(Comparator.comparing(u -> u.getAccountStatus() != null ? u.getAccountStatus() : ""));
        } else {
            // Default: newest first
            filtered.sort((a, b) -> String.valueOf(b.getCreatedAt()).compareTo(String.valueOf(a.getCreatedAt())));
        }

        model.addAttribute("users", filtered);
        model.addAttribute("search", search);
        model.addAttribute("role", role);
        model.addAttribute("status", status);
        model.addAttribute("tier", tier);
        model.addAttribute("sort", sort);
        model.addAttribute("totalCount", all.size());
        model.addAttribute("activeTab", "users");
        return "AdminDashboard/Users";
    }

    @PostMapping("/users/{userId}/edit")
    public String editUser(@PathVariable String userId,
                           @RequestParam(required = false) String displayName,
                           @RequestParam(required = false) String email,
                           @RequestParam(required = false) String role,
                           @RequestParam(required = false) String accountStatus,
                           @RequestParam(required = false) String subscriptionTier,
                           @AuthenticationPrincipal User adminUser) {
        Map<String, Object> data = new HashMap<>();
        if (displayName != null && !displayName.trim().isEmpty()) data.put("DisplayName", displayName.trim());
        if (email != null && !email.trim().isEmpty()) data.put("Email", email.trim());
        if (role != null && !role.trim().isEmpty()) {
            data.put("Role", role.trim().toLowerCase());
            boolean isArt = "artist".equalsIgnoreCase(role.trim());
            data.put("IsArtist", isArt ? 1 : 0);
            if (isArt) {
                ArtistProfile existing = repository.getArtistProfileByUserId(userId);
                if (existing == null) {
                    Map<String, Object> artData = new HashMap<>();
                    artData.put("StageName", displayName != null ? displayName : "Artist");
                    artData.put("Genre", "Various");
                    repository.updateArtistProfile(userId, artData);
                }
            }
        }
        if (accountStatus != null && !accountStatus.trim().isEmpty()) {
            data.put("AccountStatus", accountStatus.trim());
            data.put("IsDeleted", "Deleted".equalsIgnoreCase(accountStatus) ? 1 : 0);
        }
        if (subscriptionTier != null && !subscriptionTier.trim().isEmpty()) {
            data.put("SubscriptionTier", subscriptionTier.trim());
            data.put("IsPremium", "Premium".equalsIgnoreCase(subscriptionTier) ? 1 : 0);
        }

        repository.updateUser(userId, data);
        repository.logAdminAction(getAdminUsername(adminUser), "USER_UPDATE", "User", userId,
                "Updated details: role=" + role + ", tier=" + subscriptionTier + ", status=" + accountStatus);
        return "redirect:/admin/dashboard/users";
    }

    @PostMapping("/users/{userId}/status")
    public String updateUserStatus(@PathVariable String userId, @RequestParam String status, @AuthenticationPrincipal User adminUser) {
        repository.updateUserStatus(userId, status);
        repository.logAdminAction(getAdminUsername(adminUser), "USER_STATUS_CHANGE", "User", userId, "Status changed to " + status);
        return "redirect:/admin/dashboard/users";
    }

    @PostMapping("/users/{userId}/delete")
    public String deleteUser(@PathVariable String userId, @AuthenticationPrincipal User adminUser) {
        repository.softDeleteUser(userId);
        repository.logAdminAction(getAdminUsername(adminUser), "USER_DELETE", "User", userId, "Soft-deleted user account");
        return "redirect:/admin/dashboard/users";
    }

    @GetMapping("/artists")
    public String artists(@RequestParam(required = false, defaultValue = "") String search, Model model) {
        List<User> allUsers = repository.getAllUsers();
        List<Song> allSongs = repository.getAllSongs();
        List<ArtistProfile> allProfiles = repository.getAllArtistProfiles();

        Map<String, ArtistProfile> profileByUserId = new HashMap<>();
        for (ArtistProfile ap : allProfiles) {
            profileByUserId.put(ap.getUserId(), ap);
            profileByUserId.put(ap.getArtistId(), ap);
        }

        List<Map<String, Object>> artists = new ArrayList<>();
        String s = search.trim().toLowerCase();

        for (User u : allUsers) {
            boolean isArtistRole = "artist".equalsIgnoreCase(u.getRole()) || u.isArtist();
            ArtistProfile p = profileByUserId.get(u.getId());

            if (isArtistRole || p != null) {
                String stageName = (p != null && p.getStageName() != null && !p.getStageName().isEmpty())
                        ? p.getStageName() : (u.getDisplayName() != null && !u.getDisplayName().isEmpty() ? u.getDisplayName() : u.getUsername());

                if (s.isEmpty() || stageName.toLowerCase().contains(s) || (u.getUsername() != null && u.getUsername().toLowerCase().contains(s))) {
                    Map<String, Object> map = new HashMap<>();
                    String artistId = p != null ? p.getArtistId() : u.getId();
                    map.put("ArtistID", artistId);
                    map.put("UserID", u.getId());
                    map.put("StageName", stageName);
                    map.put("Genre", (p != null && p.getGenre() != null && !p.getGenre().isEmpty()) ? p.getGenre() : "Various");
                    map.put("Verified", p != null && p.isVerified());
                    map.put("Status", p != null && p.getStatus() != null ? p.getStatus() : "Approved");
                    map.put("FollowersCount", p != null ? p.getFollowersCount() : 0);
                    map.put("User", u);

                    long songCount = allSongs.stream()
                            .filter(song -> u.getId().equals(song.getUserId()) ||
                                    (stageName != null && stageName.equalsIgnoreCase(song.getArtist())))
                            .count();
                    map.put("SongCount", songCount);

                    artists.add(map);
                }
            }
        }

        model.addAttribute("artists", artists);
        model.addAttribute("search", search);
        model.addAttribute("activeTab", "artists");
        return "AdminDashboard/Artists";
    }

    @PostMapping("/artists/{artistId}/toggle-verify")
    public String toggleArtistVerify(@PathVariable String artistId, @AuthenticationPrincipal User adminUser) {
        repository.toggleArtistVerification(artistId);
        repository.logAdminAction(getAdminUsername(adminUser), "ARTIST_VERIFY_TOGGLE", "Artist", artistId, "Toggled verification badge");
        return "redirect:/admin/dashboard/artists";
    }

    @PostMapping("/artists/{artistId}/status")
    public String updateArtistStatus(@PathVariable String artistId, @RequestParam String status, @AuthenticationPrincipal User adminUser) {
        repository.updateArtistStatus(artistId, status);
        repository.logAdminAction(getAdminUsername(adminUser), "ARTIST_STATUS_CHANGE", "Artist", artistId, "Status updated to " + status);
        return "redirect:/admin/dashboard/artists";
    }

    @GetMapping("/artists/{artistId}")
    public String artistDetail(@PathVariable String artistId, Model model) {
        ArtistProfile profile = repository.getArtistProfileById(artistId);
        User u = null;
        if (profile != null) {
            u = repository.getUserById(profile.getUserId());
        } else {
            profile = repository.getArtistProfileByUserId(artistId);
            if (profile != null) u = repository.getUserById(profile.getUserId());
        }

        if (profile == null && u == null) {
            return "redirect:/admin/dashboard/artists";
        }

        String targetUid = u != null ? u.getId() : "";
        String stageName = profile != null ? profile.getStageName() : (u != null ? u.getDisplayName() : "");

        List<Song> songs = repository.getAllSongs();
        List<Song> artistSongs = new ArrayList<>();
        long totalPlays = 0;
        for (Song song : songs) {
            if (targetUid.equals(song.getUserId()) || (stageName != null && stageName.equalsIgnoreCase(song.getArtist()))) {
                artistSongs.add(song);
                totalPlays += song.getPlayCount();
            }
        }

        List<Album> albums = repository.getAlbumsByArtist(profile != null ? profile.getArtistId() : targetUid);

        model.addAttribute("artist", profile);
        model.addAttribute("artistUser", u);
        model.addAttribute("songs", artistSongs);
        model.addAttribute("albums", albums);
        model.addAttribute("totalPlays", totalPlays);
        model.addAttribute("activeTab", "artists");
        return "AdminDashboard/ArtistDetail";
    }

    @GetMapping("/songs")
    public String songs(@RequestParam(required = false, defaultValue = "") String search,
                        @RequestParam(required = false, defaultValue = "all") String genre,
                        @RequestParam(required = false, defaultValue = "1") int page,
                        Model model) {
        List<Song> all = repository.getAllSongs();
        String s = search.trim().toLowerCase();
        List<Song> filtered = new ArrayList<>();

        Set<String> uniqueGenres = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (Song song : all) {
            if (song.getGenre() != null && !song.getGenre().trim().isEmpty()) {
                String[] parts = song.getGenre().split("[,/]");
                for (String p : parts) {
                    String clean = p.trim();
                    if (!clean.isEmpty()) uniqueGenres.add(clean);
                }
            }
        }

        for (Song song : all) {
            boolean matchSearch = s.isEmpty() ||
                    (song.getTitle() != null && song.getTitle().toLowerCase().contains(s)) ||
                    (song.getArtist() != null && song.getArtist().toLowerCase().contains(s)) ||
                    (song.getAlbum() != null && song.getAlbum().toLowerCase().contains(s));

            boolean matchGenre = "all".equalsIgnoreCase(genre) ||
                    (song.getGenre() != null && song.getGenre().toLowerCase().contains(genre.toLowerCase()));

            if (matchSearch && matchGenre) {
                filtered.add(song);
            }
        }

        int pageSize = 50;
        int totalItems = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) totalItems / pageSize));
        int currentPage = Math.max(1, Math.min(page, totalPages));
        int startIndex = (currentPage - 1) * pageSize;
        int endIndex = Math.min(startIndex + pageSize, totalItems);

        List<Song> pageItems = startIndex < totalItems ? filtered.subList(startIndex, endIndex) : Collections.emptyList();

        model.addAttribute("songs", pageItems);
        model.addAttribute("genres", uniqueGenres);
        model.addAttribute("search", search);
        model.addAttribute("genre", genre);
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalSongs", totalItems);
        model.addAttribute("activeTab", "songs");
        return "AdminDashboard/Songs";
    }

    @PostMapping("/songs/{songId}/edit")
    public String editSong(@PathVariable String songId,
                           @RequestParam(required = false) String title,
                           @RequestParam(required = false) String artistName,
                           @RequestParam(required = false) String genre,
                           @RequestParam(required = false) String mood,
                           @RequestParam(required = false) String language,
                           @RequestParam(required = false) String tags,
                           @AuthenticationPrincipal User adminUser) {
        Map<String, Object> fields = new HashMap<>();
        if (title != null && !title.trim().isEmpty()) fields.put("Title", title.trim());
        if (artistName != null && !artistName.trim().isEmpty()) fields.put("ArtistName", artistName.trim());
        if (genre != null) fields.put("Genre", genre.trim());
        if (mood != null) fields.put("Mood", mood.trim());
        if (language != null) fields.put("Language", language.trim());
        if (tags != null) fields.put("Tags", tags.trim());
        repository.updateSong(songId, fields);
        repository.logAdminAction(getAdminUsername(adminUser), "SONG_METADATA_UPDATE", "Song", songId, "Updated metadata for " + title);
        return "redirect:/admin/dashboard/songs";
    }

    @PostMapping("/songs/{songId}/delete")
    public String deleteSong(@PathVariable String songId, @AuthenticationPrincipal User adminUser) {
        repository.deleteSong(songId);
        repository.logAdminAction(getAdminUsername(adminUser), "SONG_DELETE", "Song", songId, "Deleted song from catalog");
        return "redirect:/admin/dashboard/songs";
    }

    @GetMapping("/requests")
    public String requests(Model model) {
        List<ArtistRequest> requests = repository.getAdminRequests();
        model.addAttribute("requests", requests);
        List<ArtistRequest> pendingRequests = requests.stream()
                .filter(r -> "Pending".equalsIgnoreCase(r.getStatus()))
                .toList();
        List<ArtistRequest> pastRequests = requests.stream()
                .filter(r -> !"Pending".equalsIgnoreCase(r.getStatus()))
                .toList();
        model.addAttribute("pendingRequests", pendingRequests);
        model.addAttribute("pastRequests", pastRequests);
        model.addAttribute("activeTab", "requests");
        return "AdminDashboard/Requests";
    }

    @GetMapping("/requests/{requestId}")
    public String requestDetail(@PathVariable String requestId, Model model) {
        ArtistRequest request = repository.getAdminRequestById(requestId);
        if (request == null) return "redirect:/admin/dashboard/requests";
        model.addAttribute("request", request);
        model.addAttribute("activeTab", "requests");
        return "AdminDashboard/RequestDetail";
    }

    @PostMapping("/requests/{requestId}/approve")
    public String approveRequest(@PathVariable String requestId, @AuthenticationPrincipal User adminUser) {
        repository.approveArtistRequest(requestId);
        repository.logAdminAction(getAdminUsername(adminUser), "REQUEST_APPROVED", "ArtistRequest", requestId, "Approved artist application");
        return "redirect:/admin/dashboard/requests";
    }

    @PostMapping("/requests/{requestId}/reject")
    public String rejectRequest(@PathVariable String requestId,
                                @RequestParam(required = false) String adminNotes,
                                @AuthenticationPrincipal User adminUser) {
        repository.rejectArtistRequest(requestId, adminNotes);
        repository.logAdminAction(getAdminUsername(adminUser), "REQUEST_REJECTED", "ArtistRequest", requestId, "Rejected application with notes: " + adminNotes);
        return "redirect:/admin/dashboard/requests";
    }

    @GetMapping("/requests/{requestId}/cv")
    public ResponseEntity<byte[]> getRequestCv(@PathVariable String requestId) {
        ArtistRequest r = repository.getAdminRequestById(requestId);
        if (r == null || r.getCvFileData() == null) return ResponseEntity.notFound().build();
        String fn = r.getCvFileName() != null ? r.getCvFileName() : "resume.pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fn + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(r.getCvFileData());
    }

    @GetMapping("/requests/{requestId}/demo")
    public ResponseEntity<byte[]> getRequestDemo(@PathVariable String requestId) {
        ArtistRequest r = repository.getAdminRequestById(requestId);
        if (r == null || r.getDemoFileData() == null) return ResponseEntity.notFound().build();
        String fn = r.getDemoFileName() != null ? r.getDemoFileName() : "demo.mp3";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fn + "\"")
                .contentType(MediaType.parseMediaType("audio/mpeg"))
                .body(r.getDemoFileData());
    }

    // ==========================================
    // NEW ADMIN SECTIONS: AUDIT LOGS, ANALYTICS, SYSTEM TELEMETRY
    // ==========================================
    @GetMapping("/audit-logs")
    public String auditLogs(Model model) {
        List<Map<String, Object>> auditLogs = repository.getAdminAuditLogs(100);
        List<Map<String, Object>> userActivity = repository.getUserActivityLogs(100);

        model.addAttribute("auditLogs", auditLogs);
        model.addAttribute("userActivity", userActivity);
        model.addAttribute("activeTab", "audit-logs");
        return "AdminDashboard/AuditLogs";
    }

    @GetMapping("/analytics")
    public String analytics(Model model) {
        Map<String, Object> stats = repository.getAdminOverviewStats();
        List<Song> topSongs = repository.getTopStreamedSongs(10);
        List<Map<String, Object>> recentStreams = repository.getRecentStreamLogs(30);
        List<Transaction> transactions = repository.getAllTransactions(20);

        model.addAttribute("stats", stats);
        model.addAttribute("topSongs", topSongs);
        model.addAttribute("recentStreams", recentStreams);
        model.addAttribute("transactions", transactions);
        model.addAttribute("activeTab", "analytics");
        return "AdminDashboard/Analytics";
    }

    @GetMapping("/system")
    public String system(Model model) {
        Map<String, Object> health = repository.getSystemHealthStats();
        Map<String, Object> stats = repository.getAdminOverviewStats();

        model.addAttribute("health", health);
        model.addAttribute("stats", stats);
        model.addAttribute("activeTab", "system");
        return "AdminDashboard/System";
    }

    // ==========================================
    // PLATFORM SETTINGS & FEATURE FLAGS
    // ==========================================
    @GetMapping("/settings")
    public String settings(Model model) {
        List<PlatformSetting> settings = repository.getAllSettings();
        Map<String, String> settingMap = new HashMap<>();
        for (PlatformSetting s : settings) {
            settingMap.put(s.getKey(), s.getValue());
        }
        model.addAttribute("settings", settings);
        model.addAttribute("settingMap", settingMap);
        model.addAttribute("stats", repository.getAdminOverviewStats());
        model.addAttribute("activeTab", "settings");
        return "AdminDashboard/Settings";
    }

    @PostMapping("/settings")
    public String updateSettings(@RequestParam Map<String, String> params, @AuthenticationPrincipal User adminUser) {
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (!entry.getKey().startsWith("_")) { // ignore spring csrf or hidden fields
                repository.updateSetting(entry.getKey(), entry.getValue(), "", "runtime");
            }
        }
        repository.logAdminAction(getAdminUsername(adminUser), "SETTINGS_UPDATE", "PlatformSettings", "all", "Updated runtime platform feature flags");
        return "redirect:/admin/dashboard/settings?saved=true";
    }

    // ==========================================
    // ADVERTISEMENTS & SPONSOR MANAGER
    // ==========================================
    @GetMapping("/ads")
    public String advertisements(Model model) {
        List<Advertisement> ads = repository.getAllAdvertisements();
        int totalImpressions = ads.stream().mapToInt(Advertisement::getImpressions).sum();
        int totalClicks = ads.stream().mapToInt(Advertisement::getClicks).sum();
        double avgCtr = totalImpressions > 0 ? (Math.round(((double) totalClicks / totalImpressions * 100.0) * 10.0) / 10.0) : 0.0;

        model.addAttribute("ads", ads);
        model.addAttribute("totalImpressions", totalImpressions);
        model.addAttribute("totalClicks", totalClicks);
        model.addAttribute("avgCtr", avgCtr);
        model.addAttribute("stats", repository.getAdminOverviewStats());
        model.addAttribute("activeTab", "ads");
        return "AdminDashboard/Ads";
    }

    @PostMapping("/ads/create")
    public String createAdvertisement(@RequestParam String title,
                                      @RequestParam String sponsor,
                                      @RequestParam(defaultValue = "audio") String adType,
                                      @RequestParam(required = false, defaultValue = "") String mediaUrl,
                                      @RequestParam(required = false, defaultValue = "") String clickUrl,
                                      @RequestParam(defaultValue = "true") boolean active,
                                      @AuthenticationPrincipal User adminUser) {
        repository.addAdvertisement(title.trim(), sponsor.trim(), adType.trim(), mediaUrl.trim(), clickUrl.trim(), active);
        repository.logAdminAction(getAdminUsername(adminUser), "AD_CREATE", "Advertisement", title, "Created new " + adType + " ad campaign for " + sponsor);
        return "redirect:/admin/dashboard/ads";
    }

    @PostMapping("/ads/{id}/toggle")
    public String toggleAdvertisement(@PathVariable int id, @RequestParam boolean active, @AuthenticationPrincipal User adminUser) {
        repository.toggleAdvertisement(id, active);
        repository.logAdminAction(getAdminUsername(adminUser), "AD_TOGGLE", "Advertisement", String.valueOf(id), "Set active to " + active);
        return "redirect:/admin/dashboard/ads";
    }

    @PostMapping("/ads/{id}/delete")
    public String deleteAdvertisement(@PathVariable int id, @AuthenticationPrincipal User adminUser) {
        repository.deleteAdvertisement(id);
        repository.logAdminAction(getAdminUsername(adminUser), "AD_DELETE", "Advertisement", String.valueOf(id), "Deleted ad campaign");
        return "redirect:/admin/dashboard/ads";
    }

    // ==========================================
    // CONTENT MODERATION & REPORTS
    // ==========================================
    @GetMapping("/reports")
    public String reports(@RequestParam(required = false, defaultValue = "all") String status, Model model) {
        List<ContentReport> allReports = repository.getAllContentReports("all");
        List<ContentReport> filtered = repository.getAllContentReports(status);

        long pendingCount = allReports.stream().filter(r -> "Pending".equalsIgnoreCase(r.getStatus())).count();
        long resolvedCount = allReports.stream().filter(r -> "Resolved".equalsIgnoreCase(r.getStatus())).count();

        model.addAttribute("reports", filtered);
        model.addAttribute("selectedStatus", status);
        model.addAttribute("pendingCount", pendingCount);
        model.addAttribute("resolvedCount", resolvedCount);
        model.addAttribute("stats", repository.getAdminOverviewStats());
        model.addAttribute("activeTab", "reports");
        return "AdminDashboard/Reports";
    }

    @PostMapping("/reports/{id}/resolve")
    public String resolveReport(@PathVariable int id,
                                @RequestParam String action,
                                @RequestParam(required = false, defaultValue = "") String notes,
                                @AuthenticationPrincipal User adminUser) {
        repository.resolveContentReport(id, action, notes, getAdminUsername(adminUser));
        repository.logAdminAction(getAdminUsername(adminUser), "REPORT_RESOLVED", "ContentReport", String.valueOf(id), "Action: " + action + " Notes: " + notes);
        return "redirect:/admin/dashboard/reports";
    }

    // ==========================================
    // EDITORIAL & GLOBAL ANNOUNCEMENTS
    // ==========================================
    @GetMapping("/editorial")
    public String editorial(Model model) {
        List<PlatformAnnouncement> announcements = repository.getAllAnnouncements();
        model.addAttribute("announcements", announcements);
        model.addAttribute("stats", repository.getAdminOverviewStats());
        model.addAttribute("activeTab", "editorial");
        return "AdminDashboard/Editorial";
    }

    @PostMapping("/editorial/announcements/create")
    public String createAnnouncement(@RequestParam String title,
                                     @RequestParam String message,
                                     @RequestParam(defaultValue = "info") String level,
                                     @RequestParam(defaultValue = "all") String targetRole,
                                     @RequestParam(defaultValue = "true") boolean active,
                                     @AuthenticationPrincipal User adminUser) {
        repository.createAnnouncement(title.trim(), message.trim(), level.trim(), targetRole.trim(), active);
        repository.logAdminAction(getAdminUsername(adminUser), "ANNOUNCEMENT_CREATE", "PlatformAnnouncement", title, "Created announcement: " + message);
        return "redirect:/admin/dashboard/editorial";
    }

    @PostMapping("/editorial/announcements/{id}/toggle")
    public String toggleAnnouncement(@PathVariable int id, @RequestParam boolean active, @AuthenticationPrincipal User adminUser) {
        repository.toggleAnnouncement(id, active);
        repository.logAdminAction(getAdminUsername(adminUser), "ANNOUNCEMENT_TOGGLE", "PlatformAnnouncement", String.valueOf(id), "Set active to " + active);
        return "redirect:/admin/dashboard/editorial";
    }

    @PostMapping("/editorial/announcements/{id}/delete")
    public String deleteAnnouncement(@PathVariable int id, @AuthenticationPrincipal User adminUser) {
        repository.deleteAnnouncement(id);
        repository.logAdminAction(getAdminUsername(adminUser), "ANNOUNCEMENT_DELETE", "PlatformAnnouncement", String.valueOf(id), "Deleted announcement");
        return "redirect:/admin/dashboard/editorial";
    }

    // ==========================================
    // DATA EXPORT & DATABASE MAINTENANCE TOOLS
    // ==========================================
    @GetMapping("/tools")
    public String tools(Model model) {
        Map<String, Object> health = repository.getSystemHealthStats();
        Map<String, Object> stats = repository.getAdminOverviewStats();
        String integrity = repository.checkDatabaseIntegrity();

        model.addAttribute("health", health);
        model.addAttribute("stats", stats);
        model.addAttribute("integrity", integrity);
        model.addAttribute("activeTab", "tools");
        return "AdminDashboard/Tools";
    }

    @PostMapping("/tools/vacuum")
    public String vacuumDatabase(@AuthenticationPrincipal User adminUser) {
        repository.vacuumDatabase();
        repository.logAdminAction(getAdminUsername(adminUser), "DB_VACUUM", "Database", "backendai.db", "Executed SQLite VACUUM and PRAGMA optimize");
        return "redirect:/admin/dashboard/tools?vacuumed=true";
    }

    @GetMapping("/export/{type}")
    public ResponseEntity<byte[]> exportCsv(@PathVariable String type, @AuthenticationPrincipal User adminUser) {
        String csv;
        String filename;
        switch (type.toLowerCase()) {
            case "users":
                csv = repository.exportUsersCsv();
                filename = "spotifake_users.csv";
                break;
            case "songs":
                csv = repository.exportSongsCsv();
                filename = "spotifake_songs.csv";
                break;
            case "streams":
                csv = repository.exportStreamsCsv();
                filename = "spotifake_streams.csv";
                break;
            case "transactions":
                csv = repository.exportTransactionsCsv();
                filename = "spotifake_transactions.csv";
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        repository.logAdminAction(getAdminUsername(adminUser), "DATA_EXPORT", "CSV", filename, "Exported " + type + " data to CSV");
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }

    @GetMapping("/backup/download")
    public ResponseEntity<byte[]> downloadBackup(@AuthenticationPrincipal User adminUser) {
        File dbFile = repository.getDatabaseFile();
        if (!dbFile.exists()) return ResponseEntity.notFound().build();
        try {
            byte[] bytes = Files.readAllBytes(dbFile.toPath());
            repository.logAdminAction(getAdminUsername(adminUser), "DB_BACKUP_DOWNLOAD", "Database", dbFile.getName(), "Downloaded full SQLite database backup");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"spotifake_backup_" + System.currentTimeMillis() + ".db\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(bytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==========================================
    // PUBLIC / PLAYER API ENDPOINTS
    // ==========================================
    @GetMapping("/api/public/settings")
    @ResponseBody
    public ResponseEntity<?> getPublicSettings() {
        return ResponseEntity.ok(repository.getPublicSettingsMap());
    }

    @GetMapping("/api/public/announcements")
    @ResponseBody
    public ResponseEntity<?> getPublicAnnouncements(@RequestParam(required = false, defaultValue = "all") String role) {
        return ResponseEntity.ok(repository.getActiveAnnouncements(role));
    }

    @GetMapping("/api/public/ads/stream")
    @ResponseBody
    public ResponseEntity<?> getStreamingAd() {
        List<Advertisement> audioAds = repository.getActiveAdvertisements("audio");
        if (audioAds.isEmpty()) {
            audioAds = repository.getActiveAdvertisements("all");
        }
        if (!audioAds.isEmpty()) {
            Advertisement ad = audioAds.get(0);
            repository.recordAdImpression(ad.getId());
            return ResponseEntity.ok(ad);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/public/ads/click/{id}")
    @ResponseBody
    public ResponseEntity<?> recordAdClick(@PathVariable int id) {
        repository.recordAdClick(id);
        return ResponseEntity.ok(Map.of("status", "success"));
    }
}
