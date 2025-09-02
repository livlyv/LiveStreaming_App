import { Hono } from "hono";
import { supabaseAdmin } from "../utils/supabase";
import { randomUUID, createHmac } from "node:crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "";
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL ?? "";

const router = new Hono();

router.get("/", async (c) => {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, bio, profile_pic, followers, following, total_likes, coins_earned, is_verified, created_at, updated_at")
    .limit(100);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ users: data });
});

router.get("/:id", async (c) => {
  const id = c.req.param("id");
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, bio, profile_pic, followers, following, total_likes, coins_earned, is_verified, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error) return c.json({ error: "not found" }, 404);
  return c.json(data);
});

router.post("/:id/profile-picture", async (c) => {
  const id = c.req.param("id");
  const { url } = (await c.req.json().catch(() => ({}))) as { url?: string };
  if (!url) return c.json({ error: "url required" }, 400);
  const { error } = await supabaseAdmin.from("users").update({ profile_pic: url, profile_picture_url: url }).eq("id", id);
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true, url });
});

router.post("/presign-upload", async (c) => {
  try {
    const body = (await c.req.json().catch(() => ({}))) as { userId?: string; contentType?: string };
    const userId = body.userId ?? "unknown";
    const contentType = body.contentType ?? "image/jpeg";

    if (!R2_BUCKET || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      return c.json({ error: "R2 is not configured on the server" }, 500);
    }

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(contentType)) {
      return c.json({ error: "unsupported_content_type", allowed }, 400);
    }

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const key = `profiles/${userId}/${Date.now()}-${randomUUID()}.${ext}`;

    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const path = `/${encodeURIComponent(R2_BUCKET)}/${key.split('/').map(encodeURIComponent).join('/')}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]|\..+/g, '').slice(0, 15) + 'Z';
    const shortDate = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;

    const params: Record<string, string> = {
      'X-Amz-Algorithm': algorithm,
      'X-Amz-Credential': `${encodeURIComponent(R2_ACCESS_KEY_ID)}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(60 * 5),
      'X-Amz-SignedHeaders': 'host',
    };

    const canonicalQuery = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const canonicalHeaders = `host:${host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      'PUT',
      path,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const hashHex = (data: string) =>
      createHmac('sha256', '').update(data).digest('hex');

    const toHex = (buf: Buffer) => buf.toString('hex');

    const cryptoHash = await import('node:crypto');
    const cr = cryptoHash.createHash('sha256');
    cr.update(canonicalRequest);
    const canonicalRequestHash = cr.digest('hex');

    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    const kDate = createHmac('sha256', 'AWS4' + R2_SECRET_ACCESS_KEY).update(shortDate).digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update(service).digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const signedQuery = `${canonicalQuery}&X-Amz-Signature=${signature}`;
    const uploadUrl = `https://${host}${path}?${signedQuery}`;
    const publicUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : `https://${host}/${R2_BUCKET}/${key}`;

    return c.json({ uploadUrl, key, publicUrl });
  } catch (e) {
    console.error("presign error", e);
    return c.json({ error: "failed_to_presign" }, 500);
  }
});

router.post(":id/follow", async (c) => {
  const targetId = c.req.param("id");
  const { followerId } = (await c.req.json().catch(() => ({}))) as { followerId?: string };
  if (!followerId) return c.json({ error: "followerId required" }, 400);
  if (followerId === targetId) return c.json({ error: "cannot_follow_self" }, 400);

  const { data: existing } = await supabaseAdmin
    .from("followers")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabaseAdmin
      .from("followers")
      .delete()
      .eq("id", existing.id);
    if (delErr) return c.json({ error: delErr.message }, 500);
  } else {
    const { error: insErr } = await supabaseAdmin
      .from("followers")
      .insert({ follower_id: followerId, following_id: targetId });
    if (insErr) return c.json({ error: insErr.message }, 500);
  }

  const { data: target } = await supabaseAdmin.from("users").select("followers").eq("id", targetId).single();
  const { data: me } = await supabaseAdmin.from("users").select("following").eq("id", followerId).single();

  return c.json({ following: !existing, followers_count: target?.followers ?? null, following_count: me?.following ?? null });
});

router.post(":id/message/initiate", async (c) => {
  const toUserId = c.req.param("id");
  const { fromUserId } = (await c.req.json().catch(() => ({}))) as { fromUserId?: string };
  if (!fromUserId) return c.json({ error: "fromUserId required" }, 400);
  if (fromUserId === toUserId) return c.json({ error: "cannot_message_self" }, 400);

  const { data: gifts, error } = await supabaseAdmin
    .from("stream_gifts")
    .select("total_coins, streams!inner(user_id)")
    .eq("sender_id", fromUserId)
    .eq("streams.user_id", toUserId);
  if (error) return c.json({ error: error.message }, 500);
  const total = (gifts ?? []).reduce((sum: number, g: any) => sum + (g.total_coins ?? 0), 0);
  if (total < 99) {
    return c.json({ ok: false, allowed: false, reason: "threshold_not_met", required: 99, total }, 403);
  }

  const a = [fromUserId, toUserId].sort();
  const user_a = a[0];
  const user_b = a[1];

  const { data: threadExisting } = await supabaseAdmin
    .from("direct_message_threads")
    .select("id")
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .maybeSingle();

  let threadId: string | null = threadExisting?.id ?? null;
  if (!threadId) {
    const { data: created, error: thrErr } = await supabaseAdmin
      .from("direct_message_threads")
      .insert({ user_a, user_b })
      .select("id")
      .single();
    if (thrErr) return c.json({ error: thrErr.message }, 500);
    threadId = created?.id ?? null;
  }

  return c.json({ ok: true, allowed: true, threadId });
});

export default router;
