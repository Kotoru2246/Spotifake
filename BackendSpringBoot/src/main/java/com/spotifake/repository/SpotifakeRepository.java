package com.spotifake.repository;

import com.spotifake.model.*;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Repository;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.File;
import java.sql.*;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Repository
public class SpotifakeRepository {

    @Value("${app.db.path:../backendai.db}")
    private String dbPathConfig;

    private String dbUrl;
    private HikariDataSource pooledDataSource;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostConstruct
    public void init() {
        File file = new File(dbPathConfig);
        if (!file.exists()) {
            File alt = new File("backendai.db");
            if (alt.exists()) {
                file = alt;
            } else {
                File parent = new File("../backendai.db");
                if (parent.exists()) {
                    file = parent;
                }
            }
        }
        this.dbUrl = "jdbc:sqlite:" + file.getAbsolutePath();

        try {
            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(this.dbUrl);
            config.setDriverClassName("org.sqlite.JDBC");
            config.setMaximumPoolSize(10);
            config.setMinimumIdle(2);
            config.setIdleTimeout(30000);
            config.setConnectionTimeout(10000);
            config.setConnectionInitSql("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000;");
            this.pooledDataSource = new HikariDataSource(config);
        } catch (Exception e) {
            System.err.println("HikariCP initialization failed, falling back to direct connection: " + e.getMessage());
        }

        initSchema();
    }

    @PreDestroy
    public void close() {
        if (pooledDataSource != null && !pooledDataSource.isClosed()) {
            pooledDataSource.close();
        }
    }

    private Connection getConnection() throws SQLException {
        if (pooledDataSource != null && !pooledDataSource.isClosed()) {
            return pooledDataSource.getConnection();
        }
        return DriverManager.getConnection(dbUrl);
    }

