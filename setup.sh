#!/bin/bash

# Student Review App - Quick Setup Script
# This script helps you set up the development environment quickly

set -e  # Exit on error

echo "=================================="
echo "Student Review App - Setup Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version) found${NC}"

# Check if Python is installed
echo -e "${YELLOW}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.9+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python $(python3 --version) found${NC}"

echo ""
echo "=================================="
echo "Setting up Frontend"
echo "=================================="

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
npm install

# Create frontend .env file
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✓ .env.local created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env.local with your actual values${NC}"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

echo ""
echo "=================================="
echo "Setting up Backend"
echo "=================================="

cd backend

# Create Python virtual environment
echo -e "${YELLOW}Creating Python virtual environment...${NC}"
python3 -m venv venv
echo -e "${GREEN}✓ Virtual environment created${NC}"

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source venv/bin/activate || . venv/Scripts/activate

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
pip install -r requirements.txt

# Create backend .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ backend/.env created${NC}"
    echo -e "${YELLOW}⚠ Please edit backend/.env with your actual values${NC}"
else
    echo -e "${GREEN}✓ backend/.env already exists${NC}"
fi

# Create uploads directory
mkdir -p uploads
echo -e "${GREEN}✓ Uploads directory created${NC}"

cd ..

echo ""
echo "=================================="
echo "Setup Complete! 🎉"
echo "=================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your environment variables:"
echo "   - Edit .env.local (frontend)"
echo "   - Edit backend/.env (backend)"
echo ""
echo "2. Set up Supabase:"
echo "   - Follow instructions in SUPABASE_SETUP.md"
echo ""
echo "3. Configure Google OAuth:"
echo "   - Create OAuth credentials in Google Cloud Console"
echo "   - Add client ID to .env.local and backend/.env"
echo ""
echo "4. Set up Azure OpenAI:"
echo "   - Add endpoint and API key to backend/.env"
echo ""
echo "5. Start the development servers:"
echo ""
echo "   Terminal 1 (Frontend):"
echo "   $ npm start"
echo ""
echo "   Terminal 2 (Backend):"
echo "   $ cd backend"
echo "   $ source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "   $ python main.py"
echo ""
echo "For detailed instructions, see README.md"
echo ""
