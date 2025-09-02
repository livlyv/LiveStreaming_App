import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import auth from "./routes/auth";
import meta, { buildOpenAPI, buildPostmanCollection } from "./routes/meta";
import users from "./routes/users";
import streaming from "./routes/streaming";
import media from "./routes/media";
import notifications from "./routes/notifications";
import payments from "./routes/payments";
import analytics from "./routes/analytics";
import kyc from "./routes/kyc";

const app = new Hono();

// Add request logging middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  console.log(`🌐 ${c.req.method} ${c.req.url}`);
  console.log(`📍 Headers:`, Object.fromEntries(c.req.raw.headers.entries()));
  
  await next();
  
  const end = Date.now();
  console.log(`✅ ${c.req.method} ${c.req.url} - ${end - start}ms`);
});

app.use("*", cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add /api prefix to all routes
const api = new Hono();

api.route("/auth", auth);
api.route("/meta", meta);
api.route("/users", users);
api.route("/streaming", streaming);
api.route("/media", media);
api.route("/notifications", notifications);
api.route("/payments", payments);
api.route("/analytics", analytics);
api.route("/kyc", kyc);

api.get("/openapi.json", (c) => c.json(buildOpenAPI()));
api.get("/postman.json", (c) => c.json(buildPostmanCollection()));

api.get("/docs", (c) => {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>API Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
      <style>body { margin: 0; } #swagger-ui { max-width: 100%; }</style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
      <script>
        window.ui = SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
        });
      </script>
    </body>
  </html>`;
  return c.html(html);
});

api.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

api.get("/", (c) => {
  console.log('🚀 API Root endpoint called');
  console.log('🔍 Request headers:', Object.fromEntries(c.req.raw.headers.entries()));
  console.log('🔍 Request URL:', c.req.url);
  return c.json({ 
    status: "ok", 
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENV || 'unknown',
    url: c.req.url,
    method: c.req.method
  });
});

// Test endpoint for debugging
api.get("/test", (c) => {
  console.log('🧪 Test endpoint called');
  return c.json({ 
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(c.req.raw.headers.entries())
  });
});

// Health check endpoint
api.get("/health", (c) => {
  console.log('🏥 Health check endpoint called');
  return c.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    supabase: {
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      anon_key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
    },
    jwt_secret: process.env.JWT_SECRET ? 'configured' : 'missing',
    cors_origins: ['http://localhost:3000', 'https://dev-bo44fwxvov01657rf6ttq.rorktest.dev', 'http://localhost:8081', 'exp://192.168.1.100:8081', 'exp://localhost:8081']
  });
});

// Simple ping endpoint for connectivity testing
api.get("/ping", (c) => {
  console.log('🏓 Ping endpoint called');
  console.log('🏓 Request from:', c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown');
  console.log('🏓 User-Agent:', c.req.header('user-agent') || 'unknown');
  return c.json({ 
    message: "pong", 
    timestamp: new Date().toISOString(),
    ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    userAgent: c.req.header('user-agent') || 'unknown'
  });
});

// Mount API routes under /api prefix
app.route("/api", api);

// Root endpoint for the main app
app.get("/", (c) => {
  console.log('🚀 Root endpoint called');
  return c.json({ 
    status: "ok", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    api_docs: "/api/docs",
    health_check: "/api/health"
  });
});

export default app;