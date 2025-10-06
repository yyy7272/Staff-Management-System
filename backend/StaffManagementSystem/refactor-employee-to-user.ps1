# PowerShell script to refactor Employee to User across the project

Write-Host "Starting Employee -> User refactoring..." -ForegroundColor Green

# Define file patterns to process
$filesToProcess = @(
    "Controllers/*.cs",
    "Services/*.cs",
    "DataTransferObj/*.cs",
    "Models/*.cs"
)

# Define replacement mappings (order matters - most specific first)
$replacements = @(
    @{ Pattern = 'CanAccessEmployees'; Replacement = 'CanAccessUsers' }
    @{ Pattern = 'CanManageEmployees'; Replacement = 'CanManageUsers' }
    @{ Pattern = '\bEmployeeId\b'; Replacement = 'UserId' }
    @{ Pattern = '\bEmployeeName\b'; Replacement = 'UserName' }
    @{ Pattern = '\bEmployeeEmail\b'; Replacement = 'UserEmail' }
    @{ Pattern = '\bEmployeePosition\b'; Replacement = 'UserPosition' }
    @{ Pattern = '\bEmployeeAvatar\b'; Replacement = 'UserAvatar' }
    @{ Pattern = '\bemployeeId\b'; Replacement = 'userId' }
    @{ Pattern = '\bEmployees\b'; Replacement = 'Users' }
    @{ Pattern = '\bEmployee\b'; Replacement = 'User' }
    @{ Pattern = '\bemployees\b'; Replacement = 'users' }
    @{ Pattern = '\bemployee\b'; Replacement = 'user' }
)

$totalFiles = 0
$modifiedFiles = 0

foreach ($pattern in $filesToProcess) {
    $files = Get-ChildItem -Path $pattern -Recurse -ErrorAction SilentlyContinue

    foreach ($file in $files) {
        $totalFiles++
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        $originalContent = $content

        # Apply all replacements
        foreach ($replacement in $replacements) {
            $content = $content -replace $replacement.Pattern, $replacement.Replacement
        }

        # Only write if content changed
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Modified: $($file.Name)" -ForegroundColor Yellow
            $modifiedFiles++
        }
    }
}

Write-Host "`nRefactoring complete!" -ForegroundColor Green
Write-Host "Total files processed: $totalFiles" -ForegroundColor Cyan
Write-Host "Files modified: $modifiedFiles" -ForegroundColor Cyan

# Rename EmployeeController to UserController
if (Test-Path "Controllers/EmployeeController.cs") {
    Rename-Item -Path "Controllers/EmployeeController.cs" -NewName "UserController.cs" -Force
    Write-Host "`nRenamed EmployeeController.cs to UserController.cs" -ForegroundColor Green

    # Update class name in the renamed file
    $userControllerPath = "Controllers/UserController.cs"
    $content = Get-Content $userControllerPath -Raw -Encoding UTF8
    $content = $content -replace 'public class EmployeeController', 'public class UserController'
    $content = $content -replace 'EmployeeController\(', 'UserController('
    Set-Content -Path $userControllerPath -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated UserController class names" -ForegroundColor Yellow
}

Write-Host "`nDone! Please review changes and test compilation." -ForegroundColor Green
