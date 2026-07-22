IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [Users] (
    [UserID] uniqueidentifier NOT NULL,
    [Username] nvarchar(450) NOT NULL,
    [Email] nvarchar(450) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Role] nvarchar(max) NOT NULL,
    [DisplayName] nvarchar(max) NOT NULL,
    [Bio] nvarchar(max) NOT NULL,
    [AvatarUrl] nvarchar(max) NOT NULL,
    [SubscriptionTier] nvarchar(max) NOT NULL,
    [IsIncognito] bit NOT NULL,
    [AccountStatus] nvarchar(max) NOT NULL,
    [IsEmailVerified] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([UserID])
);
GO

CREATE TABLE [AdminAuditLogs] (
    [LogID] uniqueidentifier NOT NULL,
    [AdminID] uniqueidentifier NOT NULL,
    [Action] nvarchar(max) NOT NULL,
    [TargetType] nvarchar(max) NOT NULL,
    [TargetID] nvarchar(max) NOT NULL,
    [Details] nvarchar(max) NOT NULL,
    [Timestamp] datetime2 NOT NULL,
    CONSTRAINT [PK_AdminAuditLogs] PRIMARY KEY ([LogID]),
    CONSTRAINT [FK_AdminAuditLogs_Users_AdminID] FOREIGN KEY ([AdminID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE TABLE [ArtistProfiles] (
    [ArtistID] uniqueidentifier NOT NULL,
    [UserID] uniqueidentifier NOT NULL,
    [StageName] nvarchar(max) NOT NULL,
    [Bio] nvarchar(max) NOT NULL,
    [Genre] nvarchar(max) NOT NULL,
    [Verified] bit NOT NULL,
    [FollowersCount] int NOT NULL,
    [Website] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_ArtistProfiles] PRIMARY KEY ([ArtistID]),
    CONSTRAINT [FK_ArtistProfiles_Users_UserID] FOREIGN KEY ([UserID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE TABLE [Playlists] (
    [PlaylistID] uniqueidentifier NOT NULL,
    [OwnerUserID] uniqueidentifier NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [IsPublic] bit NOT NULL,
    CONSTRAINT [PK_Playlists] PRIMARY KEY ([PlaylistID]),
    CONSTRAINT [FK_Playlists_Users_OwnerUserID] FOREIGN KEY ([OwnerUserID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE TABLE [Songs] (
    [SongID] uniqueidentifier NOT NULL,
    [UserID] uniqueidentifier NULL,
    [Title] nvarchar(max) NOT NULL,
    [ArtistName] nvarchar(max) NOT NULL,
    [DurationSeconds] int NOT NULL,
    [FilePath] nvarchar(max) NOT NULL,
    [PlayCount] bigint NOT NULL,
    [IsHidden] bit NOT NULL,
    CONSTRAINT [PK_Songs] PRIMARY KEY ([SongID]),
    CONSTRAINT [FK_Songs_Users_UserID] FOREIGN KEY ([UserID]) REFERENCES [Users] ([UserID]) ON DELETE SET NULL
);
GO

CREATE TABLE [UserSessions] (
    [SessionID] uniqueidentifier NOT NULL,
    [UserID] uniqueidentifier NOT NULL,
    [DeviceName] nvarchar(max) NOT NULL,
    [LastActive] datetime2 NOT NULL,
    [IsRevoked] bit NOT NULL,
    CONSTRAINT [PK_UserSessions] PRIMARY KEY ([SessionID]),
    CONSTRAINT [FK_UserSessions_Users_UserID] FOREIGN KEY ([UserID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE TABLE [PlaylistTracks] (
    [MappingID] uniqueidentifier NOT NULL,
    [PlaylistID] uniqueidentifier NOT NULL,
    [SongID] uniqueidentifier NOT NULL,
    [TrackOrder] int NOT NULL,
    [AddedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_PlaylistTracks] PRIMARY KEY ([MappingID]),
    CONSTRAINT [FK_PlaylistTracks_Playlists_PlaylistID] FOREIGN KEY ([PlaylistID]) REFERENCES [Playlists] ([PlaylistID]) ON DELETE CASCADE,
    CONSTRAINT [FK_PlaylistTracks_Songs_SongID] FOREIGN KEY ([SongID]) REFERENCES [Songs] ([SongID]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_AdminAuditLogs_AdminID] ON [AdminAuditLogs] ([AdminID]);
GO

CREATE UNIQUE INDEX [IX_ArtistProfiles_UserID] ON [ArtistProfiles] ([UserID]);
GO

CREATE INDEX [IX_Playlists_OwnerUserID] ON [Playlists] ([OwnerUserID]);
GO

CREATE INDEX [IX_PlaylistTracks_PlaylistID] ON [PlaylistTracks] ([PlaylistID]);
GO

CREATE INDEX [IX_PlaylistTracks_SongID] ON [PlaylistTracks] ([SongID]);
GO

CREATE INDEX [IX_Songs_UserID] ON [Songs] ([UserID]);
GO

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
GO

CREATE INDEX [IX_UserSessions_UserID] ON [UserSessions] ([UserID]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260721074039_InitialCreate', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260721083536_TenThayDoi', N'8.0.0');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Songs] ADD [GenreID] uniqueidentifier NULL;
GO

CREATE TABLE [ArtistAnalytics] (
    [AnalyticsID] uniqueidentifier NOT NULL,
    [ArtistID] uniqueidentifier NOT NULL,
    [Date] datetime2 NOT NULL,
    [TotalPlays] int NOT NULL,
    [UniqueListeners] int NOT NULL,
    [AverageDurationListened] float NOT NULL,
    [SkipRate] float NOT NULL,
    [CompletionRate] float NOT NULL,
    [NewFollowers] int NOT NULL,
    [TotalFollowers] int NOT NULL,
    [NewFavorites] int NOT NULL,
    [PlaylistAdditions] int NOT NULL,
    [TopCountry] nvarchar(max) NULL,
    [TopCity] nvarchar(max) NULL,
    [EstimatedRevenue] decimal(18,2) NOT NULL,
    CONSTRAINT [PK_ArtistAnalytics] PRIMARY KEY ([AnalyticsID]),
    CONSTRAINT [FK_ArtistAnalytics_ArtistProfiles_ArtistID] FOREIGN KEY ([ArtistID]) REFERENCES [ArtistProfiles] ([ArtistID]) ON DELETE CASCADE
);
GO

CREATE TABLE [Genres] (
    [GenreID] uniqueidentifier NOT NULL,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Color] nvarchar(max) NOT NULL,
    [Slug] nvarchar(450) NOT NULL,
    [IconUrl] nvarchar(max) NULL,
    [SongCount] int NOT NULL,
    [IsActive] bit NOT NULL,
    [DisplayOrder] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Genres] PRIMARY KEY ([GenreID])
);
GO

CREATE TABLE [UserFavorites] (
    [FavoriteID] uniqueidentifier NOT NULL,
    [UserID] uniqueidentifier NOT NULL,
    [SongID] uniqueidentifier NOT NULL,
    [FavoritedAt] datetime2 NOT NULL,
    [Rating] int NOT NULL,
    [Notes] nvarchar(max) NULL,
    CONSTRAINT [PK_UserFavorites] PRIMARY KEY ([FavoriteID]),
    CONSTRAINT [FK_UserFavorites_Songs_SongID] FOREIGN KEY ([SongID]) REFERENCES [Songs] ([SongID]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserFavorites_Users_UserID] FOREIGN KEY ([UserID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE TABLE [UserFollowings] (
    [FollowingID] uniqueidentifier NOT NULL,
    [FollowerUserID] uniqueidentifier NOT NULL,
    [FollowedUserID] uniqueidentifier NOT NULL,
    [FollowedAt] datetime2 NOT NULL,
    [IsMuted] bit NOT NULL,
    [Notes] nvarchar(max) NULL,
    CONSTRAINT [PK_UserFollowings] PRIMARY KEY ([FollowingID]),
    CONSTRAINT [FK_UserFollowings_Users_FollowedUserID] FOREIGN KEY ([FollowedUserID]) REFERENCES [Users] ([UserID]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UserFollowings_Users_FollowerUserID] FOREIGN KEY ([FollowerUserID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE TABLE [UserListeningHistories] (
    [HistoryID] uniqueidentifier NOT NULL,
    [UserID] uniqueidentifier NOT NULL,
    [SongID] uniqueidentifier NOT NULL,
    [PlayedAt] datetime2 NOT NULL,
    [SecondsListened] int NOT NULL,
    [IsSkipped] bit NOT NULL,
    [IsCompleted] bit NOT NULL,
    [DeviceType] nvarchar(max) NULL,
    [SessionID] nvarchar(max) NULL,
    [Quality] nvarchar(max) NULL,
    [IsOffline] bit NOT NULL,
    CONSTRAINT [PK_UserListeningHistories] PRIMARY KEY ([HistoryID]),
    CONSTRAINT [FK_UserListeningHistories_Songs_SongID] FOREIGN KEY ([SongID]) REFERENCES [Songs] ([SongID]) ON DELETE CASCADE,
    CONSTRAINT [FK_UserListeningHistories_Users_UserID] FOREIGN KEY ([UserID]) REFERENCES [Users] ([UserID]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_Songs_GenreID] ON [Songs] ([GenreID]);
GO

CREATE UNIQUE INDEX [IX_ArtistAnalytics_ArtistID_Date] ON [ArtistAnalytics] ([ArtistID], [Date]);
GO

CREATE INDEX [IX_ArtistAnalytics_Date] ON [ArtistAnalytics] ([Date]);
GO

CREATE UNIQUE INDEX [IX_Genres_Slug] ON [Genres] ([Slug]);
GO

CREATE INDEX [IX_UserFavorites_SongID] ON [UserFavorites] ([SongID]);
GO

CREATE UNIQUE INDEX [IX_UserFavorites_UserID_SongID] ON [UserFavorites] ([UserID], [SongID]);
GO

CREATE INDEX [IX_UserFollowings_FollowedUserID] ON [UserFollowings] ([FollowedUserID]);
GO

CREATE UNIQUE INDEX [IX_UserFollowings_FollowerUserID_FollowedUserID] ON [UserFollowings] ([FollowerUserID], [FollowedUserID]);
GO

CREATE INDEX [IX_UserListeningHistories_SongID_PlayedAt] ON [UserListeningHistories] ([SongID], [PlayedAt]);
GO

CREATE INDEX [IX_UserListeningHistories_UserID_PlayedAt] ON [UserListeningHistories] ([UserID], [PlayedAt] DESC);
GO

ALTER TABLE [Songs] ADD CONSTRAINT [FK_Songs_Genres_GenreID] FOREIGN KEY ([GenreID]) REFERENCES [Genres] ([GenreID]) ON DELETE SET NULL;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260721150545_AddMissingDatabaseModels', N'8.0.0');
GO

COMMIT;
GO

