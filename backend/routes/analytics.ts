import { Hono } from "hono";
import { supabaseAdmin } from "../utils/supabase";

const analytics = new Hono();

analytics.get("/streams/:id", (c) => {
  const id = c.req.param("id");
  const points = Array.from({ length: 12 }).map((_, i) => ({ t: Date.now() - (11 - i) * 60000, viewers: Math.floor(Math.random() * 500) }));
  return c.json({ id, points });
});

analytics.get("/profile/:userId", async (c) => {
  const userId = c.req.param("userId");
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id, followers, following, total_likes, coins_earned")
    .eq("id", userId)
    .single();
  if (userErr) return c.json({ error: userErr.message }, 500);

  const { data: topGifterRows, error: tgErr } = await supabaseAdmin
    .from("stream_gifts")
    .select("sender_id, total_coins, streams!inner(user_id)")
    .eq("streams.user_id", userId);
  if (tgErr) return c.json({ error: tgErr.message }, 500);
  const totalsBySender: Record<string, number> = {};
  (topGifterRows ?? []).forEach((r: any) => {
    const sid = r.sender_id as string | null;
    if (!sid) return;
    totalsBySender[sid] = (totalsBySender[sid] ?? 0) + (r.total_coins ?? 0);
  });
  const topGifter = Object.entries(totalsBySender)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1)
    .map(([sender_id, coins]) => ({ sender_id, coins }))[0] ?? null;

  let topGifterProfile: any = null;
  if (topGifter) {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, username, profile_pic")
      .eq("id", topGifter.sender_id)
      .single();
    if (profile) topGifterProfile = { ...profile, total_coins: topGifter.coins };
  }

  const { data: giftRows, error: giftsErr } = await supabaseAdmin
    .from("stream_gifts")
    .select("gift_id, total_coins, quantity, gifts!inner(name, icon_url, coin_value), streams!inner(user_id)")
    .eq("streams.user_id", userId);
  if (giftsErr) return c.json({ error: giftsErr.message }, 500);

  const giftsById: Record<string, { name: string; icon_url: string | null; coin_value: number; total: number }> = {};
  (giftRows ?? []).forEach((r: any) => {
    const g = r.gifts as any;
    if (!g) return;
    const id = r.gift_id as string;
    if (!giftsById[id]) giftsById[id] = { name: g.name, icon_url: g.icon_url ?? null, coin_value: g.coin_value ?? 0, total: 0 };
    giftsById[id].total += (g.coin_value ?? 0) * (r.quantity ?? 1);
  });
  const topGifts = Object.entries(giftsById)
    .map(([gift_id, v]) => ({ gift_id, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 4);

  return c.json({
    followers_count: user?.followers ?? 0,
    following_count: user?.following ?? 0,
    total_likes: user?.total_likes ?? 0,
    total_coins_earned: user?.coins_earned ?? 0,
    top_gifter: topGifterProfile,
    top_gifts: topGifts,
  });
});

analytics.get("/streams/duration/:userId", async (c) => {
  const userId = c.req.param("userId");
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: rows, error } = await supabaseAdmin
    .from("streams")
    .select("started_at, ended_at, user_id")
    .eq("user_id", userId)
    .gte("started_at", since30.toISOString());
  if (error) return c.json({ error: error.message }, 500);

  const clampDurationHours = (start: string | null, end: string | null) => {
    if (!start) return 0;
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : now.getTime();
    return Math.max(0, (e - s) / (1000 * 60 * 60));
  };

  const weeklyMap: Record<string, number> = { Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0 };
  const monthlyMap: Record<string, number> = {};

  (rows ?? []).forEach((r) => {
    const h = clampDurationHours(r.started_at as any, r.ended_at as any);
    const dayIdx = new Date(r.started_at as any).getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
    const dayName = dayNames[dayIdx];
    if (new Date(r.started_at as any) >= since7) weeklyMap[dayName] = (weeklyMap[dayName] ?? 0) + h;
    const d = new Date(r.started_at as any);
    const weekNumber = `${d.getUTCFullYear()}-W${Math.ceil(((d.getUTCDate() + ((d.getUTCDay() + 6) % 7)) / 7))}`;
    monthlyMap[weekNumber] = (monthlyMap[weekNumber] ?? 0) + h;
  });

  const weekly_duration = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => ({ day, hours: Number((weeklyMap[day] ?? 0).toFixed(2)) }));
  const monthly_duration = Object.entries(monthlyMap)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, total]) => ({ week, total_hours: Number(total.toFixed(2)) }));

  return c.json({ weekly_duration, monthly_duration });
});

export default analytics;
