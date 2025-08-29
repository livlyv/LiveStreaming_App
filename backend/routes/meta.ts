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

export default meta;
