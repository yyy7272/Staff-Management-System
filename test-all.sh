#!/bin/bash

# Staff Management System - Test Runner Script

echo "🧪 Running Staff Management System Tests"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n📋 ${YELLOW}Checking Prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

if ! command_exists dotnet; then
    echo -e "${RED}❌ .NET SDK is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Run Frontend Tests
echo -e "\n🎨 ${YELLOW}Running Frontend Tests...${NC}"
cd staffmanagementsystem

echo -e "${GRAY}Installing dependencies...${NC}"
npm install --silent

echo -e "${GRAY}Running tests...${NC}"
npm run test:ci
FRONTEND_EXIT_CODE=$?

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
fi

cd ..

# Run Backend Tests
echo -e "\n🏗️ ${YELLOW}Running Backend Tests...${NC}"
cd StaffManagementSystem-backend/StaffManagementSystem.Tests

echo -e "${GRAY}Restoring packages...${NC}"
dotnet restore --verbosity quiet

echo -e "${GRAY}Running tests...${NC}"
dotnet test --verbosity normal --logger trx
BACKEND_EXIT_CODE=$?

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Backend tests passed${NC}"
else
    echo -e "${RED}❌ Backend tests failed${NC}"
fi

cd ../..

# Summary
echo -e "\n📊 ${CYAN}Test Summary${NC}"
echo "==============="

if [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "Frontend: ${GREEN}✅ PASSED${NC}"
else
    echo -e "Frontend: ${RED}❌ FAILED${NC}"
fi

if [ $BACKEND_EXIT_CODE -eq 0 ]; then
    echo -e "Backend:  ${GREEN}✅ PASSED${NC}"
else
    echo -e "Backend:  ${RED}❌ FAILED${NC}"
fi

OVERALL_RESULT=$((FRONTEND_EXIT_CODE + BACKEND_EXIT_CODE))
if [ $OVERALL_RESULT -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n💥 ${RED}Some tests failed!${NC}"
    exit 1
fi