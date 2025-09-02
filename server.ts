import app from './backend/hono';
import { networkInterfaces } from 'os';

const port = process.env.PORT || 3000;

// Get local IP address
function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

console.log('🚀 Server starting...');
console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
console.log(`🔧 Environment: ${process.env.APP_ENV || 'development'}`);
console.log(`🔧 Supabase URL: ${process.env.SUPABASE_URL ? 'configured' : 'missing'}`);
console.log(`🔧 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'missing'}`);

Bun.serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: '0.0.0.0', // Listen on all interfaces
});

console.log(`✅ Server is running on:`);
console.log(`   📱 For mobile/Expo: http://${localIP}:${port}`);
console.log(`   💻 For localhost: http://localhost:${port}`);
console.log(`✅ API endpoints available at http://${localIP}:${port}/api/`);
console.log(`✅ Try the signup endpoint: http://${localIP}:${port}/api/auth/signup`);
console.log(`\n🔧 Update your .env file with: EXPO_PUBLIC_RORK_API_BASE_URL=http://${localIP}:${port}`);