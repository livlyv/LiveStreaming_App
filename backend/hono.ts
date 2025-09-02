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

app.use("*", cors({
  origin: ['http://localhost:3000', 'https://dev-bo44fwxvov01657rf6ttq.rorktest.dev', 'http://localhost:8081'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.route("/auth", auth);
app.route("/meta", meta);
app.route("/users", users);
app.route("/streaming", streaming);
app.route("/media", media);
app.route("/notifications", notifications);
app.route("/payments", payments);
app.route("/analytics", analytics);
app.route("/kyc", kyc);

app.get("/openapi.json", (c) => c.json(buildOpenAPI()));
app.get("/postman.json", (c) => c.json(buildPostmanCollection()));

app.get("/docs", (c) => {
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

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  console.log('🚀 Root endpoint called');
  return c.json({ 
    status: "ok", 
    message: "API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.APP_ENV || 'unknown'
  });
});

// Test endpoint for debugging
app.get("/test", (c) => {
  console.log('🧪 Test endpoint called');
  return c.json({ 
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(c.req.raw.headers.entries())
  });
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ 
    status: "healthy",
    timestamp: new Date().toISOString(),
    supabase: {
      url: process.env.SUPABASE_URL ? 'configured' : 'missing',
      anon_key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
      service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
    },
    jwt_secret: process.env.JWT_SECRET ? 'configured' : 'missing'
  });
});

export default app;