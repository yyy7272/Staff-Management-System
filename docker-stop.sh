#!/bin/bash

echo "🛑 停止员工管理系统 Docker 容器"
echo "=============================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 停止所有服务
echo "停止服务..."
docker compose down

# 显示状态
echo ""
echo -e "${BLUE}📊 当前状态:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}✅ 所有服务已停止${NC}"