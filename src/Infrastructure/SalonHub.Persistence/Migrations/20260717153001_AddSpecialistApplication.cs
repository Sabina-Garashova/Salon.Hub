using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSpecialistApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SpecialistApplications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ApplicantUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SalonId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    YearsOfExperience = table.Column<int>(type: "int", nullable: false),
                    ExpectedSalaryMin = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ExpectedSalaryMax = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecialistApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpecialistApplications_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SpecialistApplications_Salons_SalonId",
                        column: x => x.SalonId,
                        principalTable: "Salons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SpecialistApplicationImages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SpecialistApplicationId = table.Column<int>(type: "int", nullable: false),
                    ImageUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpecialistApplicationImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpecialistApplicationImages_SpecialistApplications_SpecialistApplicationId",
                        column: x => x.SpecialistApplicationId,
                        principalTable: "SpecialistApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SpecialistApplicationImages_SpecialistApplicationId",
                table: "SpecialistApplicationImages",
                column: "SpecialistApplicationId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecialistApplications_BranchId",
                table: "SpecialistApplications",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_SpecialistApplications_SalonId",
                table: "SpecialistApplications",
                column: "SalonId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SpecialistApplicationImages");

            migrationBuilder.DropTable(
                name: "SpecialistApplications");
        }
    }
}
