using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StaffManagementSystem.Migrations
{
    /// <inheritdoc />
    public partial class RefactorEmployeeToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Approvals_Employees_ApplicantId",
                table: "Approvals");

            migrationBuilder.DropForeignKey(
                name: "FK_Approvals_Employees_ApproverId",
                table: "Approvals");

            migrationBuilder.DropForeignKey(
                name: "FK_FileShares_Employees_SharedById",
                table: "FileShares");

            migrationBuilder.DropForeignKey(
                name: "FK_FileShares_Employees_SharedWithId",
                table: "FileShares");

            migrationBuilder.DropForeignKey(
                name: "FK_FileVersions_Employees_UploadedById",
                table: "FileVersions");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Employees_EmployeeId",
                table: "GroupMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_Groups_Employees_CreatorId",
                table: "Groups");

            migrationBuilder.DropForeignKey(
                name: "FK_Payrolls_Employees_EmployeeId",
                table: "Payrolls");

            migrationBuilder.DropForeignKey(
                name: "FK_SharedFiles_Employees_UploaderId",
                table: "SharedFiles");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropColumn(
                name: "CanAccessEmployees",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "CanManageEmployees",
                table: "Users",
                newName: "CanAccessUsers");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "Payrolls",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Payrolls_EmployeeId",
                table: "Payrolls",
                newName: "IX_Payrolls_UserId");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "GroupMembers",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_GroupMembers_GroupId_EmployeeId",
                table: "GroupMembers",
                newName: "IX_GroupMembers_GroupId_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_GroupMembers_EmployeeId",
                table: "GroupMembers",
                newName: "IX_GroupMembers_UserId");

            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Users",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "DepartmentId",
                table: "Users",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "HireDate",
                table: "Users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Users",
                type: "varchar(20)",
                maxLength: 20,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Position",
                table: "Users",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "Salary",
                table: "Users",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Users",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Users_DepartmentId",
                table: "Users",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Approvals_Users_ApplicantId",
                table: "Approvals",
                column: "ApplicantId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Approvals_Users_ApproverId",
                table: "Approvals",
                column: "ApproverId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileShares_Users_SharedById",
                table: "FileShares",
                column: "SharedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileShares_Users_SharedWithId",
                table: "FileShares",
                column: "SharedWithId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileVersions_Users_UploadedById",
                table: "FileVersions",
                column: "UploadedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Groups_Users_CreatorId",
                table: "Groups",
                column: "CreatorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payrolls_Users_UserId",
                table: "Payrolls",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SharedFiles_Users_UploaderId",
                table: "SharedFiles",
                column: "UploaderId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Departments_DepartmentId",
                table: "Users",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Approvals_Users_ApplicantId",
                table: "Approvals");

            migrationBuilder.DropForeignKey(
                name: "FK_Approvals_Users_ApproverId",
                table: "Approvals");

            migrationBuilder.DropForeignKey(
                name: "FK_FileShares_Users_SharedById",
                table: "FileShares");

            migrationBuilder.DropForeignKey(
                name: "FK_FileShares_Users_SharedWithId",
                table: "FileShares");

            migrationBuilder.DropForeignKey(
                name: "FK_FileVersions_Users_UploadedById",
                table: "FileVersions");

            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Users_UserId",
                table: "GroupMembers");

            migrationBuilder.DropForeignKey(
                name: "FK_Groups_Users_CreatorId",
                table: "Groups");

            migrationBuilder.DropForeignKey(
                name: "FK_Payrolls_Users_UserId",
                table: "Payrolls");

            migrationBuilder.DropForeignKey(
                name: "FK_SharedFiles_Users_UploaderId",
                table: "SharedFiles");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Departments_DepartmentId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_DepartmentId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Address",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HireDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Salary",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Users");

            migrationBuilder.RenameColumn(
                name: "CanAccessUsers",
                table: "Users",
                newName: "CanManageEmployees");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Payrolls",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_Payrolls_UserId",
                table: "Payrolls",
                newName: "IX_Payrolls_EmployeeId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "GroupMembers",
                newName: "EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_GroupMembers_UserId",
                table: "GroupMembers",
                newName: "IX_GroupMembers_EmployeeId");

            migrationBuilder.RenameIndex(
                name: "IX_GroupMembers_GroupId_UserId",
                table: "GroupMembers",
                newName: "IX_GroupMembers_GroupId_EmployeeId");

            migrationBuilder.AddColumn<bool>(
                name: "CanAccessEmployees",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DepartmentId = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Email = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HireDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Position = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProfileImagePath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProfileImageUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Salary = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThumbnailImagePath = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ThumbnailImageUrl = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Employees_Departments_DepartmentId",
                        column: x => x.DepartmentId,
                        principalTable: "Departments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Employees_DepartmentId",
                table: "Employees",
                column: "DepartmentId");

            migrationBuilder.AddForeignKey(
                name: "FK_Approvals_Employees_ApplicantId",
                table: "Approvals",
                column: "ApplicantId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Approvals_Employees_ApproverId",
                table: "Approvals",
                column: "ApproverId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileShares_Employees_SharedById",
                table: "FileShares",
                column: "SharedById",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileShares_Employees_SharedWithId",
                table: "FileShares",
                column: "SharedWithId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileVersions_Employees_UploadedById",
                table: "FileVersions",
                column: "UploadedById",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Employees_EmployeeId",
                table: "GroupMembers",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Groups_Employees_CreatorId",
                table: "Groups",
                column: "CreatorId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Payrolls_Employees_EmployeeId",
                table: "Payrolls",
                column: "EmployeeId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SharedFiles_Employees_UploaderId",
                table: "SharedFiles",
                column: "UploaderId",
                principalTable: "Employees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
