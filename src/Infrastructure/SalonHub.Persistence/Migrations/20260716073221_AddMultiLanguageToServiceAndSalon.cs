using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiLanguageToServiceAndSalon : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Salons");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Tags",
                newName: "NameAz");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Services",
                newName: "NameAz");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Services",
                newName: "NameRu");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Salons",
                newName: "NameAz");

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Tags",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameRu",
                table: "Tags",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionAz",
                table: "Services",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Services",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionRu",
                table: "Services",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Services",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionAz",
                table: "Salons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionEn",
                table: "Salons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionRu",
                table: "Salons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameEn",
                table: "Salons",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NameRu",
                table: "Salons",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "NameRu",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "DescriptionAz",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "DescriptionRu",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "DescriptionAz",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "DescriptionEn",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "DescriptionRu",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "NameEn",
                table: "Salons");

            migrationBuilder.DropColumn(
                name: "NameRu",
                table: "Salons");

            migrationBuilder.RenameColumn(
                name: "NameAz",
                table: "Tags",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "NameRu",
                table: "Services",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "NameAz",
                table: "Services",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "NameAz",
                table: "Salons",
                newName: "Name");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Salons",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
