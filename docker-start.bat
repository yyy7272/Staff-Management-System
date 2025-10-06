@echo off
echo 🐳 Starting Staff Management System Docker Containers
echo ====================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and ensure it's running
    pause
    exit /b 1
)

echo ✅ Docker is installed

REM Check if docker-compose is available
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please ensure Docker Desktop includes Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker Compose is available

REM Stop and remove existing containers
echo.
echo 🧹 Cleaning up existing containers...
docker compose down

REM Build and start services
echo.
echo 🏗️ Building and starting services...
docker compose up --build -d

REM Check service status
echo.
echo 📊 Checking service status...
timeout /t 10 /nobreak >nul

docker compose ps

echo.
echo 🎉 Deployment complete!
echo.
echo 📱 Access URLs:
echo    Frontend: http://localhost
echo    Backend API: http://localhost:5000
echo    Database: localhost:3306
echo.
echo 💡 Useful commands:
echo    View logs: docker compose logs -f
echo    Stop services: docker compose down
echo    Restart services: docker compose restart
echo.

pause