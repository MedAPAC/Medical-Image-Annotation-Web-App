#!/bin/bash

set -e

APP_NAME="Medical Image Annotation Web App"
MIN_NODE_MAJOR=18

echo "$APP_NAME Setup"
echo "=========================================="

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_section() {
    echo ""
    echo "$1"
    echo "------------------------------------------"
}

print_section "Checking prerequisites"

if ! command_exists node; then
    echo "Node.js is not installed."
    echo "Install Node.js $MIN_NODE_MAJOR or newer from https://nodejs.org/"
    exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt "$MIN_NODE_MAJOR" ]; then
    echo "Node.js $(node --version) detected."
    echo "Node.js $MIN_NODE_MAJOR or newer is recommended because the backend uses built-in fetch."
    exit 1
fi

if ! command_exists npm; then
    echo "npm is not installed. Install npm with Node.js."
    exit 1
fi

echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

if command_exists mongod; then
    echo "MongoDB binary found."
else
    echo "MongoDB binary was not found in PATH."
    echo "Install MongoDB Community Server or make sure your MongoDB service is available."
fi

if command_exists pgrep && ! pgrep -x "mongod" >/dev/null 2>&1; then
    echo "MongoDB does not appear to be running."
    if command_exists systemctl; then
        echo "Attempting to start MongoDB with systemctl..."
        sudo systemctl start mongodb || sudo systemctl start mongod || true
    elif command_exists brew; then
        echo "Attempting to start MongoDB with Homebrew..."
        brew services start mongodb-community || true
    else
        echo "Please start MongoDB manually before using the app."
    fi
fi

print_section "Preparing folders"
mkdir -p docs/media/screenshots
mkdir -p docs/media/gifs
mkdir -p server/uploads
mkdir -p uploads

print_section "Installing backend dependencies"
cd server
if [ ! -f package.json ]; then
    echo "server/package.json not found."
    exit 1
fi
npm install
cd ..

print_section "Installing frontend dependencies"
cd client
if [ ! -f package.json ]; then
    echo "client/package.json not found."
    exit 1
fi
npm install --legacy-peer-deps
cd ..

print_section "Optional Google Drive backup"
echo "Google Drive backup/export-sync is optional."
echo "MongoDB remains the live database."
echo ""
echo "To enable Google Drive backup, configure these backend environment variables:"
echo "  GOOGLE_CLIENT_ID=your-google-oauth-client-id"
echo "  GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret"
echo "  GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/google-drive/callback"
echo ""
echo "Also enable Google Drive API and add the redirect URI in Google Cloud Console."

print_section "Setup complete"
echo "Start the backend:"
echo "  cd server && npm start"
echo ""
echo "Start the frontend in another terminal:"
echo "  cd client && npm start"
echo ""
echo "Open:"
echo "  http://localhost:3000"
echo ""
echo "Documentation screenshots:"
echo "  docs/media/screenshots/"
echo "Documentation GIFs:"
echo "  docs/media/gifs/"
