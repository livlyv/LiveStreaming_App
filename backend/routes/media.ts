import { Hono } from "hono";

const media = new Hono();

media.post("/nsfw/check", async (c) => {
  const { sample } = (await c.req.json().catch(() => ({}))) as { sample?: string };
  const score = Math.random()*0.4; // mock safe
  const flagged = score > 0.7;
  return c.json({ ok: !flagged, score, reason: flagged ? "nudity_detected" : "clean" });
});

export default media;
