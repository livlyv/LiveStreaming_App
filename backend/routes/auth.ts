import { Hono } from "hono";
import { getAuthSecret, signJWT, verifyJWT } from "../utils/jwt";

const auth = new Hono();

type OTPRequestBody = { phone: string };
type OTPVerifyBody = { phone: string; code: string };

type TokenPair = { accessToken: string; refreshToken: string; tokenType: "Bearer"; expiresIn: number };

const issued: Record<string, string> = {};

auth.post("/otp/request", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<OTPRequestBody>;
  if (!body.phone) return c.json({ error: "phone is required" }, 400);
  const code = "123456";
  issued[body.phone] = code;
  return c.json({ success: true, phone: body.phone, mockCode: code });
});

auth.post("/otp/verify", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<OTPVerifyBody>;
  if (!body.phone || !body.code) return c.json({ error: "phone and code required" }, 400);
  if (issued[body.phone] !== body.code) return c.json({ error: "invalid code" }, 401);
  const secret = getAuthSecret(c);
  const sub = `user:${body.phone}`;
  const accessToken = await signJWT({ sub, role: "user" }, secret, 900);
  const refreshToken = await signJWT({ sub, type: "refresh" }, secret, 60 * 60 * 24 * 30);
  const res: TokenPair = { accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900 };
  return c.json(res);
});

auth.post("/refresh", async (c) => {
  const secret = getAuthSecret(c);
  const body = (await c.req.json().catch(() => ({}))) as { refreshToken?: string };
  const token = body.refreshToken || c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return c.json({ error: "refresh token required" }, 400);
  const payload = await verifyJWT(token, secret);
  if (!payload || (payload as any).type !== "refresh") return c.json({ error: "invalid refresh token" }, 401);
  const accessToken = await signJWT({ sub: payload.sub, role: "user" }, secret, 900);
  return c.json({ accessToken, tokenType: "Bearer", expiresIn: 900 });
});

auth.post("/logout", async (c) => {
  return c.json({ success: true });
});

export default auth;
