

--- VERSION ---

/*
=========================================================
 MusicPlayerDb - FIXED & FULLY IDEMPOTENT DDL SCRIPT
 Fixes:
  1. Msg 2714: Table already exists -> Added DROP TABLE IF EXISTS in reverse dependency order.
  2. Msg 1785: Multiple cascade paths -> Set ON DELETE NO ACTION on second cascade paths.
  3. Msg 1911/1769: Column mismatch -> Unified column schema across all tables.
  4. Msg 1919: Invalid key column for index -> Ensured Title/ArtistName are NVARCHAR(255).
  5. Consolidated Part 3.5 extended Song columns into core Songs table definition.
=========================================================
*/

USE master;
GO

IF DB_ID('MusicPlayerDb') IS NULL
BEGIN
    CREATE DATABASE MusicPlayerDb;
END
GO

USE MusicPlayerDb;
GO

PRINT 'MusicPlayerDb database selected.';
GO

/*
=========================================================
 Part 1 - Drop Existing Foreign Keys & Tables (Clean Reset)
=========================================================
*/

-- Drop tables in reverse dependency order to avoid foreign key errors
DROP TABLE IF EXISTS Comments;
DROP TABLE IF EXISTS AdminAuditLogs;
DROP TABLE IF EXISTS ArtistAnalytics;
DROP TABLE IF EXISTS UserListeningHistory;
DROP TABLE IF EXISTS UserFollowing;
DROP TABLE IF EXISTS UserFavorites;
DROP TABLE IF EXISTS UserSessions;
DROP TABLE IF EXISTS PlaylistTracks;
DROP TABLE IF EXISTS Playlists;
DROP TABLE IF EXISTS ArtistRequests;
DROP TABLE IF EXISTS Songs;
DROP TABLE IF EXISTS Albums;
DROP TABLE IF EXISTS ArtistProfiles;
DROP TABLE IF EXISTS Genres;
DROP TABLE IF EXISTS Users;
GO

PRINT 'Old tables dropped successfully.';
GO

/*
=========================================================
 Part 2 - Create Tables
=========================================================
*/

/*=========================================================
 USERS
=========================================================*/
CREATE TABLE Users
(
    UserID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_Users PRIMARY KEY
        DEFAULT NEWID(),

    Username NVARCHAR(50) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,

    Role NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Users_Role DEFAULT('user'),

    DisplayName NVARCHAR(100) NOT NULL
        CONSTRAINT DF_Users_DisplayName DEFAULT(''),

    Bio NVARCHAR(2000) NOT NULL
        CONSTRAINT DF_Users_Bio DEFAULT(''),

    AvatarUrl NVARCHAR(500) NOT NULL
        CONSTRAINT DF_Users_Avatar DEFAULT(''),

    SubscriptionTier NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Users_Subscription DEFAULT('Free'),

    IsIncognito BIT NOT NULL
        CONSTRAINT DF_Users_Incognito DEFAULT(0),

    AccountStatus NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Users_Status DEFAULT('Active'),

    IsEmailVerified BIT NOT NULL
        CONSTRAINT DF_Users_Verified DEFAULT(0),

    CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Users_Created DEFAULT(GETUTCDATE()),

    UpdatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Users_Updated DEFAULT(GETUTCDATE())
);
GO


/*=========================================================
 GENRES
=========================================================*/
CREATE TABLE Genres
(
    GenreID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_Genres PRIMARY KEY
        DEFAULT NEWID(),

    Name NVARCHAR(100) NOT NULL,

    Description NVARCHAR(1000) NOT NULL
        CONSTRAINT DF_Genres_Description DEFAULT(''),

    Color NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Genres_Color DEFAULT('#808080'),

    Slug NVARCHAR(100) NOT NULL,

    IconUrl NVARCHAR(500) NULL,

    SongCount INT NOT NULL
        CONSTRAINT DF_Genres_Count DEFAULT(0),

    IsActive BIT NOT NULL
        CONSTRAINT DF_Genres_Active DEFAULT(1),

    DisplayOrder INT NOT NULL
        CONSTRAINT DF_Genres_Order DEFAULT(0),

    CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Genres_Created DEFAULT(GETUTCDATE())
);
GO


