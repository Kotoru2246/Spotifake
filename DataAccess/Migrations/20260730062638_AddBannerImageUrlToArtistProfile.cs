using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddBannerImageUrlToArtistProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPremium",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Nationality",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "PremiumExpiresAt",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Acousticness",
                table: "Songs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AlbumID",
                table: "Songs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollabArtists",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "CoverArtData",
                table: "Songs",
                type: "varbinary(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverArtUrl",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Credits",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Danceability",
                table: "Songs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Energy",
                table: "Songs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<byte[]>(
                name: "FileData",
                table: "Songs",
                type: "varbinary(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Instrumentalness",
                table: "Songs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Songs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Key",
                table: "Songs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Lyrics",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Mode",
                table: "Songs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Mood",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Popularity",
                table: "Songs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReleaseDate",
                table: "Songs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StorageUrl",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Songs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Tempo",
                table: "Songs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UploadedAt",
                table: "Songs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Valence",
                table: "Songs",
                type: "float",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Playlists",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Playlists",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BannerImageUrl",
                table: "ArtistProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "ArtistProfiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ArtistProfiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Nationality",
                table: "ArtistProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "ArtistProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ArtistProfiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Albums",
                columns: table => new
                {
                    AlbumID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtistID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CoverArtUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CoverArtData = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Albums", x => x.AlbumID);
                    table.ForeignKey(
                        name: "FK_Albums_ArtistProfiles_ArtistID",
                        column: x => x.ArtistID,
                        principalTable: "ArtistProfiles",
                        principalColumn: "ArtistID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArtistRequests",
                columns: table => new
                {
                    RequestID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StageName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CvFileData = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    CvFileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DemoFileData = table.Column<byte[]>(type: "varbinary(max)", nullable: true),
                    DemoFileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AdminNotes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResolvedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArtistRequests", x => x.RequestID);
                    table.ForeignKey(
                        name: "FK_ArtistRequests_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserSavedPlaylists",
                columns: table => new
                {
                    SavedID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlaylistID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSavedPlaylists", x => x.SavedID);
                    table.ForeignKey(
                        name: "FK_UserSavedPlaylists_Playlists_PlaylistID",
                        column: x => x.PlaylistID,
                        principalTable: "Playlists",
                        principalColumn: "PlaylistID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSavedPlaylists_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserSavedAlbums",
                columns: table => new
                {
                    SavedID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AlbumID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SavedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSavedAlbums", x => x.SavedID);
                    table.ForeignKey(
                        name: "FK_UserSavedAlbums_Albums_AlbumID",
                        column: x => x.AlbumID,
                        principalTable: "Albums",
                        principalColumn: "AlbumID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSavedAlbums_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Songs_AlbumID",
                table: "Songs",
                column: "AlbumID");

            migrationBuilder.CreateIndex(
                name: "IX_Albums_ArtistID",
                table: "Albums",
                column: "ArtistID");

            migrationBuilder.CreateIndex(
                name: "IX_ArtistRequests_UserID",
                table: "ArtistRequests",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_UserSavedAlbums_AlbumID",
                table: "UserSavedAlbums",
                column: "AlbumID");

            migrationBuilder.CreateIndex(
                name: "IX_UserSavedAlbums_UserID_AlbumID",
                table: "UserSavedAlbums",
                columns: new[] { "UserID", "AlbumID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSavedPlaylists_PlaylistID",
                table: "UserSavedPlaylists",
                column: "PlaylistID");

            migrationBuilder.CreateIndex(
                name: "IX_UserSavedPlaylists_UserID_PlaylistID",
                table: "UserSavedPlaylists",
                columns: new[] { "UserID", "PlaylistID" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Songs_Albums_AlbumID",
                table: "Songs",
                column: "AlbumID",
                principalTable: "Albums",
                principalColumn: "AlbumID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Songs_Albums_AlbumID",
                table: "Songs");

            migrationBuilder.DropTable(
                name: "ArtistRequests");

            migrationBuilder.DropTable(
                name: "UserSavedAlbums");

            migrationBuilder.DropTable(
                name: "UserSavedPlaylists");

            migrationBuilder.DropTable(
                name: "Albums");

            migrationBuilder.DropIndex(
                name: "IX_Songs_AlbumID",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsPremium",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Nationality",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PremiumExpiresAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Acousticness",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "AlbumID",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "CollabArtists",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "CoverArtData",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "CoverArtUrl",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Credits",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Danceability",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Energy",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "FileData",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Instrumentalness",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Key",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Lyrics",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Mode",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Mood",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Popularity",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "ReleaseDate",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "StorageUrl",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Tempo",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "UploadedAt",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "Valence",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Playlists");

            migrationBuilder.DropColumn(
                name: "BannerImageUrl",
                table: "ArtistProfiles");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "ArtistProfiles");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ArtistProfiles");

            migrationBuilder.DropColumn(
                name: "Nationality",
                table: "ArtistProfiles");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "ArtistProfiles");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ArtistProfiles");
        }
    }
}
