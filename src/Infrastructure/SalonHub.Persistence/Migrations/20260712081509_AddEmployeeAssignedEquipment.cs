using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeAssignedEquipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoyaltyAccounts_Salons_SalonId",
                table: "LoyaltyAccounts");

            migrationBuilder.AddColumn<int>(
                name: "AssignedEquipmentId",
                table: "Employees",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_AssignedEquipmentId",
                table: "Employees",
                column: "AssignedEquipmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Equipments_AssignedEquipmentId",
                table: "Employees",
                column: "AssignedEquipmentId",
                principalTable: "Equipments",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_LoyaltyAccounts_Salons_SalonId",
                table: "LoyaltyAccounts",
                column: "SalonId",
                principalTable: "Salons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Equipments_AssignedEquipmentId",
                table: "Employees");

            migrationBuilder.DropForeignKey(
                name: "FK_LoyaltyAccounts_Salons_SalonId",
                table: "LoyaltyAccounts");

            migrationBuilder.DropIndex(
                name: "IX_Employees_AssignedEquipmentId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "AssignedEquipmentId",
                table: "Employees");

            migrationBuilder.AddForeignKey(
                name: "FK_LoyaltyAccounts_Salons_SalonId",
                table: "LoyaltyAccounts",
                column: "SalonId",
                principalTable: "Salons",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
