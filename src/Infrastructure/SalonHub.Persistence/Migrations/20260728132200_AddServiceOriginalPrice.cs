using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceOriginalPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "OriginalPrice",
                table: "Services",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OriginalPrice",
                table: "Services");
        }
    }
}
