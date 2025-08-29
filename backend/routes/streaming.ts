import { Hono } from "hono";

const streaming = new Hono();

type StartBody = { title: string; category?: string };

streaming.post("/start", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<StartBody>;
  if (!body.title) return c.json({ error: "title required" }, 400);
  const streamId = `s_${Date.now()}`;
  return c.json({ streamId, ingestUrl: "mock://ingest", playbackUrl: `https://example.com/hls/${streamId}.m3u8` });
});

streaming.post("/end", async (c) => {
  const { streamId } = (await c.req.json().catch(() => ({}))) as { streamId?: string };
  if (!streamId) return c.json({ error: "streamId required" }, 400);
  return c.json({ ended: true, streamId });
});

streaming.get("/viewers/:id", (c) => {
  const id = c.req.param("id");
  const viewers = Array.from({ length: 8 }).map((_, i) => ({ id: `v_${i}`, username: `viewer_${i}`, coins: Math.floor(Math.random()*1000), avatarUrl: `https://i.pravatar.cc/96?u=${i}` }));
  return c.json({ streamId: id, count: viewers.length, viewers });
});

export default streaming;
