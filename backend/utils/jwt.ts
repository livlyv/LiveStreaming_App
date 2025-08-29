import type { Context } from "hono";

const encoder = new TextEncoder();

function b64url(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  const base64 = btoa(str)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return base64;
}

function b64urlJson(obj: unknown) {
  return b64url(encoder.encode(JSON.stringify(obj)));
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export type JwtPayload = {
  sub: string;
  iat: number;
  exp: number;
  [k: string]: unknown;
};

export async function signJWT(payload: Omit<JwtPayload, "iat" | "exp"> & { exp?: number }, secret: string, ttlSec = 900) {
  const header = { alg: "HS256", typ: "JWT" } as const;
  const iat = Math.floor(Date.now() / 1000);
  const exp = payload.exp ?? iat + ttlSec;
  const body: JwtPayload = { ...payload, iat, exp } as JwtPayload;
  const unsigned = `${b64urlJson(header)}.${b64urlJson(body)}`;
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(unsigned));
  const token = `${unsigned}.${b64url(sig)}`;
  return token;
}

export async function verifyJWT(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const unsigned = `${h}.${p}`;
  const key = await importKey(secret);
  const sigBytes = Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const ok = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(unsigned));
  if (!ok) return null;
  try {
    const payloadJson = atob(p.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAuthSecret(c?: Context) {
  const envSecret = typeof process !== "undefined" ? (process.env?.JWT_SECRET ?? process.env?.EXPO_PUBLIC_JWT_SECRET) : undefined;
  const headerSecret = c?.req?.header("x-jwt-secret");
  return (headerSecret || envSecret || "dev_secret") as string;
}
