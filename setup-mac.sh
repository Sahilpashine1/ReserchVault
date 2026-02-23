#!/bin/bash

# 🍎 macOS Setup Script for Faculty Publications Management System
# This script will guide you through installing all required software

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   Faculty Publications Management System - macOS Setup        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "🔍 Checking installed software..."
echo ""

# Check Homebrew
if command_exists brew; then
    echo -e "${GREEN}✅ Homebrew is installed${NC}"
    brew --version
else
    echo -e "${RED}❌ Homebrew is NOT installed${NC}"
    echo ""
    echo "📝 To install Homebrew, run this command in Terminal:"
    echo ""
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "After installation, run this script again!"
    exit 1
fi

echo ""

# Check Node.js
if command_exists node; then
    echo -e "${GREEN}✅ Node.js is installed${NC}"
    node --version
else
    echo -e "${YELLOW}⚠️  Node.js is NOT installed${NC}"
    echo "📦 Installing Node.js..."
    brew install node
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Node.js installed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to install Node.js${NC}"
        exit 1
    fi
fi

echo ""

# Check npm
if command_exists npm; then
    echo -e "${GREEN}✅ npm is installed${NC}"
    npm --version
else
    echo -e "${RED}❌ npm is NOT installed${NC}"
    exit 1
fi

echo ""

# Check MongoDB
if command_exists mongod; then
    echo -e "${GREEN}✅ MongoDB is installed${NC}"
    mongod --version | head -n 1
else
    echo -e "${YELLOW}⚠️  MongoDB is NOT installed${NC}"
    echo "📦 Installing MongoDB..."
    
    # Tap MongoDB repository
    brew tap mongodb/brew
    
    # Install MongoDB Community Edition
    brew install mongodb-community
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MongoDB installed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to install MongoDB${NC}"
        exit 1
    fi
fi

echo ""

# Check if MongoDB service is running
echo "🔍 Checking MongoDB service status..."
if brew services list | grep -q "mongodb-community.*started"; then
    echo -e "${GREEN}✅ MongoDB service is running${NC}"
else
    echo -e "${YELLOW}⚠️  MongoDB service is NOT running${NC}"
    echo "🚀 Starting MongoDB service..."
    brew services start mongodb-community
    sleep 2
    if brew services list | grep -q "mongodb-community.*started"; then
        echo -e "${GREEN}✅ MongoDB service started successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to start MongoDB service${NC}"
        exit 1
    fi
fi

echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$(dirname "$0")/backend" || exit 1

if [ -f "package.json" ]; then
    echo "Running npm install..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend dependencies installed successfully!${NC}"
    else
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ package.json not found in backend folder${NC}"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 SETUP COMPLETE! 🎉                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "✅ All software installed and configured!"
echo ""
echo "🚀 To start your application:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "🌐 Then open in browser:"
echo "   http://localhost:5000"
echo ""
echo "📖 For more information, see:"
echo "   - MACOS_INSTALLATION_GUIDE.md (detailed guide)"
echo "   - QUICK_START.md (how to use the app)"
echo "   - README.md (full documentation)"
echo ""
