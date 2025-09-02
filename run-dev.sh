#!/bin/bash

# Kill any existing processes
echo "🔄 Stopping existing servers..."
pkill -f "server.ts" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*8081" 2>/dev/null || true

# Clear caches
echo "🧹 Clearing caches..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Wait a moment
sleep 2

# Start backend server in background
echo "🚀 Starting backend server..."
bun run server.ts &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Start frontend
echo "🚀 Starting frontend..."
bun expo start --tunnel --clear

# Cleanup function
cleanup() {
    echo "\n🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    pkill -f "server.ts" 2>/dev/null || true
    pkill -f "expo start" 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT