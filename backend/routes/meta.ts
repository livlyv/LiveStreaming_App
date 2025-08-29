import { Hono } from "hono";

export function buildOpenAPI() {
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
  return openapi;
}

export function buildPostmanCollection() {
  const base = "/api";
  const collection = {
    info: { name: "Demo Streaming App", schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
    item: [
      {
        name: "Meta",
        item: [
          { name: "Health", request: { method: "GET", url: `${base}/meta/health` } },
          { name: "Config", request: { method: "GET", url: `${base}/meta/config` } }
        ]
      },
      {
        name: "Auth",
        item: [
          { name: "Request OTP", request: { method: "POST", url: `${base}/auth/otp/request`, body: { mode: "raw", raw: JSON.stringify({ phone: "+911234567890" }) } } },
          { name: "Verify OTP", request: { method: "POST", url: `${base}/auth/otp/verify`, body: { mode: "raw", raw: JSON.stringify({ phone: "+911234567890", code: "123456" }) } } },
          { name: "Refresh", request: { method: "POST", url: `${base}/auth/refresh` } },
          { name: "Logout", request: { method: "POST", url: `${base}/auth/logout` } }
        ]
      },
      {
        name: "Users",
        item: [
          { name: "List", request: { method: "GET", url: `${base}/users` } },
          { name: "Get", request: { method: "GET", url: `${base}/users/u_1` } },
          { name: "Create", request: { method: "POST", url: `${base}/users`, body: { mode: "raw", raw: JSON.stringify({ username: "new_user" }) } } },
          { name: "Update", request: { method: "PATCH", url: `${base}/users/u_1`, body: { mode: "raw", raw: JSON.stringify({ bio: "Updated bio" }) } } }
        ]
      },
      {
        name: "Streaming",
        item: [
          { name: "Start", request: { method: "POST", url: `${base}/streaming/start`, body: { mode: "raw", raw: JSON.stringify({ title: "Test Stream" }) } } },
          { name: "End", request: { method: "POST", url: `${base}/streaming/end`, body: { mode: "raw", raw: JSON.stringify({ streamId: "s_demo" }) } } },
          { name: "Viewers", request: { method: "GET", url: `${base}/streaming/viewers/s_demo` } }
        ]
      },
      {
        name: "Media",
        item: [
          { name: "NSFW Check", request: { method: "POST", url: `${base}/media/nsfw/check`, body: { mode: "raw", raw: JSON.stringify({ sample: "base64" }) } } }
        ]
      },
      {
        name: "Notifications",
        item: [
          { name: "List", request: { method: "GET", url: `${base}/notifications` } },
          { name: "Create", request: { method: "POST", url: `${base}/notifications`, body: { mode: "raw", raw: JSON.stringify({ title: "Hello", body: "World" }) } } },
          { name: "Read All", request: { method: "POST", url: `${base}/notifications/read-all` } },
          { name: "Clear", request: { method: "DELETE", url: `${base}/notifications/clear` } }
        ]
      },
      {
        name: "Payments",
        item: [
          { name: "Wallet", request: { method: "GET", url: `${base}/payments/wallet` } },
          { name: "Purchase", request: { method: "POST", url: `${base}/payments/purchase`, body: { mode: "raw", raw: JSON.stringify({ coins: 100, amount: 59 }) } } },
          { name: "Gift", request: { method: "POST", url: `${base}/payments/gift`, body: { mode: "raw", raw: JSON.stringify({ coins: 10, to: "u_1", gift: "rose" }) } } },
          { name: "Earnings", request: { method: "GET", url: `${base}/payments/earnings` } }
        ]
      },
      {
        name: "Analytics",
        item: [
          { name: "Stream Points", request: { method: "GET", url: `${base}/analytics/streams/s_demo` } }
        ]
      },
      {
        name: "KYC",
        item: [
          { name: "Status", request: { method: "GET", url: `${base}/kyc/status` } },
          { name: "Submit", request: { method: "POST", url: `${base}/kyc/submit` } }
        ]
      }
    ]
  } as const;
  return collection;
}

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
  return c.json(buildOpenAPI());
});

meta.get("/postman.json", (c) => {
  return c.json(buildPostmanCollection());
});

export default meta;
