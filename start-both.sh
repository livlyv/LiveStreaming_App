#!/bin/bash

# Kill any existing processes (without lsof)
echo "🔄 Stopping existing servers..."
pkill -f "server.ts" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true

# Clear all caches more thoroughly
echo "🧹 Clearing all caches..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

# Show current environment variables
echo "🔧 Current environment variables:"
echo "EXPO_PUBLIC_RORK_API_BASE_URL: $EXPO_PUBLIC_RORK_API_BASE_URL"
echo "BASE_URL: $BASE_URL"

# Wait a moment
sleep 3

# Start backend server in background
echo "🚀 Starting backend server..."
bun run server.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 8

# Load environment variables and start frontend
echo "🚀 Starting frontend (cache cleared)..."
export $(cat .env | grep -v '^#' | xargs)
echo "🔧 Loaded environment variables:"
echo "EXPO_PUBLIC_RORK_API_BASE_URL: $EXPO_PUBLIC_RORK_API_BASE_URL"
bun expo start --tunnel --clear

# Cleanup function
cleanup() {
    echo "\n🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    pkill -f "server.ts" 2>/dev/null || true
    pkill -f "expo start" 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    pkill -f "node.*8081" 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT