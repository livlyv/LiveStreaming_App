import app from './backend/hono';

const port = process.env.PORT || 3000;

console.log('🚀 Server starting...');
console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
console.log(`🏥 Health Check: http://localhost:${port}/api/health`);
console.log(`🔧 Environment: ${process.env.APP_ENV || 'development'}`);
console.log(`🔧 Supabase URL: ${process.env.SUPABASE_URL ? 'configured' : 'missing'}`);
console.log(`🔧 JWT Secret: ${process.env.JWT_SECRET ? 'configured' : 'missing'}`);

Bun.serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`✅ Server is running on http://localhost:${port}`);
console.log(`✅ API endpoints available at http://localhost:${port}/api/`);
console.log(`✅ Try the signup endpoint: http://localhost:${port}/api/auth/signup`);