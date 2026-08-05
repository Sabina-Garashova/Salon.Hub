using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonHub.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class FixServiceNameDiacritics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Mövcud xidmət adlarındakı diakritiksiz (ç, ş, ö, ğ, ü, ı, ə hərfləri düşmüş) yazılışları düzəldir.
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Saç stilisti' WHERE [NameAz] = N'Sac stilisti';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Saç boyama' WHERE [NameAz] = N'Sac boyama';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Saç kəsimi' WHERE [NameAz] = N'Sac kesimi';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Saqqal düzəltmə' WHERE [NameAz] = N'Saqal duzeltme';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Manikür' WHERE [NameAz] = N'Manikur';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Pedikür' WHERE [NameAz] = N'Pedikur';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Sac stilisti' WHERE [NameAz] = N'Saç stilisti';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Sac boyama' WHERE [NameAz] = N'Saç boyama';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Sac kesimi' WHERE [NameAz] = N'Saç kəsimi';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Saqal duzeltme' WHERE [NameAz] = N'Saqqal düzəltmə';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Manikur' WHERE [NameAz] = N'Manikür';");
            migrationBuilder.Sql("UPDATE [Services] SET [NameAz] = N'Pedikur' WHERE [NameAz] = N'Pedikür';");
        }
    }
}
