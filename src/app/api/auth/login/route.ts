import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, sessionCookieOptions, SESSION_TTL_MS } from "@/lib/auth/session";
import { findAccountByEmail, normalizeEmail } from "@/lib/auth/accounts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const account = await findAccountByEmail(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "メールアドレスかパスワードが違います。" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(account.id, SESSION_TTL_MS), sessionCookieOptions());
  return res;
}
