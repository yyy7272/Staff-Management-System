#!/bin/bash

echo "🐳 启动员工管理系统 Docker 容器"
echo "==============================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo "请安装 Docker 并确保其正在运行"
    exit 1
fi

echo -e "${GREEN}✅ Docker 已安装${NC}"

# 检查 docker compose 是否可用
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 不可用${NC}"
    echo "请确保安装了 Docker Compose"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose 可用${NC}"

# 检查 Docker 守护进程是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 守护进程未运行${NC}"
    echo "请启动 Docker 服务"
    exit 1
fi

echo -e "${GREEN}✅ Docker 守护进程正在运行${NC}"

# 停止并删除现有容器
echo ""
echo -e "${YELLOW}🧹 清理现有容器...${NC}"
docker compose down

# 构建并启动服务
echo ""
echo -e "${YELLOW}🏗️ 构建并启动服务...${NC}"
docker compose up --build -d

# 等待服务启动
echo ""
echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
sleep 10

# 检查服务状态
echo ""
echo -e "${BLUE}📊 检查服务状态...${NC}"
docker compose ps

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo -e "${BLUE}📱 访问地址:${NC}"
echo "   前端: http://localhost"
echo "   后端 API: http://localhost:5000"
echo "   数据库: localhost:3306"
echo ""
echo -e "${BLUE}💡 有用的命令:${NC}"
echo "   查看日志: docker compose logs -f"
echo "   停止服务: docker compose down"
echo "   重启服务: docker compose restart"
echo ""

# 等待用户按键（可选）
read -p "按 Enter 键查看实时日志，或 Ctrl+C 退出..."
docker compose logs -f