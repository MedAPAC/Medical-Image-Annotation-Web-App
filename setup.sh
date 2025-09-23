#!/bin/bash

# Medical Image Annotation Web App - Setup Script
# ===============================================

echo "Medical Image Annotation Web App Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "   Node.js is not installed. Please install Node.js first:"
    echo "   Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
    echo "   macOS: brew install node"
    echo "   Windows: Download from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm first."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "MongoDB is not running. Starting MongoDB..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start mongodb
    elif command -v brew &> /dev/null; then
        brew services start mongodb-community
    else
        echo "Please start MongoDB manually before running this script."
        exit 1
    fi
fi

echo "Prerequisites check passed"

# Install server dependencies
echo "Installing server dependencies..."
cd server

if [ ! -f package.json ]; then
    echo "package.json not found in server directory"
    exit 1
fi

echo "Installing server dependencies from package.json..."
npm install

# If npm install fails or doesn't install all dependencies, install them manually
if [ $? -ne 0 ] || [ ! -d "node_modules/mongodb" ] || [ ! -d "node_modules/bcrypt" ] || [ ! -d "node_modules/jsonwebtoken" ]; then
    echo "Some dependencies missing, installing manually..."
    echo "Installing mongodb..."
    npm install mongodb
    echo "Installing bcrypt..."
    npm install bcrypt
    echo "Installing jsonwebtoken..."
    npm install jsonwebtoken
    echo "Installing other dependencies..."
    npm install cors express multer i18next i18next-express-middleware i18next-fs-backend
    
    if [ $? -ne 0 ]; then
        echo "Failed to install server dependencies manually"
        exit 1
    fi
fi

echo "Server dependencies installed successfully"
cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client

if [ ! -f package.json ]; then
    echo "package.json not found in client directory"
    exit 1
fi

echo "Installing client dependencies from package.json..."
npm install --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo "Failed to install client dependencies"
    exit 1
fi

echo "Client dependencies installed successfully"
cd ..

echo ""
echo "All dependencies installed successfully!"
echo ""
echo "   To start the application:"
echo "   1. Terminal 1: cd client && npm start"
echo "   2. Terminal 2: cd server && node index.js"
echo "   3. Open browser: http://localhost:3000"
echo ""