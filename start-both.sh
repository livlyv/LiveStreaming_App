#!/bin/bash

# Kill any existing processes on ports 3000 and 8081
echo "🔄 Stopping existing servers..."
kill -9 $(lsof -ti:3000) 2>/dev/null || true
kill -9 $(lsof -ti:8081) 2>/dev/null || true

# Clear Expo cache
echo "🧹 Clearing Expo cache..."
bun expo r -c 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# Wait a moment
sleep 2

# Start backend server in background
echo "🚀 Starting backend server..."
bun run server.ts &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend with cache cleared
echo "🚀 Starting frontend (cache cleared)..."
bun expo start --tunnel --clear

# Cleanup function
cleanup() {
    echo "\n🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill -9 $(lsof -ti:3000) 2>/dev/null || true
    kill -9 $(lsof -ti:8081) 2>/dev/null || true
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT