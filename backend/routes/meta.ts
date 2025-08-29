import { Hono } from "hono";

const meta = new Hono();

meta.get("/health", (c) => c.json({ status: "ok" }));
meta.get("/config", (c) => {
  const cfg = {
    streaming: { provider: process.env.STREAMING_PROVIDER ?? "mock" },
    payments: { provider: process.env.PAYMENTS_PROVIDER ?? "mock" },
    notifications: { provider: process.env.NOTIFICATIONS_PROVIDER ?? "mock" },
  };
  return c.json(cfg);
});

meta.get("/openapi.json", (c) => {
  const openapi = {
    openapi: "3.0.3",
    info: {
      title: "Demo Streaming App API",
      version: "1.0.0",
      description: "OpenAPI spec for the modular REST backend (auth, users, streaming, media, notifications, payments, analytics, kyc).",
    },
    servers: [{ url: "/api", description: "Current instance" }],
    paths: {
      "/auth/otp/request": {
        post: {
          summary: "Request OTP",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { phone: { type: "string" } }, required: ["phone"] } } } },
          responses: { "200": { description: "OTP issued (mock)", content: { "application/json": { schema: { type: "object" } } } } }
        }
      },
      "/auth/otp/verify": {
        post: {
          summary: "Verify OTP and issue tokens",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { phone: { type: "string" }, code: { type: "string" } }, required: ["phone","code"] } } } },
          responses: { "200": { description: "Token pair", content: { "application/json": { schema: { type: "object" } } } } }
        }
      },
      "/auth/refresh": { post: { summary: "Refresh access token", responses: { "200": { description: "New access token" } } } },
      "/users": { get: { summary: "List users", responses: { "200": { description: "OK" } } }, post: { summary: "Create user", responses: { "201": { description: "Created" } } } },
      "/users/{id}": { get: { summary: "Get user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" }, "404": { description: "Not found" } } }, patch: { summary: "Update user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } } },
      "/streaming/start": { post: { summary: "Start stream", responses: { "200": { description: "Started" } } } },
      "/streaming/end": { post: { summary: "End stream", responses: { "200": { description: "Ended" } } } },
      "/streaming/viewers/{id}": { get: { summary: "Get viewers", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } } },
      "/media/nsfw/check": { post: { summary: "NSFW image check (mock)", responses: { "200": { description: "Result" } } } },
      "/notifications": { get: { summary: "List notifications", responses: { "200": { description: "OK" } } }, post: { summary: "Create notification", responses: { "201": { description: "Created" } } } },
      "/notifications/read-all": { post: { summary: "Mark all as read", responses: { "200": { description: "OK" } } } },
      "/notifications/clear": { delete: { summary: "Clear all", responses: { "200": { description: "OK" } } } },
      "/payments/wallet": { get: { summary: "Get wallet", responses: { "200": { description: "OK" } } } },
      "/payments/purchase": { post: { summary: "Purchase coins", responses: { "201": { description: "Created" } } } },
      "/payments/gift": { post: { summary: "Record gift send (coin deduction)", responses: { "201": { description: "Created" } } } },
      "/payments/earnings": { get: { summary: "Earnings (dummy)", responses: { "200": { description: "OK" } } } },
      "/analytics/streams/{id}": { get: { summary: "Stream analytics points", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } } },
      "/kyc/status": { get: { summary: "KYC status", responses: { "200": { description: "OK" } } } },
      "/kyc/submit": { post: { summary: "Submit KYC", responses: { "200": { description: "OK" } } } }
    }
  } as const;
  return c.json(openapi);
});

meta.get("/postman.json", (c) => {
  const base = "/api";
  const collection = {
    info: { name: "Demo Streaming App", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    item: [
      { name: "Health", request: { method: "GET", url: `${base}/meta/health` } },
      { name: "Auth - Request OTP", request: { method: "POST", url: `${base}/auth/otp/request`, body: { mode: "raw", raw: JSON.stringify({ phone: "+911234567890" }) } } },
      { name: "Auth - Verify OTP", request: { method: "POST", url: `${base}/auth/otp/verify`, body: { mode: "raw", raw: JSON.stringify({ phone: "+911234567890", code: "123456" }) } } },
      { name: "Wallet", request: { method: "GET", url: `${base}/payments/wallet` } },
      { name: "Purchase Coins", request: { method: "POST", url: `${base}/payments/purchase`, body: { mode: "raw", raw: JSON.stringify({ coins: 100, amount: 59 }) } } },
      { name: "Send Gift", request: { method: "POST", url: `${base}/payments/gift`, body: { mode: "raw", raw: JSON.stringify({ coins: 10, to: "u_1", gift: "rose" }) } } },
      { name: "Viewers", request: { method: "GET", url: `${base}/streaming/viewers/s_demo` } },
      { name: "Notifications - List", request: { method: "GET", url: `${base}/notifications` } },
      { name: "Notifications - Read All", request: { method: "POST", url: `${base}/notifications/read-all` } },
      { name: "Notifications - Clear", request: { method: "DELETE", url: `${base}/notifications/clear` } }
    ]
  } as const;
  return c.json(collection);
});

export default meta;
