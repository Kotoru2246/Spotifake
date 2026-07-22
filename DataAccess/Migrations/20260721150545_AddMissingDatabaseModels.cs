using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingDatabaseModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GenreID",
                table: "Songs",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ArtistAnalytics",
                columns: table => new
                {
                    AnalyticsID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ArtistID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalPlays = table.Column<int>(type: "int", nullable: false),
                    UniqueListeners = table.Column<int>(type: "int", nullable: false),
                    AverageDurationListened = table.Column<double>(type: "float", nullable: false),
                    SkipRate = table.Column<double>(type: "float", nullable: false),
                    CompletionRate = table.Column<double>(type: "float", nullable: false),
                    NewFollowers = table.Column<int>(type: "int", nullable: false),
                    TotalFollowers = table.Column<int>(type: "int", nullable: false),
                    NewFavorites = table.Column<int>(type: "int", nullable: false),
                    PlaylistAdditions = table.Column<int>(type: "int", nullable: false),
                    TopCountry = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TopCity = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EstimatedRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArtistAnalytics", x => x.AnalyticsID);
                    table.ForeignKey(
                        name: "FK_ArtistAnalytics_ArtistProfiles_ArtistID",
                        column: x => x.ArtistID,
                        principalTable: "ArtistProfiles",
                        principalColumn: "ArtistID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    GenreID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IconUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SongCount = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.GenreID);
                });

            migrationBuilder.CreateTable(
                name: "UserFavorites",
                columns: table => new
                {
                    FavoriteID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SongID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FavoritedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavorites", x => x.FavoriteID);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Songs_SongID",
                        column: x => x.SongID,
                        principalTable: "Songs",
                        principalColumn: "SongID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserFavorites_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserFollowings",
                columns: table => new
                {
                    FollowingID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FollowerUserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FollowedUserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FollowedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsMuted = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFollowings", x => x.FollowingID);
                    table.ForeignKey(
                        name: "FK_UserFollowings_Users_FollowedUserID",
                        column: x => x.FollowedUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserFollowings_Users_FollowerUserID",
                        column: x => x.FollowerUserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserListeningHistories",
                columns: table => new
                {
                    HistoryID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SongID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlayedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SecondsListened = table.Column<int>(type: "int", nullable: false),
                    IsSkipped = table.Column<bool>(type: "bit", nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    DeviceType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SessionID = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Quality = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsOffline = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserListeningHistories", x => x.HistoryID);
                    table.ForeignKey(
                        name: "FK_UserListeningHistories_Songs_SongID",
                        column: x => x.SongID,
                        principalTable: "Songs",
                        principalColumn: "SongID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserListeningHistories_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Songs_GenreID",
                table: "Songs",
                column: "GenreID");

            migrationBuilder.CreateIndex(
                name: "IX_ArtistAnalytics_ArtistID_Date",
                table: "ArtistAnalytics",
                columns: new[] { "ArtistID", "Date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ArtistAnalytics_Date",
                table: "ArtistAnalytics",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_Genres_Slug",
                table: "Genres",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_SongID",
                table: "UserFavorites",
                column: "SongID");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavorites_UserID_SongID",
                table: "UserFavorites",
                columns: new[] { "UserID", "SongID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserFollowings_FollowedUserID",
                table: "UserFollowings",
                column: "FollowedUserID");

            migrationBuilder.CreateIndex(
                name: "IX_UserFollowings_FollowerUserID_FollowedUserID",
                table: "UserFollowings",
                columns: new[] { "FollowerUserID", "FollowedUserID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserListeningHistories_SongID_PlayedAt",
                table: "UserListeningHistories",
                columns: new[] { "SongID", "PlayedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_UserListeningHistories_UserID_PlayedAt",
                table: "UserListeningHistories",
                columns: new[] { "UserID", "PlayedAt" },
                descending: new[] { false, true });

            migrationBuilder.AddForeignKey(
                name: "FK_Songs_Genres_GenreID",
                table: "Songs",
                column: "GenreID",
                principalTable: "Genres",
                principalColumn: "GenreID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Songs_Genres_GenreID",
                table: "Songs");

            migrationBuilder.DropTable(
                name: "ArtistAnalytics");

            migrationBuilder.DropTable(
                name: "Genres");

            migrationBuilder.DropTable(
                name: "UserFavorites");

            migrationBuilder.DropTable(
                name: "UserFollowings");

            migrationBuilder.DropTable(
                name: "UserListeningHistories");

            migrationBuilder.DropIndex(
                name: "IX_Songs_GenreID",
                table: "Songs");

            migrationBuilder.DropColumn(
                name: "GenreID",
                table: "Songs");
        }
    }
}