/*=========================================================
 ARTIST PROFILES
=========================================================*/
CREATE TABLE ArtistProfiles
(
    ArtistID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_ArtistProfiles PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NOT NULL,

    StageName NVARCHAR(150) NOT NULL,

    Bio NVARCHAR(MAX) NOT NULL
        CONSTRAINT DF_Artist_Bio DEFAULT(''),

    Genre NVARCHAR(100) NOT NULL
        CONSTRAINT DF_Artist_Genre DEFAULT(''),

    Verified BIT NOT NULL
        CONSTRAINT DF_Artist_Verified DEFAULT(0),

    FollowersCount INT NOT NULL
        CONSTRAINT DF_Artist_Followers DEFAULT(0),

    Website NVARCHAR(500) NOT NULL
        CONSTRAINT DF_Artist_Website DEFAULT(''),

    CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Artist_Created DEFAULT(GETUTCDATE())
);
GO

/*=========================================================
 ALBUMS
=========================================================*/
CREATE TABLE Albums
(
    AlbumID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_Albums PRIMARY KEY
        DEFAULT NEWID(),

    ArtistID UNIQUEIDENTIFIER NOT NULL,

    Title NVARCHAR(255) NOT NULL,

    Description NVARCHAR(MAX) NOT NULL
        CONSTRAINT DF_Albums_Description DEFAULT(''),

    CoverArtUrl NVARCHAR(1000) NULL,

    CoverArtData VARBINARY(MAX) NULL,

    IsDeleted BIT NOT NULL
        CONSTRAINT DF_Albums_IsDeleted DEFAULT(0),

    CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Albums_CreatedAt DEFAULT(GETUTCDATE()),

    CONSTRAINT FK_Albums_ArtistProfiles FOREIGN KEY (ArtistID)
        REFERENCES ArtistProfiles (ArtistID) ON DELETE CASCADE
);
GO

/*=========================================================
 ARTIST REQUESTS
=========================================================*/
CREATE TABLE ArtistRequests
(
    RequestID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_ArtistRequests PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NOT NULL,

    StageName NVARCHAR(150) NOT NULL,

    CvFileData VARBINARY(MAX) NULL,

    CvFileName NVARCHAR(255) NOT NULL
        CONSTRAINT DF_Requests_CvFileName DEFAULT(''),

    DemoFileData VARBINARY(MAX) NULL,

    DemoFileName NVARCHAR(255) NOT NULL
        CONSTRAINT DF_Requests_DemoFileName DEFAULT(''),

    Status NVARCHAR(50) NOT NULL
        CONSTRAINT DF_Requests_Status DEFAULT('Pending'),

    AdminNotes NVARCHAR(MAX) NOT NULL
        CONSTRAINT DF_Requests_AdminNotes DEFAULT(''),

    CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Requests_CreatedAt DEFAULT(GETUTCDATE()),

    ResolvedAt DATETIME2 NULL,

    CONSTRAINT FK_ArtistRequests_Users FOREIGN KEY (UserID)
        REFERENCES Users (UserID) ON DELETE CASCADE
);
GO

