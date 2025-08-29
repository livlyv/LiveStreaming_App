import { Hono } from "hono";

const payments = new Hono();

const history: { id: string; type: "purchase"|"gift"; coins: number; amount?: number; note?: string; ts: number }[] = [];

payments.get("/wallet", (c) => {
  const balance = history.reduce((acc, h) => acc + (h.type === "purchase" ? h.coins : -h.coins), 120);
  return c.json({ balance, history });
});

payments.post("/purchase", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { coins?: number; amount?: number };
  if (!body.coins || !body.amount) return c.json({ error: "coins/amount required" }, 400);
  const item = { id: `t_${Date.now()}`, type: "purchase" as const, coins: body.coins, amount: body.amount, ts: Date.now(), note: "+ coins" };
  history.unshift(item);
  return c.json(item, 201);
});

payments.post("/gift", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { coins?: number; to?: string; gift?: string };
  if (!body.coins) return c.json({ error: "coins required" }, 400);
  const item = { id: `t_${Date.now()}`, type: "gift" as const, coins: body.coins, ts: Date.now(), note: `gift:${body.gift ?? "unknown"}` };
  history.unshift(item);
  return c.json(item, 201);
});

payments.get("/earnings", (c) => {
  const since = Date.now() - 1000*60*60*24*30;
  const coins = 5430;
  return c.json({ since, coins });
});

export default payments;
