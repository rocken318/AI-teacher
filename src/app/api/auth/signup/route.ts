import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, sessionCookieOptions, SESSION_TTL_MS } from "@/lib/auth/session";
import { createAccount, findAccountByEmail, normalizeEmail } from "@/lib/auth/accounts";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスを正しく入力してください。" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください。" }, { status: 400 });
  }
  try {
    if (await findAccountByEmail(email)) {
      return NextResponse.json({ error: "このメールアドレスは既に使われています。" }, { status: 409 });
    }
    const id = await createAccount(email, hashPassword(password));
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, signSession(id, SESSION_TTL_MS), sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: "no-store" }, { status: 500 });
  }
}
