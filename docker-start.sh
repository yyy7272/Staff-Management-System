#!/bin/bash

echo "🐳 Starting Staff Management System Docker Containers"
echo "===================================================="

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker and ensure it's running"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    echo "Please ensure Docker Compose is installed"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose is available${NC}"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running${NC}"
    echo "Please start Docker service"
    exit 1
fi

echo -e "${GREEN}✅ Docker daemon is running${NC}"

# Stop and remove existing containers
echo ""
echo -e "${YELLOW}🧹 Cleaning up existing containers...${NC}"
docker compose down

# Build and start services
echo ""
echo -e "${YELLOW}🏗️ Building and starting services...${NC}"
docker compose up --build -d

# Wait for services to start
echo ""
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${BLUE}📊 Checking service status...${NC}"
docker compose ps

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${BLUE}📱 Access URLs:${NC}"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:5000"
echo "   Database: localhost:3306"
echo ""
echo -e "${BLUE}💡 Useful commands:${NC}"
echo "   View logs: docker compose logs -f"
echo "   Stop services: docker compose down"
echo "   Restart services: docker compose restart"
echo ""

# Wait for user input (optional)
read -p "Press Enter to view real-time logs, or Ctrl+C to exit..."
docker compose logs -f