/*=========================================================
 SONGS (Includes Extended Attributes)
=========================================================*/
CREATE TABLE Songs
(
    SongID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_Songs PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NULL,

    GenreID UNIQUEIDENTIFIER NULL,

    Title NVARCHAR(255) NOT NULL,

    ArtistName NVARCHAR(255) NOT NULL,

    DurationSeconds INT NOT NULL
        CONSTRAINT DF_Songs_Duration DEFAULT(0),

    FilePath NVARCHAR(1000) NOT NULL,

    PlayCount BIGINT NOT NULL
        CONSTRAINT DF_Songs_PlayCount DEFAULT(0),

    IsHidden BIT NOT NULL
        CONSTRAINT DF_Songs_IsHidden DEFAULT(0),

    Source NVARCHAR(50) NOT NULL
        CONSTRAINT DF_Songs_Source DEFAULT('upload'),

    SourceID NVARCHAR(255) NOT NULL
        CONSTRAINT DF_Songs_SourceID DEFAULT(''),

    Album NVARCHAR(255) NOT NULL
        CONSTRAINT DF_Songs_Album DEFAULT(''),

    Uri NVARCHAR(500) NOT NULL
        CONSTRAINT DF_Songs_Uri DEFAULT(''),

    Popularity INT NOT NULL
        CONSTRAINT DF_Songs_Popularity DEFAULT(0),

    Mood NVARCHAR(100) NOT NULL
        CONSTRAINT DF_Songs_Mood DEFAULT(''),

    Tempo FLOAT NOT NULL
        CONSTRAINT DF_Songs_Tempo DEFAULT(0),

    Energy FLOAT NOT NULL
        CONSTRAINT DF_Songs_Energy DEFAULT(0),

    Danceability FLOAT NOT NULL
        CONSTRAINT DF_Songs_Danceability DEFAULT(0),

    Valence FLOAT NOT NULL
        CONSTRAINT DF_Songs_Valence DEFAULT(0),

    Acousticness FLOAT NOT NULL
        CONSTRAINT DF_Songs_Acousticness DEFAULT(0),

    Instrumentalness FLOAT NOT NULL
        CONSTRAINT DF_Songs_Instrumentalness DEFAULT(0),

    [Key] INT NOT NULL
        CONSTRAINT DF_Songs_Key DEFAULT(0),

    [Mode] INT NOT NULL
        CONSTRAINT DF_Songs_Mode DEFAULT(0),

    Tags NVARCHAR(1000) NOT NULL
        CONSTRAINT DF_Songs_Tags DEFAULT(''),

    StorageUrl NVARCHAR(1000) NOT NULL
        CONSTRAINT DF_Songs_Storage DEFAULT(''),

    UploadedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Songs_Uploaded DEFAULT(GETUTCDATE())
);
GO


/*=========================================================
 PLAYLISTS
=========================================================*/
CREATE TABLE Playlists
(
    PlaylistID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_Playlists PRIMARY KEY
        DEFAULT NEWID(),

    OwnerUserID UNIQUEIDENTIFIER NOT NULL,

    Title NVARCHAR(255) NOT NULL,

    IsPublic BIT NOT NULL
        CONSTRAINT DF_Playlists_Public DEFAULT(1)
);
GO


/*=========================================================
 PLAYLIST TRACKS
=========================================================*/
CREATE TABLE PlaylistTracks
(
    MappingID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_PlaylistTracks PRIMARY KEY
        DEFAULT NEWID(),

    PlaylistID UNIQUEIDENTIFIER NOT NULL,

    SongID UNIQUEIDENTIFIER NOT NULL,

    TrackOrder INT NOT NULL
        CONSTRAINT DF_PlaylistTracks_Order DEFAULT(1),

    AddedAt DATETIME2 NOT NULL
        CONSTRAINT DF_PlaylistTracks_Added DEFAULT(GETUTCDATE())
);
GO


/*=========================================================
 USER SESSIONS
=========================================================*/
CREATE TABLE UserSessions
(
    SessionID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_UserSessions PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NOT NULL,

    DeviceName NVARCHAR(255) NOT NULL,

    LastActive DATETIME2 NOT NULL
        CONSTRAINT DF_UserSessions_LastActive DEFAULT(GETUTCDATE()),

    IsRevoked BIT NOT NULL
        CONSTRAINT DF_UserSessions_Revoked DEFAULT(0)
);
GO


/*=========================================================
 USER FAVORITES
=========================================================*/
CREATE TABLE UserFavorites
(
    FavoriteID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_UserFavorites PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NOT NULL,

    SongID UNIQUEIDENTIFIER NOT NULL,

    FavoritedAt DATETIME2 NOT NULL
        CONSTRAINT DF_UserFavorites_Date DEFAULT(GETUTCDATE()),

    Rating INT NOT NULL
        CONSTRAINT DF_UserFavorites_Rating DEFAULT(5),

    Notes NVARCHAR(1000) NULL
);
GO


/*=========================================================
 USER FOLLOWING
=========================================================*/
CREATE TABLE UserFollowing
(
    FollowingID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_UserFollowing PRIMARY KEY
        DEFAULT NEWID(),

    FollowerUserID UNIQUEIDENTIFIER NOT NULL,

    FollowedUserID UNIQUEIDENTIFIER NOT NULL,

    FollowedAt DATETIME2 NOT NULL
        CONSTRAINT DF_UserFollowing_Date DEFAULT(GETUTCDATE()),

    IsMuted BIT NOT NULL
        CONSTRAINT DF_UserFollowing_Muted DEFAULT(0),

    Notes NVARCHAR(1000) NULL
);
GO


