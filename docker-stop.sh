#!/bin/bash

echo "🛑 Stopping Staff Management System Docker Containers"
echo "===================================================="

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Stop all services
echo "Stopping services..."
docker compose down

# Show status
echo ""
echo -e "${BLUE}📊 Current status:${NC}"
docker compose ps

echo ""
echo -e "${GREEN}✅ All services have been stopped${NC}"