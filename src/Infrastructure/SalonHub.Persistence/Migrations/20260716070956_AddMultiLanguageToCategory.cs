using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiLanguageToCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Categories",
                newName: "NameAz");

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameRu",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "NameRu",
                table: "Categories");

            migrationBuilder.RenameColumn(
                name: "NameAz",
                table: "Categories",
                newName: "Name");
        }
    }
}
