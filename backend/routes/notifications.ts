import { Hono } from "hono";

const notifications = new Hono();

const store: Record<string, { id: string; title: string; body: string; read: boolean }[]> = {};

notifications.get("/", (c) => {
  const uid = c.req.query("userId") || "u_1";
  store[uid] ||= [];
  return c.json({ items: store[uid] });
});

notifications.post("/", async (c) => {
  const uid = c.req.query("userId") || "u_1";
  const body = (await c.req.json().catch(() => ({}))) as { title?: string; body?: string };
  if (!body.title || !body.body) return c.json({ error: "title/body required" }, 400);
  const item = { id: `n_${Date.now()}` , title: body.title, body: body.body, read: false };
  store[uid] ||= [];
  store[uid].unshift(item);
  return c.json(item, 201);
});

notifications.post("/read-all", (c) => {
  const uid = c.req.query("userId") || "u_1";
  store[uid] ||= [];
  store[uid] = store[uid].map(n => ({ ...n, read: true }));
  return c.json({ success: true });
});

notifications.delete("/clear", (c) => {
  const uid = c.req.query("userId") || "u_1";
  store[uid] = [];
  return c.json({ success: true });
});

export default notifications;
