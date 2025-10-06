using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StaffManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class AddPageAccessPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanAccessApprovals",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanAccessEmployees",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanAccessOrganization",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanAccessPayroll",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanAccessPermissions",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanManageApprovals",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanManageEmployees",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanManageOrganization",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CanManagePayroll",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanAccessApprovals",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanAccessEmployees",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanAccessOrganization",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanAccessPayroll",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanAccessPermissions",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanManageApprovals",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanManageEmployees",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanManageOrganization",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CanManagePayroll",
                table: "Users");
        }
    }
}
