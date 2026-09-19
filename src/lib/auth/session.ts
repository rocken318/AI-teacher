import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** セッションCookie名。 */
export const SESSION_COOKIE = "ai_sensei_session";

// 本番で AUTH_SECRET 未設定だと既定鍵になり、セッションを偽造されうる。
// クラッシュはさせない（デプロイを止めない）が、ログで強く警告する。
if (
  !process.env.AUTH_SECRET &&
  (process.env.VERCEL || process.env.NODE_ENV === "production")
) {
  console.error(
    "[auth] AUTH_SECRET が未設定です。本番では必ず設定してください（既定鍵のままだとセッション偽造の恐れ）。",
  );
}

const KEY = createHash("sha256")
  .update(process.env.AUTH_SECRET ?? "ai-sensei-auth-default-secret-v1")
  .digest();

/** payload を base64url、HMAC-SHA256 で署名して "body.sig" を返す。ttlMs 後に失効。 */
export function signSession(accountId: string, ttlMs: number): string {
  const payload = { accountId, exp: Date.now() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", KEY).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** 署名と期限を検証し accountId を返す。不正/期限切れは null。 */
export function verifySession(token: string): { accountId: string } | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const expected = createHmac("sha256", KEY).update(body).digest();
    const got = Buffer.from(sig, "base64url");
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      accountId?: unknown;
      exp?: unknown;
    };
    if (typeof payload.accountId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return { accountId: payload.accountId };
  } catch {
    return null;
  }
}

/** Cookie の共通オプション（90日）。 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  };
}

/** セッションの有効期間（署名の exp とCookie maxAge を揃える）。 */
export const SESSION_TTL_MS = 60 * 60 * 24 * 90 * 1000;
