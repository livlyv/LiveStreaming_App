#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting development servers...\n');

// Start backend server
console.log('📡 Starting backend server...');
const backend = spawn('bun', ['run', 'server.ts'], {
  stdio: 'inherit',
  env: { ...process.env }
});

backend.on('error', (err) => {
  console.error('❌ Backend error:', err);
});

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('\n📱 Starting frontend server...');
  const frontend = spawn('bunx', ['rork', 'start', '-p', 'bo44fwxvov01657rf6ttq', '--tunnel'], {
    stdio: 'inherit',
    env: { ...process.env }
  });

  frontend.on('error', (err) => {
    console.error('❌ Frontend error:', err);
  });
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  process.exit(0);
});