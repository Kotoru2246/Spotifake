-- Dashboard Overhaul: Add new columns to existing tables
-- Run against MusicPlayerDb

-- === Users table: Add profile fields, soft-delete, premium ===
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DateOfBirth')
    ALTER TABLE Users ADD DateOfBirth datetime2 NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Nationality')
    ALTER TABLE Users ADD Nationality nvarchar(max) NOT NULL DEFAULT '';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Gender')
    ALTER TABLE Users ADD Gender nvarchar(max) NOT NULL DEFAULT '';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsDeleted')
    ALTER TABLE Users ADD IsDeleted bit NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsPremium')
    ALTER TABLE Users ADD IsPremium bit NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PremiumExpiresAt')
    ALTER TABLE Users ADD PremiumExpiresAt datetime2 NULL;

-- === ArtistProfiles table: Add DOB, Nationality, IsDeleted, ProfileImageUrl ===
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ArtistProfiles') AND name = 'DateOfBirth')
    ALTER TABLE ArtistProfiles ADD DateOfBirth datetime2 NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ArtistProfiles') AND name = 'Nationality')
    ALTER TABLE ArtistProfiles ADD Nationality nvarchar(max) NOT NULL DEFAULT '';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ArtistProfiles') AND name = 'IsDeleted')
    ALTER TABLE ArtistProfiles ADD IsDeleted bit NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('ArtistProfiles') AND name = 'ProfileImageUrl')
    ALTER TABLE ArtistProfiles ADD ProfileImageUrl nvarchar(max) NOT NULL DEFAULT '';

-- === Songs table: Add IsDeleted ===
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Songs') AND name = 'IsDeleted')
    ALTER TABLE Songs ADD IsDeleted bit NOT NULL DEFAULT 0;

-- === Albums table: Add IsDeleted, Description ===
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Albums') AND name = 'IsDeleted')
    ALTER TABLE Albums ADD IsDeleted bit NOT NULL DEFAULT 0;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Albums') AND name = 'Description')
    ALTER TABLE Albums ADD Description nvarchar(max) NOT NULL DEFAULT '';

-- === Create ArtistRequests table ===
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ArtistRequests')
BEGIN
    CREATE TABLE ArtistRequests (
        RequestID uniqueidentifier NOT NULL PRIMARY KEY DEFAULT NEWID(),
        UserID uniqueidentifier NOT NULL,
        StageName nvarchar(max) NOT NULL DEFAULT '',
        CvFileData varbinary(max) NULL,
        CvFileName nvarchar(max) NOT NULL DEFAULT '',
        DemoFileData varbinary(max) NULL,
        DemoFileName nvarchar(max) NOT NULL DEFAULT '',
        Status nvarchar(max) NOT NULL DEFAULT 'Pending',
        AdminNotes nvarchar(max) NOT NULL DEFAULT '',
        CreatedAt datetime2 NOT NULL DEFAULT GETUTCDATE(),
        ResolvedAt datetime2 NULL,
        CONSTRAINT FK_ArtistRequests_Users FOREIGN KEY (UserID) REFERENCES Users(UserID)
    );
END

PRINT 'Dashboard Overhaul migration completed successfully!';
