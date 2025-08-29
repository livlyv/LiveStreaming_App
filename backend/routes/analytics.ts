import { Hono } from "hono";

const analytics = new Hono();

analytics.get("/streams/:id", (c) => {
  const id = c.req.param("id");
  const points = Array.from({ length: 12 }).map((_, i) => ({ t: Date.now() - (11-i)*60000, viewers: Math.floor(Math.random()*500) }));
  return c.json({ id, points });
});

export default analytics;
