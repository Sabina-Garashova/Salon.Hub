using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiLanguageToNewsArticle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Title",
                table: "NewsArticles",
                newName: "TitleAz");

            migrationBuilder.RenameColumn(
                name: "Content",
                table: "NewsArticles",
                newName: "ContentAz");

            migrationBuilder.AddColumn<string>(
                name: "ContentEn",
                table: "NewsArticles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentRu",
                table: "NewsArticles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleEn",
                table: "NewsArticles",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleRu",
                table: "NewsArticles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentEn",
                table: "NewsArticles");

            migrationBuilder.DropColumn(
                name: "ContentRu",
                table: "NewsArticles");

            migrationBuilder.DropColumn(
                name: "TitleEn",
                table: "NewsArticles");

            migrationBuilder.DropColumn(
                name: "TitleRu",
                table: "NewsArticles");

            migrationBuilder.RenameColumn(
                name: "TitleAz",
                table: "NewsArticles",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "ContentAz",
                table: "NewsArticles",
                newName: "Content");
        }
    }
}
