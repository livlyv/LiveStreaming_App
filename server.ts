// Load environment variables first
import { config } from 'dotenv';
config();

import app from './backend/hono';
import { networkInterfaces } from 'os';

const port = process.env.PORT || 3000;
const localIP = getLocalIP();
//const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
const isProduction = process.env.APP_ENV === 'production';
const baseUrl = isProduction ? baseUrl : `http://${localIP}:${port}`;


// Get local IP address (only for development)
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


const serverUrl = isProduction ? baseUrl : `http://${localIP}:${port}`;

console.log('🔧 Supabase Environment Check:');
console.log('🔧 SUPABASE_URL:', process.env.SUPABASE_URL ? 'configured' : 'missing');
console.log('🔧 SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing');
console.log('🔧 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing');
console.log('🚀 Server starting...');
console.log(`📚 API Documentation: ${serverUrl}/api/docs`);
console.log(`🏥 Health Check: ${serverUrl}/api/health`);
console.log(`🔧 Environment: ${process.env.APP_ENV || 'development'}`);
console.log(`🔧 Base URL: ${baseUrl}`);
console.log(`🔧 Supabase URL: ${process.env.SUPABASE_URL ? 'configured' : 'missing'}`);
console.log(`🔧 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'missing'}`);

Bun.serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: '0.0.0.0', // Listen on all interfaces
});

if (isProduction) {
  console.log(`✅ Server is running in PRODUCTION mode:`);
  console.log(`   🌐 Production URL: ${baseUrl}`);
  console.log(`   📱 API endpoints: ${baseUrl}/api/`);
  console.log(`   ✅ Try the signup endpoint: ${baseUrl}/api/auth/signup`);
  console.log(`\n🔧 Frontend should use: EXPO_PUBLIC_RORK_API_BASE_URL=${baseUrl}`);
} else {
  console.log(`✅ Server is running in DEVELOPMENT mode:`);
  console.log(`   📱 For mobile/Expo: http://${localIP}:${port}`);
  console.log(`   💻 For localhost: http://localhost:${port}`);
  console.log(`   ✅ API endpoints available at http://${localIP}:${port}/api/`);
  console.log(`   ✅ Try the signup endpoint: http://${localIP}:${port}/api/auth/signup`);
  console.log(`\n🔧 Update your .env file with: EXPO_PUBLIC_RORK_API_BASE_URL=http://${localIP}:${port}`);
}