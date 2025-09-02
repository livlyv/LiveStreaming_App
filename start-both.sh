#!/bin/bash

echo "🚀 Starting backend server..."
bun run start-backend.ts &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "📱 Starting frontend server..."
bunx rork start -p bo44fwxvov01657rf6ttq --tunnel &
FRONTEND_PID=$!

echo "✅ Both servers are starting..."
echo "📡 Backend PID: $BACKEND_PID"
echo "📱 Frontend PID: $FRONTEND_PID"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID