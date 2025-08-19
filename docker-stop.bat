@echo off
echo 🛑 停止员工管理系统 Docker 容器
echo ==============================

REM 停止所有服务
echo 停止服务...
docker compose down

REM 显示状态
echo.
echo 📊 当前状态:
docker compose ps

echo.
echo ✅ 所有服务已停止

pause