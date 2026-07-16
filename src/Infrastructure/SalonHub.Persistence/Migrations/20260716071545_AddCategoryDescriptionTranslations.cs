using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryDescriptionTranslations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Categories",
                newName: "DescriptionRu");

            migrationBuilder.AddColumn<string>(
                name: "DescriptionAz",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Categories",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DescriptionAz",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Categories");

            migrationBuilder.RenameColumn(
                name: "DescriptionRu",
                table: "Categories",
                newName: "Description");
        }
    }
}