/*=========================================================
 USER LISTENING HISTORY
=========================================================*/
CREATE TABLE UserListeningHistory
(
    HistoryID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_UserListeningHistory PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NOT NULL,

    SongID UNIQUEIDENTIFIER NOT NULL,

    PlayedAt DATETIME2 NOT NULL
        CONSTRAINT DF_UserHistory_Played DEFAULT(GETUTCDATE()),

    SecondsListened INT NOT NULL,

    IsSkipped BIT NOT NULL
        CONSTRAINT DF_UserHistory_Skipped DEFAULT(0),

    IsCompleted BIT NOT NULL
        CONSTRAINT DF_UserHistory_Completed DEFAULT(0),

    DeviceType NVARCHAR(100) NULL,

    SessionID NVARCHAR(255) NULL,

    Quality NVARCHAR(50) NULL,

    IsOffline BIT NOT NULL
        CONSTRAINT DF_UserHistory_Offline DEFAULT(0)
);
GO


/*=========================================================
 ARTIST ANALYTICS
=========================================================*/
CREATE TABLE ArtistAnalytics
(
    AnalyticsID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_ArtistAnalytics PRIMARY KEY
        DEFAULT NEWID(),

    ArtistID UNIQUEIDENTIFIER NOT NULL,

    [Date] DATE NOT NULL,

    TotalPlays INT NOT NULL DEFAULT(0),
    UniqueListeners INT NOT NULL DEFAULT(0),
    AverageDurationListened FLOAT NOT NULL DEFAULT(0),
    SkipRate FLOAT NOT NULL DEFAULT(0),
    CompletionRate FLOAT NOT NULL DEFAULT(0),

    NewFollowers INT NOT NULL DEFAULT(0),
    TotalFollowers INT NOT NULL DEFAULT(0),

    NewFavorites INT NOT NULL DEFAULT(0),
    PlaylistAdditions INT NOT NULL DEFAULT(0),

    TopCountry NVARCHAR(100) NULL,
    TopCity NVARCHAR(100) NULL,

    EstimatedRevenue DECIMAL(18,2) NOT NULL DEFAULT(0)
);
GO


/*=========================================================
 ADMIN AUDIT LOGS
=========================================================*/
CREATE TABLE AdminAuditLogs
(
    LogID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_AdminAuditLogs PRIMARY KEY
        DEFAULT NEWID(),

    AdminID UNIQUEIDENTIFIER NOT NULL,

    Action NVARCHAR(100) NOT NULL,

    TargetType NVARCHAR(100) NOT NULL,

    TargetID NVARCHAR(100) NOT NULL,

    Details NVARCHAR(MAX) NOT NULL,

    Timestamp DATETIME2 NOT NULL
        CONSTRAINT DF_AdminAuditLogs_Time DEFAULT(GETUTCDATE())
);
GO


/*=========================================================
 COMMENTS
=========================================================*/
CREATE TABLE Comments
(
    CommentID UNIQUEIDENTIFIER NOT NULL
        CONSTRAINT PK_Comments PRIMARY KEY
        DEFAULT NEWID(),

    UserID UNIQUEIDENTIFIER NOT NULL,

    SongID UNIQUEIDENTIFIER NOT NULL,

    TimestampMS INT NOT NULL DEFAULT(0),

    Content NVARCHAR(2000) NOT NULL,

    CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Comments_Created DEFAULT(GETUTCDATE())
);
GO

PRINT 'All tables created successfully.';
GO

/*
=========================================================
 Part 3 - Foreign Keys, Constraints & Indexes
=========================================================
*/

USE MusicPlayerDb;
GO

/*=========================================================
 USERS
=========================================================*/

ALTER TABLE Users
ADD CONSTRAINT UQ_Users_Username UNIQUE (Username);

ALTER TABLE Users
ADD CONSTRAINT UQ_Users_Email UNIQUE (Email);

GO


