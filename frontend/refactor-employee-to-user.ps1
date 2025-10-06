# PowerShell script to refactor Employee to User in frontend
# Run this from the frontend directory

$replacements = @(
    @{ Pattern = '/Employee'; Replacement = '/User' }
    @{ Pattern = 'EmployeeForm'; Replacement = 'UserForm' }
    @{ Pattern = 'EmployeesPage'; Replacement = 'UsersPage' }
    @{ Pattern = 'employeeService'; Replacement = 'userService' }
    @{ Pattern = 'useEmployeeData'; Replacement = 'useUserData' }
    @{ Pattern = '\bEmployee\b'; Replacement = 'User' }
    @{ Pattern = '\bemployee\b'; Replacement = 'user' }
    @{ Pattern = '\bemployees\b'; Replacement = 'users' }
    @{ Pattern = '\bEmployees\b'; Replacement = 'Users' }
)

# Get all TypeScript and TSX files
$files = Get-ChildItem -Path "src" -Include *.ts,*.tsx -Recurse -File

$modifiedFiles = @()

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content

    # Apply all replacements
    foreach ($replacement in $replacements) {
        $content = $content -replace $replacement.Pattern, $replacement.Replacement
    }

    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $modifiedFiles += $file.FullName
        Write-Host "Modified: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nTotal files modified: $($modifiedFiles.Count)" -ForegroundColor Cyan

# Now rename files
Write-Host "`nRenaming files..." -ForegroundColor Yellow

# Rename EmployeeForm.tsx to UserForm.tsx
if (Test-Path "src\components\forms\EmployeeForm.tsx") {
    Rename-Item -Path "src\components\forms\EmployeeForm.tsx" -NewName "UserForm.tsx"
    Write-Host "Renamed: EmployeeForm.tsx -> UserForm.tsx" -ForegroundColor Green
}

# Rename EmployeesPage.tsx to UsersPage.tsx
if (Test-Path "src\components\pages\EmployeesPage.tsx") {
    Rename-Item -Path "src\components\pages\EmployeesPage.tsx" -NewName "UsersPage.tsx"
    Write-Host "Renamed: EmployeesPage.tsx -> UsersPage.tsx" -ForegroundColor Green
}

# Rename employeeService.ts to userService.ts
if (Test-Path "src\services\employeeService.ts") {
    Rename-Item -Path "src\services\employeeService.ts" -NewName "userService.ts"
    Write-Host "Renamed: employeeService.ts -> userService.ts" -ForegroundColor Green
}

# Rename useEmployeeData.ts to useUserData.ts (already exists, so skip)
# The useUserData.ts already exists for auth users, we'll merge them

Write-Host "`nFrontend refactoring complete!" -ForegroundColor Cyan
Write-Host "Note: You may need to manually merge useEmployeeData.ts into useUserData.ts" -ForegroundColor Yellow