    private void initSchema() {
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Users (
                  UserID TEXT PRIMARY KEY,
                  Username TEXT UNIQUE NOT NULL,
                  Email TEXT UNIQUE NOT NULL,
                  PasswordHash TEXT NOT NULL,
                  Role TEXT NOT NULL DEFAULT 'user',
                  DisplayName TEXT NOT NULL DEFAULT '',
                  Bio TEXT NOT NULL DEFAULT '',
                  AvatarUrl TEXT NOT NULL DEFAULT '',
                  SubscriptionTier TEXT NOT NULL DEFAULT 'Free',
                  IsIncognito INTEGER NOT NULL DEFAULT 0,
                  AccountStatus TEXT NOT NULL DEFAULT 'Active',
                  IsEmailVerified INTEGER NOT NULL DEFAULT 0,
                  CreatedAt TEXT NOT NULL,
                  UpdatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS ArtistProfiles (
                  ArtistID TEXT PRIMARY KEY,
                  UserID TEXT NOT NULL,
                  StageName TEXT DEFAULT '',
                  Bio TEXT DEFAULT '',
                  Genre TEXT DEFAULT '',
                  Verified INTEGER DEFAULT 0,
                  Status TEXT DEFAULT 'Pending',
                  FollowersCount INTEGER DEFAULT 0,
                  Website TEXT DEFAULT '',
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Albums (
                  AlbumID TEXT PRIMARY KEY,
                  Title TEXT NOT NULL,
                  ArtistID TEXT NOT NULL,
                  CoverArtUrl TEXT DEFAULT '',
                  CoverArtData BLOB,
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Comments (
                  CommentID TEXT PRIMARY KEY,
                  UserID TEXT NOT NULL,
                  SongID TEXT NOT NULL,
                  TimestampMS INTEGER NOT NULL DEFAULT 0,
                  Content TEXT NOT NULL DEFAULT '',
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Transactions (
                  TransactionID TEXT PRIMARY KEY,
                  UserID TEXT NOT NULL,
                  PlanType TEXT NOT NULL,
                  Amount REAL NOT NULL,
                  Currency TEXT NOT NULL DEFAULT 'USD',
                  PaymentMethod TEXT NOT NULL DEFAULT 'Card',
                  CardBrand TEXT NOT NULL DEFAULT 'Visa',
                  CardLast4 TEXT NOT NULL DEFAULT '4242',
                  AuthCode TEXT NOT NULL DEFAULT '',
                  Status TEXT NOT NULL DEFAULT 'Completed',
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS AdminAuditLogs (
                  AuditLogID TEXT PRIMARY KEY,
                  AdminID TEXT NOT NULL,
                  Action TEXT DEFAULT '',
                  TargetType TEXT DEFAULT '',
                  TargetID TEXT DEFAULT '',
                  Details TEXT DEFAULT '',
                  Timestamp TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS StreamLogs (
                  StreamID TEXT PRIMARY KEY,
                  SongID TEXT NOT NULL,
                  UserID TEXT DEFAULT '',
                  DurationListened INTEGER DEFAULT 0,
                  DeviceType TEXT DEFAULT 'Web Player',
                  IpAddress TEXT DEFAULT '',
                  Timestamp TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS UserActivityLogs (
                  LogID TEXT PRIMARY KEY,
                  UserID TEXT NOT NULL,
                  ActivityType TEXT NOT NULL,
                  Details TEXT DEFAULT '',
                  IpAddress TEXT DEFAULT '',
                  Timestamp TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Playlists (
                  PlaylistID TEXT PRIMARY KEY,
                  OwnerUserID TEXT NOT NULL,
                  Title TEXT NOT NULL,
                  ImageUrl TEXT DEFAULT '',
                  Description TEXT DEFAULT '',
                  IsPublic INTEGER NOT NULL DEFAULT 1,
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS PlaylistTracks (
                  PlaylistTrackID TEXT PRIMARY KEY,
                  PlaylistID TEXT NOT NULL,
                  SongID TEXT NOT NULL,
                  AddedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS UserFavorites (
                  FavoriteID TEXT PRIMARY KEY,
                  UserID TEXT NOT NULL,
                  SongID TEXT NOT NULL,
                  FavoritedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS ArtistRequests (
                  RequestID TEXT PRIMARY KEY,
                  UserID TEXT NOT NULL,
                  StageName TEXT NOT NULL,
                  Status TEXT NOT NULL DEFAULT 'Pending',
                  CvFileName TEXT DEFAULT '',
                  CvFileData BLOB,
                  DemoFileName TEXT DEFAULT '',
                  DemoFileData BLOB,
                  AdminNotes TEXT DEFAULT '',
                  CreatedAt TEXT NOT NULL,
                  ResolvedAt TEXT
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Songs (
                  SongID TEXT PRIMARY KEY,
                  UserID TEXT,
                  GenreID TEXT,
                  AlbumID TEXT,
                  Source TEXT DEFAULT 'upload',
                  SourceID TEXT DEFAULT '',
                  Title TEXT DEFAULT '',
                  ArtistName TEXT DEFAULT '',
                  CollabArtists TEXT DEFAULT '',
                  Album TEXT DEFAULT '',
                  DurationSeconds INTEGER DEFAULT 0,
                  Uri TEXT DEFAULT '',
                  Popularity INTEGER DEFAULT 0,
                  UploadedAt TEXT,
                  Genre TEXT DEFAULT '',
                  Mood TEXT DEFAULT '',
                  Language TEXT DEFAULT 'en',
                  Tempo REAL DEFAULT 0.0,
                  Energy REAL DEFAULT 0.0,
                  Danceability REAL DEFAULT 0.0,
                  Valence REAL DEFAULT 0.0,
                  Acousticness REAL DEFAULT 0.0,
                  Instrumentalness REAL DEFAULT 0.0,
                  Key INTEGER DEFAULT 0,
                  Mode INTEGER DEFAULT 0,
                  Tags TEXT DEFAULT '',
                  FilePath TEXT DEFAULT '',
                  FileData BLOB,
                  CoverArtUrl TEXT DEFAULT '',
                  CoverArtData BLOB,
                  ReleaseDate TEXT,
                  Credits TEXT DEFAULT '',
                  Lyrics TEXT DEFAULT '',
                  StorageUrl TEXT DEFAULT ''
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS PlatformSettings (
                  SettingKey TEXT PRIMARY KEY,
                  SettingValue TEXT NOT NULL,
                  Description TEXT DEFAULT '',
                  Category TEXT DEFAULT 'general',
                  UpdatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS Advertisements (
                  AdID INTEGER PRIMARY KEY AUTOINCREMENT,
                  Title TEXT NOT NULL,
                  Sponsor TEXT NOT NULL,
                  AdType TEXT NOT NULL DEFAULT 'audio',
                  MediaUrl TEXT DEFAULT '',
                  ClickUrl TEXT DEFAULT '',
                  Impressions INTEGER DEFAULT 0,
                  Clicks INTEGER DEFAULT 0,
                  IsActive INTEGER DEFAULT 1,
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS ContentReports (
                  ReportID INTEGER PRIMARY KEY AUTOINCREMENT,
                  ItemType TEXT NOT NULL,
                  ItemID INTEGER NOT NULL,
                  ItemTitle TEXT DEFAULT '',
                  Reason TEXT NOT NULL,
                  Description TEXT DEFAULT '',
                  Status TEXT NOT NULL DEFAULT 'Pending',
                  ReportedBy TEXT DEFAULT 'anonymous',
                  CreatedAt TEXT NOT NULL,
                  ResolvedBy TEXT DEFAULT '',
                  ResolutionNotes TEXT DEFAULT ''
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS PlatformAnnouncements (
                  AnnouncementID INTEGER PRIMARY KEY AUTOINCREMENT,
                  Title TEXT NOT NULL,
                  Message TEXT NOT NULL,
                  Level TEXT NOT NULL DEFAULT 'info',
                  TargetRole TEXT NOT NULL DEFAULT 'all',
                  IsActive INTEGER DEFAULT 1,
                  CreatedAt TEXT NOT NULL
                );
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS UserNotifications (
                  NotificationID INTEGER PRIMARY KEY AUTOINCREMENT,
                  UserID TEXT DEFAULT '',
                  Title TEXT NOT NULL,
                  Message TEXT NOT NULL,
                  Type TEXT DEFAULT 'system',
                  IsRead INTEGER DEFAULT 0,
                  CreatedAt TEXT NOT NULL
                );
            """);

            // Safe columns
            addColumnSafe(conn, "Users", "Nationality TEXT DEFAULT ''");
            addColumnSafe(conn, "Users", "Gender TEXT DEFAULT ''");
            addColumnSafe(conn, "Users", "DateOfBirth TEXT DEFAULT ''");
            addColumnSafe(conn, "Users", "IsDeleted INTEGER DEFAULT 0");
            addColumnSafe(conn, "Users", "IsPremium INTEGER DEFAULT 0");

            addColumnSafe(conn, "Songs", "PlayCount INTEGER DEFAULT 0");
            addColumnSafe(conn, "Songs", "IsDeleted INTEGER DEFAULT 0");
            addColumnSafe(conn, "Songs", "IsHidden INTEGER DEFAULT 0");

            addColumnSafe(conn, "Albums", "IsDeleted INTEGER DEFAULT 0");
            addColumnSafe(conn, "Albums", "Description TEXT DEFAULT ''");

            addColumnSafe(conn, "ArtistProfiles", "BannerImageUrl TEXT DEFAULT ''");
            addColumnSafe(conn, "ArtistProfiles", "ProfileImageUrl TEXT DEFAULT ''");
            addColumnSafe(conn, "ArtistProfiles", "DateOfBirth TEXT DEFAULT ''");
            addColumnSafe(conn, "ArtistProfiles", "Nationality TEXT DEFAULT ''");
            addColumnSafe(conn, "ArtistProfiles", "IsDeleted INTEGER DEFAULT 0");
            addColumnSafe(conn, "Users", "IsArtist INTEGER NOT NULL DEFAULT 0");
            try (Statement s = conn.createStatement()) {
                s.execute("UPDATE Users SET IsArtist = 1 WHERE LOWER(Role) = 'artist' OR UserID IN (SELECT UserID FROM ArtistProfiles WHERE Status = 'Approved')");
            } catch (SQLException ignored) {}

            seedDefaultUsers(conn);
            seedPlatformSettings(conn);
            seedAdvertisements(conn);
            seedContentReports(conn);
            seedPlatformAnnouncements(conn);
        } catch (SQLException e) {
            System.err.println("Database init warning: " + e.getMessage());
        }
    }

    private void addColumnSafe(Connection conn, String table, String colDef) {
        try (Statement s = conn.createStatement()) {
            s.execute("ALTER TABLE " + table + " ADD COLUMN " + colDef);
        } catch (SQLException ignored) {}
    }

    private void seedDefaultUsers(Connection conn) {
        String now = Instant.now().toString();
        String[][] users = {
            {"00000000-0000-0000-0000-000000000001", "user_test", "user_test@musicplayer.local", "User@123", "user", "user_test"},
            {"00000000-0000-0000-0000-000000000002", "artist_test", "artist_test@musicplayer.local", "Artist@123", "artist", "artist_test"},
            {"00000000-0000-0000-0000-000000000003", "admin_test", "admin_test@musicplayer.local", "Admin@123", "admin", "admin_test"}
        };

        for (String[] u : users) {
            try (PreparedStatement check = conn.prepareStatement("SELECT UserID FROM Users WHERE Username = ?")) {
                check.setString(1, u[1]);
                try (ResultSet rs = check.executeQuery()) {
                    if (!rs.next()) {
                        String hash = passwordEncoder.encode(u[3]);
                        boolean isArt = "artist".equalsIgnoreCase(u[4]);
                        try (PreparedStatement ins = conn.prepareStatement("""
                            INSERT INTO Users (UserID, Username, Email, PasswordHash, Role, DisplayName, AccountStatus, IsArtist, CreatedAt, UpdatedAt)
                            VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
                        """)) {
                            ins.setString(1, u[0]);
                            ins.setString(2, u[1]);
                            ins.setString(3, u[2]);
                            ins.setString(4, hash);
                            ins.setString(5, u[4]);
                            ins.setString(6, u[5]);
                            ins.setInt(7, isArt ? 1 : 0);
                            ins.setString(8, now);
                            ins.setString(9, now);
                            ins.executeUpdate();
                        }
                        if ("artist".equals(u[4])) {
                            try (PreparedStatement insArt = conn.prepareStatement("""
                                INSERT OR IGNORE INTO ArtistProfiles (ArtistID, UserID, StageName, Genre, Verified, Status, CreatedAt)
                                VALUES (?, ?, ?, 'Various', 1, 'Approved', ?)
                            """)) {
                                insArt.setString(1, u[0]);
                                insArt.setString(2, u[0]);
                                insArt.setString(3, u[5]);
                                insArt.setString(4, now);
                                insArt.executeUpdate();
                            }
                        }
                    }
                }
            } catch (SQLException e) {
                System.err.println("Seed user error: " + e.getMessage());
            }
        }
    }

    // ==========================================
    // USER METHODS
    // ==========================================
    public User getUserByUsername(String username) {
        String sql = "SELECT * FROM Users WHERE Username = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, username);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapUser(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public User getUserByEmail(String email) {
        String sql = "SELECT * FROM Users WHERE Email = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapUser(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public User getUserById(String userId) {
        String sql = "SELECT * FROM Users WHERE UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapUser(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public List<User> getAllUsers() {
        List<User> list = new ArrayList<>();
        String sql = "SELECT * FROM Users ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) list.add(mapUser(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public User createUser(String id, String username, String email, String passwordHash, String role, String displayName) {
        String now = Instant.now().toString();
        boolean isArtist = "artist".equalsIgnoreCase(role);
        String sql = """
            INSERT INTO Users (UserID, Username, Email, PasswordHash, Role, DisplayName, AccountStatus, IsArtist, CreatedAt, UpdatedAt)
            VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, username);
            ps.setString(3, email);
            ps.setString(4, passwordHash);
            ps.setString(5, role != null ? role : "user");
            ps.setString(6, displayName != null ? displayName : username);
            ps.setInt(7, isArtist ? 1 : 0);
            ps.setString(8, now);
            ps.setString(9, now);
            ps.executeUpdate();
            return getUserById(id);
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    public User updateUserStatus(String userId, String status) {
        String now = Instant.now().toString();
        String sql = "UPDATE Users SET AccountStatus = ?, UpdatedAt = ? WHERE UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, now);
            ps.setString(3, userId);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
        return getUserById(userId);
    }

    public User updateUser(String userId, Map<String, Object> data) {
        if (data.isEmpty()) return getUserById(userId);
        StringBuilder sb = new StringBuilder("UPDATE Users SET ");
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            sb.append(entry.getKey()).append(" = ?, ");
            values.add(entry.getValue());
        }
        sb.append("UpdatedAt = ? WHERE UserID = ?");
        values.add(Instant.now().toString());
        values.add(userId);

        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sb.toString())) {
            for (int i = 0; i < values.size(); i++) {
                ps.setObject(i + 1, values.get(i));
            }
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
        return getUserById(userId);
    }

    public void softDeleteUser(String userId) {
        String sql = "UPDATE Users SET IsDeleted = 1, AccountStatus = 'Deleted', UpdatedAt = ? WHERE UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, Instant.now().toString());
            ps.setString(2, userId);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    // ==========================================
    // SONG METHODS
    // ==========================================
    public static final String SONG_METADATA_SELECT = """
        SELECT SongID, UserID, GenreID, AlbumID, Source, SourceID, Title, ArtistName, 
               CollabArtists, Album, DurationSeconds, Uri, Popularity, UploadedAt, Genre, 
               Mood, Language, Tempo, Energy, Danceability, Valence, Acousticness, 
               Instrumentalness, Key, Mode, Tags, FilePath, CoverArtUrl, ReleaseDate, 
               Credits, Lyrics, StorageUrl, PlayCount, IsDeleted, IsHidden 
        FROM Songs 
    """;

    public List<Song> getAllSongs() {
        List<Song> list = new ArrayList<>();
        String sql = SONG_METADATA_SELECT + " ORDER BY UploadedAt DESC";
        try (Connection conn = getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) list.add(mapSong(rs, false));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Song> searchSongs(String query, int limit) {
        if (query == null || query.trim().isEmpty()) return Collections.emptyList();
        String pattern = "%" + query.trim().toLowerCase() + "%";
        List<Song> list = new ArrayList<>();
        String sql = SONG_METADATA_SELECT + """
            WHERE IsDeleted = 0 AND (
                LOWER(Title) LIKE ? OR 
                LOWER(ArtistName) LIKE ? OR 
                LOWER(Genre) LIKE ? OR 
                LOWER(Tags) LIKE ?
            )
            LIMIT ?
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pattern);
            ps.setString(2, pattern);
            ps.setString(3, pattern);
            ps.setString(4, pattern);
            ps.setInt(5, limit > 0 ? limit : 20);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapSong(rs, false));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public Song getSongById(String songId) {
        if (songId == null || songId.trim().isEmpty()) return null;
        String raw = songId.trim();
        String unhyphenated = raw.replace("-", "");
        String sql = "SELECT * FROM Songs WHERE SongID = ? OR REPLACE(SongID, '-', '') = ? LIMIT 1";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, raw);
            ps.setString(2, unhyphenated);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapSong(rs, true);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public Song getSongByFilePathOrTitle(String query) {
        if (query == null || query.trim().isEmpty()) return null;
        String raw = query.trim();
        String unhyphenated = raw.replace("-", "");
        String normalizedPath = raw.replace('\\', '/');
        if (!normalizedPath.startsWith("uploads/") && !normalizedPath.contains("/")) {
            normalizedPath = "uploads/" + normalizedPath;
        }
        String sql = """
            SELECT * FROM Songs 
            WHERE SongID = ? 
               OR REPLACE(SongID, '-', '') = ? 
               OR FilePath = ? 
               OR REPLACE(FilePath, '\\', '/') = ? 
               OR StorageUrl = ?
               OR REPLACE(StorageUrl, '\\', '/') = ?
               OR Title = ? 
            LIMIT 1
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, raw);
            ps.setString(2, unhyphenated);
            ps.setString(3, raw);
            ps.setString(4, normalizedPath);
            ps.setString(5, raw);
            ps.setString(6, normalizedPath);
            ps.setString(7, raw);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapSong(rs, true);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public List<Song> getSongsByIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyList();
        List<Song> result = new ArrayList<>();
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        String sql = "SELECT * FROM Songs WHERE SongID IN (" + placeholders + ")";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < ids.size(); i++) ps.setString(i + 1, ids.get(i));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) result.add(mapSong(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return result;
    }

    public Song insertSong(Song song) {
        String sql = """
            INSERT INTO Songs (
                SongID, UserID, GenreID, AlbumID, Source, SourceID, Title, ArtistName,
                CollabArtists, Album, DurationSeconds, Uri, Popularity, UploadedAt,
                Genre, Mood, Language, Tempo, Energy, Danceability, Valence, Acousticness,
                Instrumentalness, Key, Mode, Tags, FilePath, FileData, CoverArtUrl,
                CoverArtData, ReleaseDate, Credits, Lyrics, StorageUrl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, song.getId());
            ps.setString(2, song.getUserId());
            ps.setString(3, song.getGenreId());
            ps.setString(4, song.getAlbumId());
            ps.setString(5, song.getSource() != null ? song.getSource() : "upload");
            ps.setString(6, song.getSourceId());
            ps.setString(7, song.getTitle());
            ps.setString(8, song.getArtist());
            ps.setString(9, song.getCollabArtists());
            ps.setString(10, song.getAlbum());
            ps.setLong(11, song.getDurationMs());
            ps.setString(12, song.getUri());
            ps.setInt(13, song.getPopularity());
            ps.setString(14, song.getUploadedAt() != null ? song.getUploadedAt() : Instant.now().toString());
            ps.setString(15, song.getGenre());
            ps.setString(16, song.getMood());
            ps.setString(17, song.getLanguage() != null ? song.getLanguage() : "en");
            ps.setDouble(18, song.getTempo());
            ps.setDouble(19, song.getEnergy());
            ps.setDouble(20, song.getDanceability());
            ps.setDouble(21, song.getValence());
            ps.setDouble(22, song.getAcousticness());
            ps.setDouble(23, song.getInstrumentalness());
            ps.setInt(24, song.getKey());
            ps.setInt(25, song.getMode());
            ps.setString(26, song.getTags());
            ps.setString(27, song.getFilePath());
            ps.setBytes(28, song.getFileData());
            ps.setString(29, song.getCoverArtUrl());
            ps.setBytes(30, song.getCoverArtData());
            ps.setString(31, song.getReleaseDate());
            ps.setString(32, song.getCredits());
            ps.setString(33, song.getLyrics());
            ps.setString(34, song.getStorageUrl());
            ps.executeUpdate();
            return getSongById(song.getId());
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
    }

    public void updateSong(String songId, Map<String, Object> fields) {
        if (fields.isEmpty()) return;
        StringBuilder sb = new StringBuilder("UPDATE Songs SET ");
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : fields.entrySet()) {
            sb.append(entry.getKey()).append(" = ?, ");
            values.add(entry.getValue());
        }
        sb.delete(sb.length() - 2, sb.length());
        sb.append(" WHERE SongID = ?");
        values.add(songId);

        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sb.toString())) {
            for (int i = 0; i < values.size(); i++) ps.setObject(i + 1, values.get(i));
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void deleteSong(String songId) {
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement("DELETE FROM Songs WHERE SongID = ?")) {
            ps.setString(1, songId);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public boolean recordSongPlay(String songIdOrFileName, String userId, String deviceType, String ipAddress) {
        String sql = "UPDATE Songs SET PlayCount = PlayCount + 1 WHERE SongID = ? OR FilePath = ? OR StorageUrl = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, songIdOrFileName);
            ps.setString(2, songIdOrFileName);
            ps.setString(3, songIdOrFileName);
            int updated = ps.executeUpdate();

            // Find song to link correctly in StreamLogs
            Song s = getSongById(songIdOrFileName);
            String songId = (s != null) ? s.getId() : songIdOrFileName;
            int dur = (s != null && s.getDurationMs() > 0) ? (int) (s.getDurationMs() / 1000) : 180;

            String streamId = "STR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sqlLog = "INSERT INTO StreamLogs (StreamID, SongID, UserID, DurationListened, DeviceType, IpAddress, Timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)";
            try (PreparedStatement psLog = conn.prepareStatement(sqlLog)) {
                psLog.setString(1, streamId);
                psLog.setString(2, songId);
                psLog.setString(3, userId != null ? userId : "guest");
                psLog.setInt(4, dur);
                psLog.setString(5, deviceType != null ? deviceType : "Web Player");
                psLog.setString(6, ipAddress != null ? ipAddress : "127.0.0.1");
                psLog.setString(7, Instant.now().toString());
                psLog.executeUpdate();
            }
            return updated > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean recordSongPlay(String songIdOrFileName) {
        return recordSongPlay(songIdOrFileName, "guest", "Web Player", "127.0.0.1");
    }

    // ==========================================
    // ALBUM METHODS
    // ==========================================
    public List<Album> getAllAlbums() {
        List<Album> list = new ArrayList<>();
        String sql = "SELECT * FROM Albums WHERE IsDeleted = 0";
        try (Connection conn = getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) list.add(mapAlbum(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<ArtistProfile> getAllArtistProfiles() {
        List<ArtistProfile> list = new ArrayList<>();
        String sql = "SELECT * FROM ArtistProfiles WHERE IsDeleted = 0";
        try (Connection conn = getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) list.add(mapArtistProfile(rs));
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Map<String, Object>> searchPlaylists(String query) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT p.*, u.DisplayName AS OwnerName FROM Playlists p LEFT JOIN Users u ON p.OwnerUserID = u.UserID WHERE p.IsPublic = 1 AND LOWER(p.Title) LIKE ? LIMIT 10";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%" + query.toLowerCase() + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", rs.getString("PlaylistID"));
                    map.put("name", rs.getString("Title"));
                    map.put("imageUrl", rs.getString("ImageUrl"));
                    map.put("description", rs.getString("Description"));
                    map.put("ownerName", rs.getString("OwnerName"));
                    list.add(map);
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Album> searchAlbums(String query, int limit) {
        if (query == null || query.trim().isEmpty()) return Collections.emptyList();
        String pattern = "%" + query.trim().toLowerCase() + "%";
        List<Album> list = new ArrayList<>();
        String sql = """
            SELECT a.AlbumID, a.Title, a.ArtistID, a.Description, a.CoverArtUrl, a.CreatedAt, a.IsDeleted 
            FROM Albums a 
            LEFT JOIN ArtistProfiles ap ON a.ArtistID = ap.ArtistID 
            WHERE a.IsDeleted = 0 AND (
                LOWER(a.Title) LIKE ? OR 
                LOWER(ap.StageName) LIKE ? OR 
                EXISTS (SELECT 1 FROM Songs s WHERE s.AlbumID = a.AlbumID AND LOWER(s.ArtistName) LIKE ?)
            ) 
            GROUP BY LOWER(a.Title)
            LIMIT ?
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pattern);
            ps.setString(2, pattern);
            ps.setString(3, pattern);
            ps.setInt(4, limit > 0 ? limit : 10);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAlbum(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<ArtistProfile> searchArtists(String query, int limit) {
        if (query == null || query.trim().isEmpty()) return Collections.emptyList();
        String pattern = "%" + query.trim().toLowerCase() + "%";
        List<ArtistProfile> list = new ArrayList<>();
        String sql = "SELECT * FROM ArtistProfiles WHERE IsDeleted = 0 AND (LOWER(StageName) LIKE ? OR LOWER(Genre) LIKE ?) LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pattern);
            ps.setString(2, pattern);
            ps.setInt(3, limit > 0 ? limit : 10);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapArtistProfile(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Map<String, String>> searchDistinctSongArtists(String query, int limit) {
        if (query == null || query.trim().isEmpty()) return Collections.emptyList();
        String pattern = "%" + query.trim().toLowerCase() + "%";
        List<Map<String, String>> list = new ArrayList<>();
        String sql = "SELECT DISTINCT ArtistName, CoverArtUrl, UserID FROM Songs WHERE IsDeleted = 0 AND LOWER(ArtistName) LIKE ? LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, pattern);
            ps.setInt(2, limit > 0 ? limit : 10);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String name = rs.getString("ArtistName");
                    if (name != null && !name.isBlank()) {
                        Map<String, String> m = new HashMap<>();
                        m.put("artistName", name);
                        m.put("coverArtUrl", rs.getString("CoverArtUrl") != null ? rs.getString("CoverArtUrl") : "");
                        m.put("userId", rs.getString("UserID") != null ? rs.getString("UserID") : "");
                        list.add(m);
                    }
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public Album getAlbumById(String albumId) {
        if (albumId == null || albumId.trim().isEmpty()) return null;
        String raw = albumId.trim();
        String sql = "SELECT * FROM Albums WHERE AlbumID = ? OR LOWER(Title) = LOWER(?) LIMIT 1";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, raw);
            ps.setString(2, raw);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapAlbum(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public List<Song> getSongsByAlbum(String albumIdOrTitle) {
        if (albumIdOrTitle == null || albumIdOrTitle.trim().isEmpty()) return Collections.emptyList();
        String raw = albumIdOrTitle.trim();
        List<Song> list = new ArrayList<>();
        String sql = "SELECT * FROM Songs WHERE IsDeleted = 0 AND (AlbumID = ? OR LOWER(Album) = LOWER(?)) ORDER BY UploadedAt ASC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, raw);
            ps.setString(2, raw);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapSong(rs, false));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Album> getAlbumsByArtist(String artistId) {
        List<Album> list = new ArrayList<>();
        String sql = "SELECT * FROM Albums WHERE ArtistID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, artistId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAlbum(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Album> getAlbumsByArtistNameOrId(String artistIdOrName) {
        if (artistIdOrName == null || artistIdOrName.trim().isEmpty()) return Collections.emptyList();
        List<Album> list = getAlbumsByArtist(artistIdOrName);
        if (!list.isEmpty()) return list;

        String sql = """
            SELECT DISTINCT a.* FROM Albums a
            JOIN Songs s ON a.AlbumID = s.AlbumID
            WHERE s.ArtistName LIKE ? OR a.ArtistID = ? OR a.Title LIKE ?
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, "%" + artistIdOrName + "%");
            ps.setString(2, artistIdOrName);
            ps.setString(3, "%" + artistIdOrName + "%");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapAlbum(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public String createAlbum(String artistId, String title, String description, String coverArtUrl, byte[] coverArtData) {
        String id = UUID.randomUUID().toString();
        String sql = """
            INSERT INTO Albums (AlbumID, Title, ArtistID, Description, CoverArtUrl, CoverArtData, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, title);
            ps.setString(3, artistId);
            ps.setString(4, description != null ? description : "");
            ps.setString(5, coverArtUrl != null ? coverArtUrl : "");
            ps.setBytes(6, coverArtData);
            ps.setString(7, Instant.now().toString());
            ps.executeUpdate();
            return id;
        } catch (SQLException e) { e.printStackTrace(); return null; }
    }

    public void updateAlbum(String albumId, String title, String description, String coverArtUrl) {
        List<String> sets = new ArrayList<>();
        List<Object> vals = new ArrayList<>();
        if (title != null) { sets.add("Title = ?"); vals.add(title); }
        if (description != null) { sets.add("Description = ?"); vals.add(description); }
        if (coverArtUrl != null) { sets.add("CoverArtUrl = ?"); vals.add(coverArtUrl); }
        if (sets.isEmpty()) return;

        vals.add(albumId);
        String sql = "UPDATE Albums SET " + String.join(", ", sets) + " WHERE AlbumID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 0; i < vals.size(); i++) ps.setObject(i + 1, vals.get(i));
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void deleteAlbum(String albumId) {
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps1 = conn.prepareStatement("UPDATE Albums SET IsDeleted = 1 WHERE AlbumID = ?")) {
                ps1.setString(1, albumId);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("UPDATE Songs SET IsDeleted = 1 WHERE AlbumID = ?")) {
                ps2.setString(1, albumId);
                ps2.executeUpdate();
            }
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void restoreAlbum(String albumId) {
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps1 = conn.prepareStatement("UPDATE Albums SET IsDeleted = 0 WHERE AlbumID = ?")) {
                ps1.setString(1, albumId);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("UPDATE Songs SET IsDeleted = 0 WHERE AlbumID = ?")) {
                ps2.setString(1, albumId);
                ps2.executeUpdate();
            }
        } catch (SQLException e) { e.printStackTrace(); }
    }

    // ==========================================
    // ARTIST PROFILES & REQUESTS
    // ==========================================
    public ArtistProfile getArtistProfileByUserId(String userId) {
        String sql = "SELECT * FROM ArtistProfiles WHERE UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapArtistProfile(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public ArtistProfile getArtistProfileById(String artistId) {
        String sql = "SELECT * FROM ArtistProfiles WHERE ArtistID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, artistId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapArtistProfile(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public ArtistProfile getArtistProfileByStageName(String stageName) {
        if (stageName == null || stageName.trim().isEmpty()) return null;
        String sql = "SELECT * FROM ArtistProfiles WHERE LOWER(TRIM(StageName)) = LOWER(TRIM(?)) LIMIT 1";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, stageName);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return mapArtistProfile(rs);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public void updateArtistProfile(String userId, Map<String, Object> data) {
        ArtistProfile profile = getArtistProfileByUserId(userId);
        if (profile == null || data.isEmpty()) return;

        StringBuilder sb = new StringBuilder("UPDATE ArtistProfiles SET ");
        List<Object> values = new ArrayList<>();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            sb.append(entry.getKey()).append(" = ?, ");
            values.add(entry.getValue());
        }
        sb.delete(sb.length() - 2, sb.length());
        sb.append(" WHERE ArtistID = ?");
        values.add(profile.getArtistId());

        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sb.toString())) {
            for (int i = 0; i < values.size(); i++) ps.setObject(i + 1, values.get(i));
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public String createArtistRequest(String userId, String stageName, String bio, String cvFileName, byte[] cvFileData, String demoFileName, byte[] demoFileData) {
        String reqId = UUID.randomUUID().toString();
        String now = Instant.now().toString();
        String sql = """
            INSERT INTO ArtistRequests (RequestID, UserID, StageName, Status, CvFileName, CvFileData, DemoFileName, DemoFileData, CreatedAt)
            VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?)
        """;
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, reqId);
                ps.setString(2, userId);
                ps.setString(3, stageName);
                ps.setString(4, cvFileName != null ? cvFileName : "");
                ps.setBytes(5, cvFileData);
                ps.setString(6, demoFileName != null ? demoFileName : "");
                ps.setBytes(7, demoFileData);
                ps.setString(8, now);
                ps.executeUpdate();
            }

            ArtistProfile existing = getArtistProfileByUserId(userId);
            if (existing == null) {
                try (PreparedStatement psArt = conn.prepareStatement("""
                    INSERT INTO ArtistProfiles (ArtistID, UserID, StageName, Bio, Status, Verified, CreatedAt)
                    VALUES (?, ?, ?, ?, 'Pending', 0, ?)
                """)) {
                    psArt.setString(1, UUID.randomUUID().toString());
                    psArt.setString(2, userId);
                    psArt.setString(3, stageName);
                    psArt.setString(4, bio != null ? bio : "");
                    psArt.setString(5, now);
                    psArt.executeUpdate();
                }
            }
            return reqId;
        } catch (SQLException e) { e.printStackTrace(); return null; }
    }

    public List<ArtistRequest> getAdminRequests() {
        List<ArtistRequest> list = new ArrayList<>();
        String sql = """
            SELECT r.*, u.Username, u.DisplayName, u.Email
            FROM ArtistRequests r
            LEFT JOIN Users u ON r.UserID = u.UserID
            ORDER BY r.CreatedAt DESC
        """;
        try (Connection conn = getConnection(); Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                ArtistRequest req = mapArtistRequest(rs);
                User u = new User();
                u.setUsername(rs.getString("Username"));
                u.setDisplayName(rs.getString("DisplayName"));
                u.setEmail(rs.getString("Email"));
                req.setUser(u);
                list.add(req);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public ArtistRequest getAdminRequestById(String requestId) {
        String sql = """
            SELECT r.*, u.Username, u.DisplayName, u.Email, u.DateOfBirth, u.Nationality, u.Gender
            FROM ArtistRequests r
            LEFT JOIN Users u ON r.UserID = u.UserID
            WHERE r.RequestID = ?
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, requestId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ArtistRequest req = mapArtistRequest(rs);
                    User u = new User();
                    u.setUsername(rs.getString("Username"));
                    u.setDisplayName(rs.getString("DisplayName"));
                    u.setEmail(rs.getString("Email"));
                    u.setDateOfBirth(rs.getString("DateOfBirth"));
                    u.setNationality(rs.getString("Nationality"));
                    u.setGender(rs.getString("Gender"));
                    req.setUser(u);
                    return req;
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public ArtistRequest getLatestArtistRequestByUserId(String userId) {
        String sql = """
            SELECT r.*, u.Username, u.DisplayName, u.Email
            FROM ArtistRequests r
            LEFT JOIN Users u ON r.UserID = u.UserID
            WHERE r.UserID = ?
            ORDER BY r.CreatedAt DESC LIMIT 1
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    ArtistRequest req = mapArtistRequest(rs);
                    User u = new User();
                    u.setUsername(rs.getString("Username"));
                    u.setDisplayName(rs.getString("DisplayName"));
                    u.setEmail(rs.getString("Email"));
                    req.setUser(u);
                    return req;
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public boolean approveArtistRequest(String requestId) {
        ArtistRequest req = getAdminRequestById(requestId);
        if (req == null) return false;
        String now = Instant.now().toString();

        try (Connection conn = getConnection()) {
            try (PreparedStatement ps1 = conn.prepareStatement("UPDATE ArtistRequests SET Status = 'Approved', ResolvedAt = ? WHERE RequestID = ?")) {
                ps1.setString(1, now);
                ps1.setString(2, requestId);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("UPDATE Users SET Role = 'artist', IsArtist = 1, UpdatedAt = ? WHERE UserID = ?")) {
                ps2.setString(1, now);
                ps2.setString(2, req.getUserId());
                ps2.executeUpdate();
            }
            ArtistProfile prof = getArtistProfileByUserId(req.getUserId());
            if (prof != null) {
                try (PreparedStatement ps3 = conn.prepareStatement("UPDATE ArtistProfiles SET Status = 'Approved', Verified = 1 WHERE UserID = ?")) {
                    ps3.setString(1, req.getUserId());
                    ps3.executeUpdate();
                }
            } else {
                try (PreparedStatement ps4 = conn.prepareStatement("""
                    INSERT INTO ArtistProfiles (ArtistID, UserID, StageName, Status, Verified, CreatedAt)
                    VALUES (?, ?, ?, 'Approved', 1, ?)
                """)) {
                    ps4.setString(1, UUID.randomUUID().toString());
                    ps4.setString(2, req.getUserId());
                    ps4.setString(3, req.getStageName());
                    ps4.setString(4, now);
                    ps4.executeUpdate();
                }
            }
            return true;
        } catch (SQLException e) { e.printStackTrace(); return false; }
    }

    public boolean rejectArtistRequest(String requestId, String adminNotes) {
        ArtistRequest req = getAdminRequestById(requestId);
        if (req == null) return false;
        String now = Instant.now().toString();

        try (Connection conn = getConnection()) {
            try (PreparedStatement ps1 = conn.prepareStatement("UPDATE ArtistRequests SET Status = 'Rejected', AdminNotes = ?, ResolvedAt = ? WHERE RequestID = ?")) {
                ps1.setString(1, adminNotes != null ? adminNotes : "");
                ps1.setString(2, now);
                ps1.setString(3, requestId);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("UPDATE ArtistProfiles SET Status = 'Rejected' WHERE UserID = ?")) {
                ps2.setString(1, req.getUserId());
                ps2.executeUpdate();
            }
            return true;
        } catch (SQLException e) { e.printStackTrace(); return false; }
    }

    // ==========================================
    // PLAYLISTS & FAVORITES
    // ==========================================
    public List<Map<String, Object>> getUserPlaylists(String username) {
        User user = getUserByUsername(username);
        if (user == null) return Collections.emptyList();
        List<Map<String, Object>> result = new ArrayList<>();

        // Liked songs virtual playlist
        List<Map<String, Object>> likedSongs = new ArrayList<>();
        String likedSql = """
            SELECT s.* FROM UserFavorites f
            JOIN Songs s ON f.SongID = s.SongID
            WHERE f.UserID = ?
            ORDER BY f.FavoritedAt DESC
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(likedSql)) {
            ps.setString(1, user.getId());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Song s = mapSong(rs);
                    Map<String, Object> songMap = new HashMap<>();
                    songMap.put("fileName", s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3");
                    songMap.put("displayName", s.getTitle());
                    songMap.put("artist", s.getArtist());
                    songMap.put("artistId", s.getUserId() != null ? s.getUserId() : "");
                    songMap.put("albumId", s.getAlbumId() != null ? s.getAlbumId() : "");
                    songMap.put("durationSeconds", Math.round((s.getDurationMs() != 0 ? s.getDurationMs() : 180000) / 1000.0));
                    likedSongs.add(songMap);
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }

        Map<String, Object> likedPlaylist = new HashMap<>();
        likedPlaylist.put("id", "liked-songs-" + username);
        likedPlaylist.put("name", "Liked Songs");
        likedPlaylist.put("imageUrl", "");
        likedPlaylist.put("isPublic", false);
        likedPlaylist.put("isOwner", true);
        likedPlaylist.put("type", "Liked Songs");
        likedPlaylist.put("songs", likedSongs);
        result.add(likedPlaylist);

        // Real playlists
        String plSql = "SELECT * FROM Playlists WHERE OwnerUserID = ? ORDER BY Title ASC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(plSql)) {
            ps.setString(1, user.getId());
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String pid = rs.getString("PlaylistID");
                    Map<String, Object> pl = new HashMap<>();
                    pl.put("id", pid);
                    pl.put("name", rs.getString("Title"));
                    pl.put("imageUrl", rs.getString("ImageUrl"));
                    pl.put("description", rs.getString("Description"));
                    pl.put("isPublic", rs.getInt("IsPublic") == 1);
                    pl.put("isOwner", true);
                    pl.put("type", "Playlist");

                    List<Map<String, Object>> plSongs = getPlaylistTracks(conn, pid);
                    pl.put("songs", plSongs);
                    result.add(pl);
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }

        return result;
    }

    private List<Map<String, Object>> getPlaylistTracks(Connection conn, String playlistId) {
        List<Map<String, Object>> songs = new ArrayList<>();
        String sql = """
            SELECT s.* FROM PlaylistTracks pt
            JOIN Songs s ON pt.SongID = s.SongID
            WHERE pt.PlaylistID = ?
            ORDER BY pt.AddedAt ASC
        """;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, playlistId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Song s = mapSong(rs);
                    Map<String, Object> m = new HashMap<>();
                    m.put("fileName", s.getFilePath() != null && !s.getFilePath().isEmpty() ? s.getFilePath() : s.getId() + ".mp3");
                    m.put("displayName", s.getTitle());
                    m.put("artist", s.getArtist());
                    m.put("artistId", s.getUserId() != null ? s.getUserId() : "");
                    m.put("albumId", s.getAlbumId() != null ? s.getAlbumId() : "");
                    m.put("durationSeconds", Math.round((s.getDurationMs() != 0 ? s.getDurationMs() : 180000) / 1000.0));
                    songs.add(m);
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return songs;
    }

    public Map<String, Object> getPlaylistDetails(String playlistId) {
        if (playlistId.startsWith("liked-songs-")) {
            String username = playlistId.replace("liked-songs-", "");
            List<Map<String, Object>> pls = getUserPlaylists(username);
            for (Map<String, Object> p : pls) {
                if (playlistId.equals(p.get("id"))) return p;
            }
            return null;
        }

        String sql = "SELECT * FROM Playlists WHERE PlaylistID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, playlistId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> pl = new HashMap<>();
                    pl.put("id", rs.getString("PlaylistID"));
                    pl.put("name", rs.getString("Title"));
                    pl.put("imageUrl", rs.getString("ImageUrl"));
                    pl.put("description", rs.getString("Description"));
                    pl.put("isPublic", rs.getInt("IsPublic") == 1);
                    pl.put("isOwner", true);
                    pl.put("type", "Playlist");
                    pl.put("songs", getPlaylistTracks(conn, playlistId));
                    return pl;
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return null;
    }

    public Map<String, Object> createPlaylist(String username, String name, String imageUrl, List<String> songFileNames) {
        User user = getUserByUsername(username);
        if (user == null) return null;

        String id = UUID.randomUUID().toString();
        String sql = "INSERT INTO Playlists (PlaylistID, OwnerUserID, Title, ImageUrl, CreatedAt) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, user.getId());
            ps.setString(3, name);
            ps.setString(4, imageUrl != null ? imageUrl : "");
            ps.setString(5, Instant.now().toString());
            ps.executeUpdate();

            if (songFileNames != null) {
                for (String fn : songFileNames) {
                    addSongToPlaylist(id, fn);
                }
            }
            return getPlaylistDetails(id);
        } catch (SQLException e) { e.printStackTrace(); return null; }
    }

    public void deletePlaylist(String playlistId) {
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps1 = conn.prepareStatement("DELETE FROM PlaylistTracks WHERE PlaylistID = ?")) {
                ps1.setString(1, playlistId);
                ps1.executeUpdate();
            }
            try (PreparedStatement ps2 = conn.prepareStatement("DELETE FROM Playlists WHERE PlaylistID = ?")) {
                ps2.setString(1, playlistId);
                ps2.executeUpdate();
            }
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void addSongToPlaylist(String playlistId, String songIdOrFileName) {
        Song s = getSongByFilePathOrTitle(songIdOrFileName);
        if (s == null) return;
        String sql = "INSERT OR IGNORE INTO PlaylistTracks (PlaylistTrackID, PlaylistID, SongID, AddedAt) VALUES (?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, UUID.randomUUID().toString());
            ps.setString(2, playlistId);
            ps.setString(3, s.getId());
            ps.setString(4, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void removeSongFromPlaylist(String playlistId, String songIdOrFileName) {
        Song s = getSongByFilePathOrTitle(songIdOrFileName);
        if (s == null) return;
        String sql = "DELETE FROM PlaylistTracks WHERE PlaylistID = ? AND SongID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, playlistId);
            ps.setString(2, s.getId());
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public boolean toggleUserFavorite(String username, String songIdOrFileName) {
        User user = getUserByUsername(username);
        if (user == null) return false;
        Song song = getSongByFilePathOrTitle(songIdOrFileName);
        if (song == null) return false;

        String checkSql = "SELECT FavoriteID FROM UserFavorites WHERE UserID = ? AND SongID = ?";
        try (Connection conn = getConnection()) {
            try (PreparedStatement ps = conn.prepareStatement(checkSql)) {
                ps.setString(1, user.getId());
                ps.setString(2, song.getId());
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        try (PreparedStatement del = conn.prepareStatement("DELETE FROM UserFavorites WHERE UserID = ? AND SongID = ?")) {
                            del.setString(1, user.getId());
                            del.setString(2, song.getId());
                            del.executeUpdate();
                            return false;
                        }
                    } else {
                        try (PreparedStatement ins = conn.prepareStatement("INSERT INTO UserFavorites (FavoriteID, UserID, SongID, FavoritedAt) VALUES (?, ?, ?, ?)")) {
                            ins.setString(1, UUID.randomUUID().toString());
                            ins.setString(2, user.getId());
                            ins.setString(3, song.getId());
                            ins.setString(4, Instant.now().toString());
                            ins.executeUpdate();
                            return true;
                        }
                    }
                }
            }
        } catch (SQLException e) { e.printStackTrace(); return false; }
    }

    // ==========================================
    // STATS & DASHBOARD
    // ==========================================
    public Map<String, Object> getAdminOverviewStats() {
        Map<String, Object> stats = new HashMap<>();
        try (Connection conn = getConnection(); Statement st = conn.createStatement()) {
            ResultSet rs = st.executeQuery("SELECT COUNT(*) AS c FROM Users WHERE IsDeleted = 0");
            int totalUsers = rs.next() ? rs.getInt("c") : 0;
            stats.put("totalUsers", totalUsers);

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM Users WHERE IsDeleted = 0 AND AccountStatus = 'Active'");
            stats.put("activeUsers", rs.next() ? rs.getInt("c") : 0);

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM ArtistProfiles WHERE IsDeleted = 0 AND Status = 'Approved'");
            stats.put("totalArtists", rs.next() ? rs.getInt("c") : 0);

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM ArtistProfiles WHERE IsDeleted = 0 AND Verified = 1");
            stats.put("verifiedArtists", rs.next() ? rs.getInt("c") : 0);

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM Songs WHERE IsDeleted = 0");
            stats.put("totalSongs", rs.next() ? rs.getInt("c") : 0);

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM Albums WHERE IsDeleted = 0");
            stats.put("totalAlbums", rs.next() ? rs.getInt("c") : 0);

            rs = st.executeQuery("SELECT COALESCE(SUM(PlayCount), 0) AS c FROM Songs WHERE IsDeleted = 0");
            stats.put("totalStreams", rs.next() ? rs.getLong("c") : 0L);

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM Users WHERE IsPremium = 1 AND IsDeleted = 0");
            int premiumUsers = rs.next() ? rs.getInt("c") : 0;
            stats.put("premiumUsers", premiumUsers);
            stats.put("monthlyRevenue", String.format(Locale.US, "$%.2f", premiumUsers * 4.99));

            rs = st.executeQuery("SELECT COUNT(*) AS c FROM ArtistRequests WHERE Status = 'Pending'");
            stats.put("pendingRequests", rs.next() ? rs.getInt("c") : 0);
        } catch (SQLException e) { e.printStackTrace(); }
        return stats;
    }

    public boolean toggleArtistVerification(String artistId) {
        String sql = "UPDATE ArtistProfiles SET Verified = CASE WHEN Verified = 1 THEN 0 ELSE 1 END WHERE ArtistID = ? OR UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, artistId);
            ps.setString(2, artistId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    public boolean updateArtistStatus(String artistId, String status) {
        String sql = "UPDATE ArtistProfiles SET Status = ? WHERE ArtistID = ? OR UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setString(2, artistId);
            ps.setString(3, artistId);
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }

    private static final Set<String> ALLOWED_AGG_TABLES = Set.of("Users", "Songs", "ArtistProfiles", "Albums");
    private static final Set<String> ALLOWED_AGG_COLS = Set.of("CreatedAt", "UploadedAt", "UpdatedAt");

    private int getCountBeforeDate(Connection conn, String table, String col, String dateStr) {
        if (!ALLOWED_AGG_TABLES.contains(table) || !ALLOWED_AGG_COLS.contains(col)) {
            throw new IllegalArgumentException("Unauthorized table or column for aggregation: " + table + "." + col);
        }
        String sql = "SELECT COUNT(*) FROM " + table + " WHERE substr(" + col + ", 1, 10) <= ? AND IsDeleted = 0";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, dateStr);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    private int getCountBeforeTimestamp(Connection conn, String table, String col, String ts) {
        if (!ALLOWED_AGG_TABLES.contains(table) || !ALLOWED_AGG_COLS.contains(col)) {
            throw new IllegalArgumentException("Unauthorized table or column for aggregation: " + table + "." + col);
        }
        String sql = "SELECT COUNT(*) FROM " + table + " WHERE " + col + " <= ? AND IsDeleted = 0";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, ts);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public Map<String, Object> getAdminChartData(String period) {
        Map<String, Object> data = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> userCounts = new ArrayList<>();
        List<Integer> songCounts = new ArrayList<>();
        List<Integer> artistCounts = new ArrayList<>();

        LocalDate today = LocalDate.now();

        try (Connection conn = getConnection()) {
            if ("today".equalsIgnoreCase(period)) {
                String todayStr = today.toString(); // e.g. "2026-11-16"
                labels = Arrays.asList("00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now");

                for (String checkpoint : labels) {
                    if ("Now".equals(checkpoint)) {
                        userCounts.add(getCountBeforeTimestamp(conn, "Users", "CreatedAt", "9999"));
                        songCounts.add(getCountBeforeTimestamp(conn, "Songs", "UploadedAt", "9999"));
                        artistCounts.add(getCountBeforeTimestamp(conn, "ArtistProfiles", "CreatedAt", "9999"));
                    } else {
                        String cutoffIso = todayStr + "T" + checkpoint + ":00";
                        String cutoffSpace = todayStr + " " + checkpoint + ":00";
                        String sqlUsers = "SELECT COUNT(*) FROM Users WHERE (CreatedAt <= ? OR CreatedAt <= ?) AND IsDeleted = 0";
                        String sqlSongs = "SELECT COUNT(*) FROM Songs WHERE (UploadedAt <= ? OR UploadedAt <= ?) AND IsDeleted = 0";
                        String sqlArtists = "SELECT COUNT(*) FROM ArtistProfiles WHERE (CreatedAt <= ? OR CreatedAt <= ?) AND IsDeleted = 0";

                        try (PreparedStatement ps = conn.prepareStatement(sqlUsers)) {
                            ps.setString(1, cutoffIso);
                            ps.setString(2, cutoffSpace);
                            try (ResultSet rs = ps.executeQuery()) { userCounts.add(rs.next() ? rs.getInt(1) : 0); }
                        }
                        try (PreparedStatement ps = conn.prepareStatement(sqlSongs)) {
                            ps.setString(1, cutoffIso);
                            ps.setString(2, cutoffSpace);
                            try (ResultSet rs = ps.executeQuery()) { songCounts.add(rs.next() ? rs.getInt(1) : 0); }
                        }
                        try (PreparedStatement ps = conn.prepareStatement(sqlArtists)) {
                            ps.setString(1, cutoffIso);
                            ps.setString(2, cutoffSpace);
                            try (ResultSet rs = ps.executeQuery()) { artistCounts.add(rs.next() ? rs.getInt(1) : 0); }
                        }
                    }
                }
            } else if ("week".equalsIgnoreCase(period)) {
                // Past 7 calendar days
                for (int i = 6; i >= 0; i--) {
                    LocalDate d = today.minusDays(i);
                    String dateStr = d.toString();
                    String dayName = d.getDayOfWeek().toString().substring(0, 3);
                    String label = (i == 0) ? "Today" : (dayName + " " + d.getDayOfMonth());
                    labels.add(label);
                    userCounts.add(getCountBeforeDate(conn, "Users", "CreatedAt", dateStr));
                    songCounts.add(getCountBeforeDate(conn, "Songs", "UploadedAt", dateStr));
                    artistCounts.add(getCountBeforeDate(conn, "ArtistProfiles", "CreatedAt", dateStr));
                }
            } else if ("month".equalsIgnoreCase(period)) {
                // Past 30 days sampled at 6 key intervals (Day -30, -24, -18, -12, -6, Today)
                int[] dayOffsets = {30, 24, 18, 12, 6, 0};
                for (int offset : dayOffsets) {
                    LocalDate d = today.minusDays(offset);
                    String dateStr = d.toString();
                    String label = (offset == 0) ? "Today" : (d.getMonth().toString().substring(0, 3) + " " + d.getDayOfMonth());
                    labels.add(label);
                    userCounts.add(getCountBeforeDate(conn, "Users", "CreatedAt", dateStr));
                    songCounts.add(getCountBeforeDate(conn, "Songs", "UploadedAt", dateStr));
                    artistCounts.add(getCountBeforeDate(conn, "ArtistProfiles", "CreatedAt", dateStr));
                }
            } else {
                // "all" - Real timeline over the past 6 calendar months
                for (int i = 5; i >= 0; i--) {
                    LocalDate m = today.minusMonths(i);
                    LocalDate endOfTargetMonth = (i == 0) ? today : m.withDayOfMonth(m.lengthOfMonth());
                    String dateStr = endOfTargetMonth.toString();
                    String label = (i == 0) ? (m.getMonth().toString().substring(0, 3) + " (Now)") : (m.getMonth().toString().substring(0, 3) + " " + m.getYear());
                    labels.add(label);
                    userCounts.add(getCountBeforeDate(conn, "Users", "CreatedAt", dateStr));
                    songCounts.add(getCountBeforeDate(conn, "Songs", "UploadedAt", dateStr));
                    artistCounts.add(getCountBeforeDate(conn, "ArtistProfiles", "CreatedAt", dateStr));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }

        data.put("labels", labels);
        data.put("users", userCounts);
        data.put("songs", songCounts);
        data.put("artists", artistCounts);
        data.put("period", period);
        return data;
    }


    public Map<String, Object> getArtistDashboardStats(String userId) {
        Map<String, Object> map = new HashMap<>();
        List<Song> songs = new ArrayList<>();
        String songSql = "SELECT * FROM Songs WHERE UserID = ? AND IsDeleted = 0";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(songSql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) songs.add(mapSong(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }

        long totalStreams = songs.stream().mapToLong(Song::getPlayCount).sum();
        ArtistProfile profile = getArtistProfileByUserId(userId);
        int totalAlbums = 0;
        if (profile != null) {
            totalAlbums = getAlbumsByArtist(profile.getArtistId()).size();
        }

        songs.sort((a, b) -> (b.getUploadedAt() != null ? b.getUploadedAt() : "").compareTo(a.getUploadedAt() != null ? a.getUploadedAt() : ""));
        List<Map<String, Object>> recent = new ArrayList<>();
        for (int i = 0; i < Math.min(5, songs.size()); i++) {
            Song s = songs.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("Title", s.getTitle());
            item.put("Tags", s.getTags() != null && !s.getTags().isEmpty() ? s.getTags() : s.getGenre());
            item.put("Mood", s.getMood());
            item.put("PlayCount", s.getPlayCount());
            item.put("UploadedAt", s.getUploadedAt());
            recent.add(item);
        }

        map.put("totalStreams", totalStreams);
        map.put("totalSongs", songs.size());
        map.put("totalAlbums", totalAlbums);
        map.put("recentSongs", recent);
        return map;
    }

    // ==========================================
    // ROW MAPPERS
    // ==========================================
    private User mapUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getString("UserID"));
        u.setUsername(rs.getString("Username"));
        u.setEmail(rs.getString("Email"));
        u.setPasswordHash(rs.getString("PasswordHash"));
        u.setRole(rs.getString("Role"));
        u.setDisplayName(rs.getString("DisplayName"));
        u.setBio(rs.getString("Bio"));
        u.setAvatarUrl(rs.getString("AvatarUrl"));
        u.setSubscriptionTier(rs.getString("SubscriptionTier"));
        u.setIncognito(rs.getInt("IsIncognito") == 1);
        u.setAccountStatus(rs.getString("AccountStatus"));
        u.setEmailVerified(rs.getInt("IsEmailVerified") == 1);
        u.setNationality(rs.getString("Nationality"));
        u.setGender(rs.getString("Gender"));
        u.setDateOfBirth(rs.getString("DateOfBirth"));
        u.setDeleted(rs.getInt("IsDeleted") == 1);
        u.setPremium(rs.getInt("IsPremium") == 1);
        try {
            u.setArtist(rs.getInt("IsArtist") == 1 || "artist".equalsIgnoreCase(u.getRole()));
        } catch (SQLException ignored) {
            u.setArtist("artist".equalsIgnoreCase(u.getRole()));
        }
        u.setCreatedAt(rs.getString("CreatedAt"));
        u.setUpdatedAt(rs.getString("UpdatedAt"));
        return u;
    }

    private Song mapSong(ResultSet rs) throws SQLException {
        return mapSong(rs, false);
    }

    private Song mapSong(ResultSet rs, boolean includeBlobs) throws SQLException {
        Song s = new Song();
        s.setId(rs.getString("SongID"));
        s.setUserId(rs.getString("UserID"));
        s.setGenreId(rs.getString("GenreID"));
        s.setAlbumId(rs.getString("AlbumID"));
        s.setSource(rs.getString("Source"));
        s.setSourceId(rs.getString("SourceID"));
        s.setTitle(rs.getString("Title"));
        s.setArtist(rs.getString("ArtistName"));
        s.setCollabArtists(rs.getString("CollabArtists"));
        s.setAlbum(rs.getString("Album"));
        s.setDurationMs(rs.getLong("DurationSeconds"));
        s.setUri(rs.getString("Uri"));
        s.setPopularity(rs.getInt("Popularity"));
        s.setUploadedAt(rs.getString("UploadedAt"));
        s.setGenre(rs.getString("Genre"));
        s.setMood(rs.getString("Mood"));
        s.setLanguage(rs.getString("Language"));
        s.setTempo(rs.getDouble("Tempo"));
        s.setEnergy(rs.getDouble("Energy"));
        s.setDanceability(rs.getDouble("Danceability"));
        s.setValence(rs.getDouble("Valence"));
        s.setAcousticness(rs.getDouble("Acousticness"));
        s.setInstrumentalness(rs.getDouble("Instrumentalness"));
        s.setKey(rs.getInt("Key"));
        s.setMode(rs.getInt("Mode"));
        s.setTags(rs.getString("Tags"));
        s.setFilePath(rs.getString("FilePath"));
        if (includeBlobs) {
            try { s.setFileData(rs.getBytes("FileData")); } catch (SQLException ignored) {}
            try { s.setCoverArtData(rs.getBytes("CoverArtData")); } catch (SQLException ignored) {}
        }
        s.setCoverArtUrl(rs.getString("CoverArtUrl"));
        s.setReleaseDate(rs.getString("ReleaseDate"));
        s.setCredits(rs.getString("Credits"));
        s.setLyrics(rs.getString("Lyrics"));
        s.setStorageUrl(rs.getString("StorageUrl"));
        s.setPlayCount(rs.getLong("PlayCount"));
        s.setDeleted(rs.getInt("IsDeleted") == 1);
        s.setHidden(rs.getInt("IsHidden") == 1);
        return s;
    }

    private Album mapAlbum(ResultSet rs) throws SQLException {
        Album a = new Album();
        a.setId(rs.getString("AlbumID"));
        a.setTitle(rs.getString("Title"));
        a.setArtistId(rs.getString("ArtistID"));
        a.setDescription(rs.getString("Description"));
        a.setCoverArtUrl(rs.getString("CoverArtUrl"));
        try { a.setCoverArtData(rs.getBytes("CoverArtData")); } catch (SQLException ignored) {}
        a.setCreatedAt(rs.getString("CreatedAt"));
        a.setDeleted(rs.getInt("IsDeleted") == 1);
        return a;
    }

    private ArtistProfile mapArtistProfile(ResultSet rs) throws SQLException {
        ArtistProfile p = new ArtistProfile();
        p.setArtistId(rs.getString("ArtistID"));
        p.setUserId(rs.getString("UserID"));
        p.setStageName(rs.getString("StageName"));
        p.setBio(rs.getString("Bio"));
        p.setGenre(rs.getString("Genre"));
        p.setVerified(rs.getInt("Verified") == 1);
        p.setStatus(rs.getString("Status"));
        p.setFollowersCount(rs.getInt("FollowersCount"));
        p.setWebsite(rs.getString("Website"));
        p.setBannerImageUrl(rs.getString("BannerImageUrl"));
        p.setProfileImageUrl(rs.getString("ProfileImageUrl"));
        p.setDateOfBirth(rs.getString("DateOfBirth"));
        p.setNationality(rs.getString("Nationality"));
        p.setDeleted(rs.getInt("IsDeleted") == 1);
        p.setCreatedAt(rs.getString("CreatedAt"));
        return p;
    }

    private ArtistRequest mapArtistRequest(ResultSet rs) throws SQLException {
        ArtistRequest r = new ArtistRequest();
        r.setRequestId(rs.getString("RequestID"));
        r.setUserId(rs.getString("UserID"));
        r.setStageName(rs.getString("StageName"));
        r.setStatus(rs.getString("Status"));
        r.setCvFileName(rs.getString("CvFileName"));
        r.setCvFileData(rs.getBytes("CvFileData"));
        r.setDemoFileName(rs.getString("DemoFileName"));
        r.setDemoFileData(rs.getBytes("DemoFileData"));
        r.setAdminNotes(rs.getString("AdminNotes"));
        r.setCreatedAt(rs.getString("CreatedAt"));
        r.setResolvedAt(rs.getString("ResolvedAt"));
        return r;
    }

    // ==========================================
    // TRANSACTION & SUBSCRIPTION METHODS
    // ==========================================
    public Transaction recordTransaction(String userId, String planType, double amount, 
                                         String paymentMethod, String cardBrand, 
                                         String cardLast4, String authCode, String status) {
        String id = "TX-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        String now = Instant.now().toString();
        String sql = """
            INSERT INTO Transactions (TransactionID, UserID, PlanType, Amount, Currency, PaymentMethod, CardBrand, CardLast4, AuthCode, Status, CreatedAt)
            VALUES (?, ?, ?, ?, 'USD', ?, ?, ?, ?, ?, ?)
        """;
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, id);
            ps.setString(2, userId);
            ps.setString(3, planType);
            ps.setDouble(4, amount);
            ps.setString(5, paymentMethod != null ? paymentMethod : "Card");
            ps.setString(6, cardBrand != null ? cardBrand : "Visa");
            ps.setString(7, cardLast4 != null ? cardLast4 : "4242");
            ps.setString(8, authCode != null ? authCode : "");
            ps.setString(9, status != null ? status : "Completed");
            ps.setString(10, now);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return getTransactionById(id);
    }

    public Transaction getTransactionById(String transactionId) {
        String sql = "SELECT * FROM Transactions WHERE TransactionID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, transactionId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return mapTransaction(rs);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<Transaction> getUserTransactions(String userId) {
        List<Transaction> list = new ArrayList<>();
        String sql = "SELECT * FROM Transactions WHERE UserID = ? ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, userId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(mapTransaction(rs));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public void updateSubscription(String userId, String tier, boolean isPremium) {
        String now = Instant.now().toString();
        String sql = "UPDATE Users SET SubscriptionTier = ?, IsPremium = ?, UpdatedAt = ? WHERE UserID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, tier);
            ps.setInt(2, isPremium ? 1 : 0);
            ps.setString(3, now);
            ps.setString(4, userId);
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private Transaction mapTransaction(ResultSet rs) throws SQLException {
        Transaction t = new Transaction();
        t.setTransactionId(rs.getString("TransactionID"));
        t.setUserId(rs.getString("UserID"));
        t.setPlanType(rs.getString("PlanType"));
        t.setAmount(rs.getDouble("Amount"));
        t.setCurrency(rs.getString("Currency"));
        t.setPaymentMethod(rs.getString("PaymentMethod"));
        t.setCardBrand(rs.getString("CardBrand"));
        t.setCardLast4(rs.getString("CardLast4"));
        t.setAuthCode(rs.getString("AuthCode"));
        t.setStatus(rs.getString("Status"));
        t.setCreatedAt(rs.getString("CreatedAt"));
        return t;
    }

    // ==========================================
    // LOGGING & TELEMETRY SUITE
    // ==========================================
    public void logAdminAction(String adminIdOrUsername, String action, String targetType, String targetId, String details) {
        String logId = "AUD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String sql = "INSERT INTO AdminAuditLogs (AuditLogID, AdminID, Action, TargetType, TargetID, Details, Timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, logId);
            ps.setString(2, adminIdOrUsername != null ? adminIdOrUsername : "admin");
            ps.setString(3, action != null ? action : "ACTION");
            ps.setString(4, targetType != null ? targetType : "");
            ps.setString(5, targetId != null ? targetId : "");
            ps.setString(6, details != null ? details : "");
            ps.setString(7, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getAdminAuditLogs(int limit) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT * FROM AdminAuditLogs ORDER BY Timestamp DESC LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 100);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("AuditLogID", rs.getString("AuditLogID"));
                    map.put("AdminID", rs.getString("AdminID"));
                    map.put("Action", rs.getString("Action"));
                    map.put("TargetType", rs.getString("TargetType"));
                    map.put("TargetID", rs.getString("TargetID"));
                    map.put("Details", rs.getString("Details"));
                    map.put("Timestamp", rs.getString("Timestamp"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public void logUserActivity(String userId, String activityType, String details, String ipAddress) {
        String logId = "ACT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String sql = "INSERT INTO UserActivityLogs (LogID, UserID, ActivityType, Details, IpAddress, Timestamp) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, logId);
            ps.setString(2, userId != null ? userId : "anonymous");
            ps.setString(3, activityType != null ? activityType : "UNKNOWN");
            ps.setString(4, details != null ? details : "");
            ps.setString(5, ipAddress != null ? ipAddress : "127.0.0.1");
            ps.setString(6, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public List<Map<String, Object>> getUserActivityLogs(int limit) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT a.*, u.Username, u.DisplayName, u.Email FROM UserActivityLogs a LEFT JOIN Users u ON a.UserID = u.UserID ORDER BY a.Timestamp DESC LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 100);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("LogID", rs.getString("LogID"));
                    map.put("UserID", rs.getString("UserID"));
                    map.put("Username", rs.getString("Username") != null ? rs.getString("Username") : (rs.getString("UserID") != null ? rs.getString("UserID") : "Guest"));
                    map.put("ActivityType", rs.getString("ActivityType"));
                    map.put("Details", rs.getString("Details"));
                    map.put("IpAddress", rs.getString("IpAddress"));
                    map.put("Timestamp", rs.getString("Timestamp"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Map<String, Object>> getRecentStreamLogs(int limit) {
        List<Map<String, Object>> list = new ArrayList<>();
        String sql = "SELECT sl.*, s.Title as SongTitle, s.ArtistName, u.Username FROM StreamLogs sl LEFT JOIN Songs s ON sl.SongID = s.SongID LEFT JOIN Users u ON sl.UserID = u.UserID ORDER BY sl.Timestamp DESC LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 100);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("StreamID", rs.getString("StreamID"));
                    map.put("SongTitle", rs.getString("SongTitle") != null ? rs.getString("SongTitle") : "Streamed Track");
                    map.put("ArtistName", rs.getString("ArtistName") != null ? rs.getString("ArtistName") : "Various");
                    map.put("Username", rs.getString("Username") != null ? rs.getString("Username") : (rs.getString("UserID") != null ? rs.getString("UserID") : "Guest"));
                    map.put("DeviceType", rs.getString("DeviceType"));
                    map.put("IpAddress", rs.getString("IpAddress"));
                    map.put("Timestamp", rs.getString("Timestamp"));
                    list.add(map);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Song> getTopStreamedSongs(int limit) {
        List<Song> list = new ArrayList<>();
        String sql = SONG_METADATA_SELECT + " WHERE IsDeleted = 0 ORDER BY PlayCount DESC, Title ASC LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 10);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapSong(rs));
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    public List<Transaction> getAllTransactions(int limit) {
        List<Transaction> list = new ArrayList<>();
        String sql = "SELECT * FROM Transactions ORDER BY CreatedAt DESC LIMIT ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, limit > 0 ? limit : 100);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) list.add(mapTransaction(rs));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public Map<String, Object> getSystemHealthStats() {
        Map<String, Object> map = new HashMap<>();
        Runtime rt = Runtime.getRuntime();
        long totalMem = rt.totalMemory() / (1024 * 1024);
        long freeMem = rt.freeMemory() / (1024 * 1024);
        long usedMem = totalMem - freeMem;
        long maxMem = rt.maxMemory() / (1024 * 1024);

        map.put("usedMemoryMb", usedMem);
        map.put("totalMemoryMb", totalMem);
        map.put("maxMemoryMb", maxMem);
        map.put("freeMemoryMb", freeMem);
        map.put("memoryPercent", Math.round(((double) usedMem / totalMem) * 100.0));
        map.put("availableProcessors", rt.availableProcessors());
        map.put("activeThreads", Thread.activeCount());

        File dbFile = new File(dbPathConfig);
        if (!dbFile.exists()) dbFile = new File("../backendai.db");
        if (!dbFile.exists()) dbFile = new File("backendai.db");
        map.put("dbFileSizeKb", dbFile.exists() ? (dbFile.length() / 1024) : 0);
        map.put("dbFilePath", dbFile.getAbsolutePath());

        map.put("javaVersion", System.getProperty("java.version"));
        map.put("osName", System.getProperty("os.name"));
        map.put("osArch", System.getProperty("os.arch"));

        return map;
    }

    // ==========================================
    // SEED HELPERS FOR NEW ENTERPRISE SUITE
    // ==========================================
    private void seedPlatformSettings(Connection conn) {
        String countSql = "SELECT COUNT(*) FROM PlatformSettings";
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(countSql)) {
            if (rs.next() && rs.getInt(1) == 0) {
                String now = Instant.now().toString();
                String insertSql = "INSERT INTO PlatformSettings (SettingKey, SettingValue, Description, Category, UpdatedAt) VALUES (?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                    Object[][] defaults = {
                        {"free_tier_skip_limit", "6", "Max skips allowed per hour for Free tier", "freetier"},
                        {"free_tier_ad_frequency", "3", "Play an ad break every N songs for Free tier", "freetier"},
                        {"free_tier_bitrate_cap", "128", "Max audio streaming bitrate in kbps for Free tier", "freetier"},
                        {"free_tier_lyrics_mode", "blur", "Lyrics access mode for Free tier (blur/hidden/full)", "freetier"},
                        {"allow_user_registration", "true", "Allow new listeners to register accounts", "general"},
                        {"maintenance_mode", "false", "Enable global maintenance mode", "general"},
                        {"maintenance_message", "We are currently performing routine maintenance. Streaming will resume shortly!", "Maintenance alert banner text", "general"},
                        {"ai_recommendation_engine", "true", "Enable ChromaDB hybrid AI vector recommendations", "ai"},
                        {"price_individual_usd", "4.99", "Premium Individual plan monthly price in USD", "billing"},
                        {"price_individual_vnd", "133619", "Premium Individual plan monthly price in VND", "billing"},
                        {"price_student_usd", "2.49", "Premium Student plan monthly price in USD", "billing"},
                        {"price_student_vnd", "65000", "Premium Student plan monthly price in VND", "billing"},
                        {"price_family_usd", "8.99", "Premium Family plan monthly price in USD", "billing"},
                        {"price_family_vnd", "240000", "Premium Family plan monthly price in VND", "billing"}
                    };
                    for (Object[] row : defaults) {
                        ps.setString(1, (String) row[0]);
                        ps.setString(2, (String) row[1]);
                        ps.setString(3, (String) row[2]);
                        ps.setString(4, (String) row[3]);
                        ps.setString(5, now);
                        ps.executeUpdate();
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to seed PlatformSettings: " + e.getMessage());
        }
    }

    private void seedAdvertisements(Connection conn) {
        String countSql = "SELECT COUNT(*) FROM Advertisements";
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(countSql)) {
            if (rs.next() && rs.getInt(1) == 0) {
                String now = Instant.now().toString();
                String insertSql = "INSERT INTO Advertisements (Title, Sponsor, AdType, MediaUrl, ClickUrl, Impressions, Clicks, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                    ps.setString(1, "Spotifake Premium - Ad-Free Listening");
                    ps.setString(2, "Spotifake Official");
                    ps.setString(3, "audio");
                    ps.setString(4, "/audio/ad_sample.mp3");
                    ps.setString(5, "/subscription");
                    ps.setInt(6, 42);
                    ps.setInt(7, 8);
                    ps.setInt(8, 1);
                    ps.setString(9, now);
                    ps.executeUpdate();

                    ps.setString(1, "Back to School Student Discount 50% Off");
                    ps.setString(2, "Spotifake Campus");
                    ps.setString(3, "banner");
                    ps.setString(4, "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600");
                    ps.setString(5, "/subscription");
                    ps.setInt(6, 128);
                    ps.setInt(7, 24);
                    ps.setInt(8, 1);
                    ps.setString(9, now);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to seed Advertisements: " + e.getMessage());
        }
    }

    private void seedContentReports(Connection conn) {
        String countSql = "SELECT COUNT(*) FROM ContentReports";
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(countSql)) {
            if (rs.next() && rs.getInt(1) == 0) {
                String now = Instant.now().toString();
                String insertSql = "INSERT INTO ContentReports (ItemType, ItemID, ItemTitle, Reason, Description, Status, ReportedBy, CreatedAt, ResolvedBy, ResolutionNotes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                    ps.setString(1, "Song");
                    ps.setInt(2, 1);
                    ps.setString(3, "Demo Track #1");
                    ps.setString(4, "Copyright/DMCA");
                    ps.setString(5, "Automated metadata tag mismatch flagged for catalog review");
                    ps.setString(6, "Pending");
                    ps.setString(7, "system_crawler");
                    ps.setString(8, now);
                    ps.setString(9, "");
                    ps.setString(10, "");
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to seed ContentReports: " + e.getMessage());
        }
    }

    private void seedPlatformAnnouncements(Connection conn) {
        String countSql = "SELECT COUNT(*) FROM PlatformAnnouncements";
        try (Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(countSql)) {
            if (rs.next() && rs.getInt(1) == 0) {
                String now = Instant.now().toString();
                String insertSql = "INSERT INTO PlatformAnnouncements (Title, Message, Level, TargetRole, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)";
                try (PreparedStatement ps = conn.prepareStatement(insertSql)) {
                    ps.setString(1, "Welcome to Spotifake 2.0");
                    ps.setString(2, "Experience all-new AI smart radios, synchronized lyrics, and lossless audio streaming!");
                    ps.setString(3, "info");
                    ps.setString(4, "all");
                    ps.setInt(5, 1);
                    ps.setString(6, now);
                    ps.executeUpdate();
                }
            }
        } catch (SQLException e) {
            System.err.println("Failed to seed PlatformAnnouncements: " + e.getMessage());
        }
    }

    // ==========================================
    // PLATFORM SETTINGS METHODS
    // ==========================================
    public List<PlatformSetting> getAllSettings() {
        List<PlatformSetting> list = new ArrayList<>();
        String sql = "SELECT * FROM PlatformSettings ORDER BY Category ASC, SettingKey ASC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new PlatformSetting(
                    rs.getString("SettingKey"),
                    rs.getString("SettingValue"),
                    rs.getString("Description"),
                    rs.getString("Category"),
                    rs.getString("UpdatedAt")
                ));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public String getSetting(String key, String defaultValue) {
        String sql = "SELECT SettingValue FROM PlatformSettings WHERE SettingKey = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getString("SettingValue");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return defaultValue;
    }

    public void updateSetting(String key, String value, String description, String category) {
        String sql = "INSERT INTO PlatformSettings (SettingKey, SettingValue, Description, Category, UpdatedAt) VALUES (?, ?, ?, ?, ?) " +
                     "ON CONFLICT(SettingKey) DO UPDATE SET SettingValue = excluded.SettingValue, UpdatedAt = excluded.UpdatedAt";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, key);
            ps.setString(2, value);
            ps.setString(3, description != null ? description : "");
            ps.setString(4, category != null ? category : "general");
            ps.setString(5, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public Map<String, Object> getPublicSettingsMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("skipLimit", Integer.parseInt(getSetting("free_tier_skip_limit", "6")));
        map.put("adFrequency", Integer.parseInt(getSetting("free_tier_ad_frequency", "3")));
        map.put("bitrateCap", getSetting("free_tier_bitrate_cap", "128"));
        map.put("lyricsMode", getSetting("free_tier_lyrics_mode", "blur"));
        map.put("allowRegistration", Boolean.parseBoolean(getSetting("allow_user_registration", "true")));
        map.put("maintenanceMode", Boolean.parseBoolean(getSetting("maintenance_mode", "false")));
        map.put("maintenanceMessage", getSetting("maintenance_message", ""));
        map.put("aiEngineEnabled", Boolean.parseBoolean(getSetting("ai_recommendation_engine", "true")));
        return map;
    }

    // ==========================================
    // ADVERTISEMENTS METHODS
    // ==========================================
    public List<Advertisement> getAllAdvertisements() {
        List<Advertisement> list = new ArrayList<>();
        String sql = "SELECT * FROM Advertisements ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new Advertisement(
                    rs.getInt("AdID"),
                    rs.getString("Title"),
                    rs.getString("Sponsor"),
                    rs.getString("AdType"),
                    rs.getString("MediaUrl"),
                    rs.getString("ClickUrl"),
                    rs.getInt("Impressions"),
                    rs.getInt("Clicks"),
                    rs.getInt("IsActive") == 1,
                    rs.getString("CreatedAt")
                ));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<Advertisement> getActiveAdvertisements(String type) {
        List<Advertisement> list = new ArrayList<>();
        String sql = (type == null || type.equalsIgnoreCase("all")) 
            ? "SELECT * FROM Advertisements WHERE IsActive = 1 ORDER BY RANDOM()"
            : "SELECT * FROM Advertisements WHERE IsActive = 1 AND LOWER(AdType) = LOWER(?) ORDER BY RANDOM()";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            if (type != null && !type.equalsIgnoreCase("all")) ps.setString(1, type);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new Advertisement(
                        rs.getInt("AdID"),
                        rs.getString("Title"),
                        rs.getString("Sponsor"),
                        rs.getString("AdType"),
                        rs.getString("MediaUrl"),
                        rs.getString("ClickUrl"),
                        rs.getInt("Impressions"),
                        rs.getInt("Clicks"),
                        true,
                        rs.getString("CreatedAt")
                    ));
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public void addAdvertisement(String title, String sponsor, String adType, String mediaUrl, String clickUrl, boolean active) {
        String sql = "INSERT INTO Advertisements (Title, Sponsor, AdType, MediaUrl, ClickUrl, Impressions, Clicks, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ps.setString(2, sponsor);
            ps.setString(3, adType != null ? adType : "audio");
            ps.setString(4, mediaUrl != null ? mediaUrl : "");
            ps.setString(5, clickUrl != null ? clickUrl : "");
            ps.setInt(6, active ? 1 : 0);
            ps.setString(7, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void updateAdvertisement(int id, String title, String sponsor, String adType, String mediaUrl, String clickUrl, boolean active) {
        String sql = "UPDATE Advertisements SET Title = ?, Sponsor = ?, AdType = ?, MediaUrl = ?, ClickUrl = ?, IsActive = ? WHERE AdID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ps.setString(2, sponsor);
            ps.setString(3, adType);
            ps.setString(4, mediaUrl);
            ps.setString(5, clickUrl);
            ps.setInt(6, active ? 1 : 0);
            ps.setInt(7, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void toggleAdvertisement(int id, boolean active) {
        String sql = "UPDATE Advertisements SET IsActive = ? WHERE AdID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, active ? 1 : 0);
            ps.setInt(2, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void deleteAdvertisement(int id) {
        String sql = "DELETE FROM Advertisements WHERE AdID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void recordAdImpression(int id) {
        String sql = "UPDATE Advertisements SET Impressions = Impressions + 1 WHERE AdID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void recordAdClick(int id) {
        String sql = "UPDATE Advertisements SET Clicks = Clicks + 1 WHERE AdID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    // ==========================================
    // CONTENT REPORTS METHODS
    // ==========================================
    public List<ContentReport> getAllContentReports(String statusFilter) {
        List<ContentReport> list = new ArrayList<>();
        String sql = (statusFilter == null || statusFilter.equalsIgnoreCase("all"))
            ? "SELECT * FROM ContentReports ORDER BY CreatedAt DESC"
            : "SELECT * FROM ContentReports WHERE LOWER(Status) = LOWER(?) ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            if (statusFilter != null && !statusFilter.equalsIgnoreCase("all")) ps.setString(1, statusFilter);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new ContentReport(
                        rs.getInt("ReportID"),
                        rs.getString("ItemType"),
                        rs.getInt("ItemID"),
                        rs.getString("ItemTitle"),
                        rs.getString("Reason"),
                        rs.getString("Description"),
                        rs.getString("Status"),
                        rs.getString("ReportedBy"),
                        rs.getString("CreatedAt"),
                        rs.getString("ResolvedBy"),
                        rs.getString("ResolutionNotes")
                    ));
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public void createContentReport(String itemType, int itemId, String itemTitle, String reason, String description, String reportedBy) {
        String sql = "INSERT INTO ContentReports (ItemType, ItemID, ItemTitle, Reason, Description, Status, ReportedBy, CreatedAt, ResolvedBy, ResolutionNotes) VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, '', '')";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, itemType);
            ps.setInt(2, itemId);
            ps.setString(3, itemTitle != null ? itemTitle : "Unknown Item");
            ps.setString(4, reason != null ? reason : "General");
            ps.setString(5, description != null ? description : "");
            ps.setString(6, reportedBy != null ? reportedBy : "anonymous");
            ps.setString(7, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void resolveContentReport(int reportId, String action, String notes, String adminUser) {
        String sql = "UPDATE ContentReports SET Status = ?, ResolutionNotes = ?, ResolvedBy = ? WHERE ReportID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, action);
            ps.setString(2, notes != null ? notes : "");
            ps.setString(3, adminUser != null ? adminUser : "admin");
            ps.setInt(4, reportId);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    // ==========================================
    // PLATFORM ANNOUNCEMENTS METHODS
    // ==========================================
    public List<PlatformAnnouncement> getAllAnnouncements() {
        List<PlatformAnnouncement> list = new ArrayList<>();
        String sql = "SELECT * FROM PlatformAnnouncements ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                list.add(new PlatformAnnouncement(
                    rs.getInt("AnnouncementID"),
                    rs.getString("Title"),
                    rs.getString("Message"),
                    rs.getString("Level"),
                    rs.getString("TargetRole"),
                    rs.getInt("IsActive") == 1,
                    rs.getString("CreatedAt")
                ));
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public List<PlatformAnnouncement> getActiveAnnouncements(String targetRole) {
        List<PlatformAnnouncement> list = new ArrayList<>();
        String sql = "SELECT * FROM PlatformAnnouncements WHERE IsActive = 1 AND (TargetRole = 'all' OR LOWER(TargetRole) = LOWER(?)) ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, targetRole != null ? targetRole : "all");
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(new PlatformAnnouncement(
                        rs.getInt("AnnouncementID"),
                        rs.getString("Title"),
                        rs.getString("Message"),
                        rs.getString("Level"),
                        rs.getString("TargetRole"),
                        true,
                        rs.getString("CreatedAt")
                    ));
                }
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return list;
    }

    public void createAnnouncement(String title, String message, String level, String targetRole, boolean active) {
        String sql = "INSERT INTO PlatformAnnouncements (Title, Message, Level, TargetRole, IsActive, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, title);
            ps.setString(2, message);
            ps.setString(3, level != null ? level : "info");
            ps.setString(4, targetRole != null ? targetRole : "all");
            ps.setInt(5, active ? 1 : 0);
            ps.setString(6, Instant.now().toString());
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void toggleAnnouncement(int id, boolean active) {
        String sql = "UPDATE PlatformAnnouncements SET IsActive = ? WHERE AnnouncementID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, active ? 1 : 0);
            ps.setInt(2, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    public void deleteAnnouncement(int id) {
        String sql = "DELETE FROM PlatformAnnouncements WHERE AnnouncementID = ?";
        try (Connection conn = getConnection(); PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ps.executeUpdate();
        } catch (SQLException e) { e.printStackTrace(); }
    }

    // ==========================================
    // CSV EXPORT METHODS
    // ==========================================
    public String exportUsersCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("UserID,Username,Email,Role,SubscriptionTier,AccountStatus,CreatedAt\n");
        String sql = "SELECT UserID, Username, Email, Role, SubscriptionTier, AccountStatus, CreatedAt FROM Users WHERE IsDeleted = 0 ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                sb.append(escapeCsv(rs.getString("UserID"))).append(",")
                  .append(escapeCsv(rs.getString("Username"))).append(",")
                  .append(escapeCsv(rs.getString("Email"))).append(",")
                  .append(escapeCsv(rs.getString("Role"))).append(",")
                  .append(escapeCsv(rs.getString("SubscriptionTier"))).append(",")
                  .append(escapeCsv(rs.getString("AccountStatus"))).append(",")
                  .append(escapeCsv(rs.getString("CreatedAt"))).append("\n");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return sb.toString();
    }

    public String exportSongsCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("SongID,Title,ArtistName,Album,Genre,DurationSeconds,PlayCount,UploadedAt\n");
        String sql = "SELECT SongID, Title, ArtistName, Album, Genre, DurationSeconds, PlayCount, UploadedAt FROM Songs WHERE IsDeleted = 0 ORDER BY Title ASC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                sb.append(escapeCsv(rs.getString("SongID"))).append(",")
                  .append(escapeCsv(rs.getString("Title"))).append(",")
                  .append(escapeCsv(rs.getString("ArtistName"))).append(",")
                  .append(escapeCsv(rs.getString("Album"))).append(",")
                  .append(escapeCsv(rs.getString("Genre"))).append(",")
                  .append(rs.getInt("DurationSeconds")).append(",")
                  .append(rs.getInt("PlayCount")).append(",")
                  .append(escapeCsv(rs.getString("UploadedAt"))).append("\n");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return sb.toString();
    }

    public String exportStreamsCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("StreamID,SongID,SongTitle,UserID,DeviceType,IpAddress,Timestamp\n");
        String sql = "SELECT sl.StreamID, sl.SongID, s.Title as SongTitle, sl.UserID, sl.DeviceType, sl.IpAddress, sl.Timestamp FROM StreamLogs sl LEFT JOIN Songs s ON sl.SongID = s.SongID ORDER BY sl.Timestamp DESC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                sb.append(escapeCsv(rs.getString("StreamID"))).append(",")
                  .append(escapeCsv(rs.getString("SongID"))).append(",")
                  .append(escapeCsv(rs.getString("SongTitle"))).append(",")
                  .append(escapeCsv(rs.getString("UserID"))).append(",")
                  .append(escapeCsv(rs.getString("DeviceType"))).append(",")
                  .append(escapeCsv(rs.getString("IpAddress"))).append(",")
                  .append(escapeCsv(rs.getString("Timestamp"))).append("\n");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return sb.toString();
    }

    public String exportTransactionsCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("TransactionID,UserID,PlanType,Amount,Currency,PaymentMethod,CardBrand,CardLast4,Status,CreatedAt\n");
        String sql = "SELECT * FROM Transactions ORDER BY CreatedAt DESC";
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery(sql)) {
            while (rs.next()) {
                sb.append(escapeCsv(rs.getString("TransactionID"))).append(",")
                  .append(escapeCsv(rs.getString("UserID"))).append(",")
                  .append(escapeCsv(rs.getString("PlanType"))).append(",")
                  .append(rs.getDouble("Amount")).append(",")
                  .append(escapeCsv(rs.getString("Currency"))).append(",")
                  .append(escapeCsv(rs.getString("PaymentMethod"))).append(",")
                  .append(escapeCsv(rs.getString("CardBrand"))).append(",")
                  .append(escapeCsv(rs.getString("CardLast4"))).append(",")
                  .append(escapeCsv(rs.getString("Status"))).append(",")
                  .append(escapeCsv(rs.getString("CreatedAt"))).append("\n");
            }
        } catch (SQLException e) { e.printStackTrace(); }
        return sb.toString();
    }

    private String escapeCsv(String str) {
        if (str == null) return "\"\"";
        return "\"" + str.replace("\"", "\"\"").replace("\n", " ") + "\"";
    }

    // ==========================================
    // DATABASE MAINTENANCE TOOLS
    // ==========================================
    public void vacuumDatabase() {
        try (Connection conn = getConnection(); Statement s = conn.createStatement()) {
            s.execute("VACUUM");
            s.execute("PRAGMA optimize");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public String checkDatabaseIntegrity() {
        try (Connection conn = getConnection(); Statement s = conn.createStatement(); ResultSet rs = s.executeQuery("PRAGMA integrity_check")) {
            if (rs.next()) return rs.getString(1);
        } catch (SQLException e) {
            return "Error: " + e.getMessage();
        }
        return "ok";
    }

    public File getDatabaseFile() {
        File dbFile = new File(dbPathConfig);
        if (!dbFile.exists()) dbFile = new File("../backendai.db");
        if (!dbFile.exists()) dbFile = new File("backendai.db");
        return dbFile;
    }

}