/*=========================================================
 GENRES
=========================================================*/

ALTER TABLE Genres
ADD CONSTRAINT UQ_Genres_Name UNIQUE(Name);

ALTER TABLE Genres
ADD CONSTRAINT UQ_Genres_Slug UNIQUE(Slug);

GO


/*=========================================================
 ARTIST PROFILES
=========================================================*/

ALTER TABLE ArtistProfiles
ADD CONSTRAINT UQ_ArtistProfiles_User UNIQUE(UserID);

ALTER TABLE ArtistProfiles
ADD CONSTRAINT FK_ArtistProfiles_User
FOREIGN KEY(UserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO


/*=========================================================
 SONGS
=========================================================*/

ALTER TABLE Songs
ADD CONSTRAINT FK_Songs_User
FOREIGN KEY(UserID)
REFERENCES Users(UserID)
ON DELETE SET NULL;

GO

ALTER TABLE Songs
ADD CONSTRAINT FK_Songs_Genre
FOREIGN KEY(GenreID)
REFERENCES Genres(GenreID)
ON DELETE SET NULL;

GO


/*=========================================================
 PLAYLISTS
=========================================================*/

ALTER TABLE Playlists
ADD CONSTRAINT FK_Playlists_User
FOREIGN KEY(OwnerUserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO


/*=========================================================
 PLAYLIST TRACKS
=========================================================*/

ALTER TABLE PlaylistTracks
ADD CONSTRAINT FK_PlaylistTracks_Playlist
FOREIGN KEY(PlaylistID)
REFERENCES Playlists(PlaylistID)
ON DELETE CASCADE;

GO

-- FIX FOR MSG 1785: Set ON DELETE NO ACTION to prevent multiple cascade paths cycle
ALTER TABLE PlaylistTracks
ADD CONSTRAINT FK_PlaylistTracks_Song
FOREIGN KEY(SongID)
REFERENCES Songs(SongID)
ON DELETE NO ACTION;

GO


/*=========================================================
 USER SESSIONS
=========================================================*/

ALTER TABLE UserSessions
ADD CONSTRAINT FK_UserSessions_User
FOREIGN KEY(UserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO


/*=========================================================
 USER FAVORITES
=========================================================*/

ALTER TABLE UserFavorites
ADD CONSTRAINT FK_UserFavorites_User
FOREIGN KEY(UserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO

-- FIX FOR MSG 1785: Set ON DELETE NO ACTION on second cascade path
ALTER TABLE UserFavorites
ADD CONSTRAINT FK_UserFavorites_Song
FOREIGN KEY(SongID)
REFERENCES Songs(SongID)
ON DELETE NO ACTION;

GO

ALTER TABLE UserFavorites
ADD CONSTRAINT UQ_UserFavorites
UNIQUE(UserID, SongID);

GO

ALTER TABLE UserFavorites
ADD CONSTRAINT CK_UserFavorites_Rating
CHECK(Rating BETWEEN 1 AND 5);

GO

/*=========================================================
 USER FOLLOWING
=========================================================*/

ALTER TABLE UserFollowing
ADD CONSTRAINT FK_UserFollowing_Follower
FOREIGN KEY(FollowerUserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO

-- FIX FOR MSG 1785: Set ON DELETE NO ACTION on second cascade path
ALTER TABLE UserFollowing
ADD CONSTRAINT FK_UserFollowing_Followed
FOREIGN KEY(FollowedUserID)
REFERENCES Users(UserID)
ON DELETE NO ACTION;

GO

ALTER TABLE UserFollowing
ADD CONSTRAINT UQ_UserFollowing
UNIQUE(FollowerUserID, FollowedUserID);

GO


/*=========================================================
 USER LISTENING HISTORY
=========================================================*/

ALTER TABLE UserListeningHistory
ADD CONSTRAINT FK_UserHistory_User
FOREIGN KEY(UserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO

-- FIX FOR MSG 1785: Set ON DELETE NO ACTION on second cascade path
ALTER TABLE UserListeningHistory
ADD CONSTRAINT FK_UserHistory_Song
FOREIGN KEY(SongID)
REFERENCES Songs(SongID)
ON DELETE NO ACTION;

GO


/*=========================================================
 ARTIST ANALYTICS
=========================================================*/

ALTER TABLE ArtistAnalytics
ADD CONSTRAINT FK_ArtistAnalytics_Artist
FOREIGN KEY(ArtistID)
REFERENCES ArtistProfiles(ArtistID)
ON DELETE CASCADE;

GO


/*=========================================================
 ADMIN AUDIT LOGS
=========================================================*/

ALTER TABLE AdminAuditLogs
ADD CONSTRAINT FK_AdminAuditLogs_Admin
FOREIGN KEY(AdminID)
REFERENCES Users(UserID);

GO


/*=========================================================
 COMMENTS
=========================================================*/

ALTER TABLE Comments
ADD CONSTRAINT FK_Comments_User
FOREIGN KEY(UserID)
REFERENCES Users(UserID)
ON DELETE CASCADE;

GO

-- FIX FOR MSG 1785: Set ON DELETE NO ACTION on second cascade path
ALTER TABLE Comments
ADD CONSTRAINT FK_Comments_Song
FOREIGN KEY(SongID)
REFERENCES Songs(SongID)
ON DELETE NO ACTION;

GO


/*=========================================================
 INDEXES
=========================================================*/

CREATE INDEX IX_Songs_Title
ON Songs(Title);

GO

CREATE INDEX IX_Songs_Artist
ON Songs(ArtistName);

GO

CREATE INDEX IX_Songs_Genre
ON Songs(GenreID);

GO

CREATE INDEX IX_Songs_User
ON Songs(UserID);

GO

CREATE INDEX IX_Playlists_User
ON Playlists(OwnerUserID);

GO

CREATE INDEX IX_PlaylistTracks_Playlist
ON PlaylistTracks(PlaylistID);

GO

CREATE INDEX IX_PlaylistTracks_Song
ON PlaylistTracks(SongID);

GO

CREATE INDEX IX_UserHistory_User
ON UserListeningHistory(UserID);

GO

CREATE INDEX IX_UserHistory_Song
ON UserListeningHistory(SongID);

GO

CREATE INDEX IX_UserHistory_PlayedAt
ON UserListeningHistory(PlayedAt);

GO

CREATE INDEX IX_UserFavorites_User
ON UserFavorites(UserID);

GO

CREATE INDEX IX_UserFavorites_Song
ON UserFavorites(SongID);

GO

CREATE INDEX IX_UserFollowing_Follower
ON UserFollowing(FollowerUserID);

GO

CREATE INDEX IX_UserFollowing_Followed
ON UserFollowing(FollowedUserID);

GO

CREATE INDEX IX_AdminAuditLogs_Admin
ON AdminAuditLogs(AdminID);

GO

CREATE INDEX IX_Comments_Song
ON Comments(SongID);

GO

CREATE INDEX IX_Comments_User
ON Comments(UserID);

GO

PRINT 'Foreign keys, constraints and indexes created successfully without errors.';
GO


--- VERSION ---

PRINT 'Foreign keys, constraints and indexes created successfully without errors.';
GO

/*
=========================================================
 Part 4 - Seed Initial Test Accounts & Demo Data
=========================================================
*/

USE MusicPlayerDb;
GO

INSERT INTO Users (UserID, Username, Email, PasswordHash, Role, DisplayName, AccountStatus)
VALUES 
('00000000-0000-0000-0000-000000000001', 'user_test', 'user_test@musicplayer.local', 'User@123', 'user', 'Test User', 'Active'),
('00000000-0000-0000-0000-000000000002', 'artist_test', 'artist_test@musicplayer.local', 'Artist@123', 'artist', 'Test Artist', 'Active'),
('00000000-0000-0000-0000-000000000003', 'admin_test', 'admin_test@musicplayer.local', 'Admin@123', 'admin', 'Test Admin', 'Active');
GO

-- Create Artist Profile for artist_test
INSERT INTO ArtistProfiles (ArtistID, UserID, StageName, Bio, Genre, Verified)
VALUES 
(NEWID(), '00000000-0000-0000-0000-000000000002', 'Test Artist Stage', 'Official demo artist profile', 'Pop / EDM', 1);
GO

PRINT 'Test accounts (user_test, artist_test, admin_test) seeded successfully.';
GO