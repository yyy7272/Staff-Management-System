@echo off
echo 🛑 Stopping Staff Management System Docker Containers
echo ====================================================

REM Stop all services
echo Stopping services...
docker compose down

REM Show status
echo.
echo 📊 Current status:
docker compose ps

echo.
echo ✅ All services have been stopped

pause