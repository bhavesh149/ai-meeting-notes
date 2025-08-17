#!/bin/bash

# AI Meeting Notes - Production Startup Script
# This script ensures proper environment loading and starts the application with PM2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting AI Meeting Notes Backend...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found. Please create the .env file with required environment variables.${NC}"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Dist directory not found. Building the project...${NC}"
    npm run build
fi

# Stop any existing PM2 processes
echo -e "${YELLOW}🛑 Stopping existing PM2 processes...${NC}"
pm2 delete ai-meeting-notes 2>/dev/null || echo "No existing process to stop"

# Start the application with PM2
echo -e "${GREEN}▶️  Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Save PM2 configuration
echo -e "${GREEN}💾 Saving PM2 configuration...${NC}"
pm2 save

# Show status
echo -e "${GREEN}📊 Application Status:${NC}"
pm2 status

echo -e "${GREEN}✅ AI Meeting Notes Backend started successfully!${NC}"
echo -e "${YELLOW}📝 Use 'pm2 logs ai-meeting-notes' to view logs${NC}"
echo -e "${YELLOW}📝 Use 'pm2 monit' to monitor the application${NC}"
