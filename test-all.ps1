# Staff Management System - Test Runner Script

Write-Host "🧪 Running Staff Management System Tests" -ForegroundColor Green
Write-Host "========================================"

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "dotnet")) {
    Write-Host "❌ .NET SDK is not installed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites found" -ForegroundColor Green

# Run Frontend Tests
Write-Host "`n🎨 Running Frontend Tests..." -ForegroundColor Yellow
Set-Location "staffmanagementsystem"

Write-Host "Installing dependencies..." -ForegroundColor Gray
npm install --silent

Write-Host "Running tests..." -ForegroundColor Gray
$frontendResult = npm run test:ci 2>&1
$frontendExitCode = $LASTEXITCODE

if ($frontendExitCode -eq 0) {
    Write-Host "✅ Frontend tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend tests failed" -ForegroundColor Red
    Write-Host $frontendResult -ForegroundColor Gray
}

Set-Location ".."

# Run Backend Tests
Write-Host "`n🏗️ Running Backend Tests..." -ForegroundColor Yellow
Set-Location "StaffManagementSystem-backend/StaffManagementSystem.Tests"

Write-Host "Restoring packages..." -ForegroundColor Gray
dotnet restore --verbosity quiet

Write-Host "Running tests..." -ForegroundColor Gray
$backendResult = dotnet test --verbosity normal --logger trx 2>&1
$backendExitCode = $LASTEXITCODE

if ($backendExitCode -eq 0) {
    Write-Host "✅ Backend tests passed" -ForegroundColor Green
} else {
    Write-Host "❌ Backend tests failed" -ForegroundColor Red
    Write-Host $backendResult -ForegroundColor Gray
}

Set-Location "../.."

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "==============="

if ($frontendExitCode -eq 0) {
    Write-Host "Frontend: ✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "Frontend: ❌ FAILED" -ForegroundColor Red
}

if ($backendExitCode -eq 0) {
    Write-Host "Backend:  ✅ PASSED" -ForegroundColor Green
} else {
    Write-Host "Backend:  ❌ FAILED" -ForegroundColor Red
}

$overallResult = $frontendExitCode + $backendExitCode
if ($overallResult -eq 0) {
    Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n💥 Some tests failed!" -ForegroundColor Red
    exit 1
}