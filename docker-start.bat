@echo off
echo 🐳 启动员工管理系统 Docker 容器
echo ===============================

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker 未安装或未运行
    echo 请安装 Docker Desktop 并确保其正在运行
    pause
    exit /b 1
)

echo ✅ Docker 已安装

REM 检查 docker-compose 是否可用
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose 不可用
    echo 请确保 Docker Desktop 包含 Docker Compose
    pause
    exit /b 1
)

echo ✅ Docker Compose 可用

REM 停止并删除现有容器
echo.
echo 🧹 清理现有容器...
docker compose down

REM 构建并启动服务
echo.
echo 🏗️ 构建并启动服务...
docker compose up --build -d

REM 检查服务状态
echo.
echo 📊 检查服务状态...
timeout /t 10 /nobreak >nul

docker compose ps

echo.
echo 🎉 部署完成！
echo.
echo 📱 访问地址:
echo    前端: http://localhost
echo    后端 API: http://localhost:5000
echo    数据库: localhost:3306
echo.
echo 💡 有用的命令:
echo    查看日志: docker compose logs -f
echo    停止服务: docker compose down
echo    重启服务: docker compose restart
echo.

pause