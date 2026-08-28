import { NextRequest, NextResponse } from "next/server";
import {
  GUARDIAN_COOKIE,
  GUARDIAN_PASSCODE_KEY,
  getPasscodeState,
  checkPasscode,
  hashPasscode,
  verifyPasscode,
} from "@/lib/guardian-auth";
import { getConfigValue, setConfigValue } from "@/lib/db/config";

export const runtime = "nodejs";

/**
 * 保護者パスコードの設定・変更・ログイン API。
 *
 *  GET  → { configured, managedByEnv }  設定状態（設定UIの出し分け用・秘密は返さない）
 *  POST { action: "login", code }             → パスコードで解錠（Cookie を張る）
 *  POST { action: "set", newCode, currentCode? } → 設定/変更（初回は currentCode 不要）
 *
 * env(GUARDIAN_PASSCODE) 管理時は「set」不可（env 側で管理）。
 * 保存先が無い（Vercel で DATABASE_URL 未設定）ときは 500 no-store。
 */

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90日
  };
}

export async function GET() {
  const state = await getPasscodeState();
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  let body: {
    action?: string;
    code?: string;
    newCode?: string;
    currentCode?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const action = body.action;

  // ---- ログイン（解錠して Cookie を張る）----
  if (action === "login") {
    const code = (body.code ?? "").trim();
    if (!code) {
      return NextResponse.json({ error: "code required" }, { status: 400 });
    }
    const ok = await checkPasscode(code);
    if (!ok) {
      return NextResponse.json({ error: "wrong-passcode" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(GUARDIAN_COOKIE, code, cookieOptions());
    return res;
  }

  // ---- 設定 / 変更 ----
  if (action === "set") {
    const newCode = (body.newCode ?? "").trim();
    if (newCode.length < 4 || newCode.length > 64) {
      return NextResponse.json(
        { error: "パスコードは4〜64文字にしてください。" },
        { status: 400 },
      );
    }

    const state = await getPasscodeState();
    if (state.managedByEnv) {
      // env で管理されているので、アプリ内では変更できない。
      return NextResponse.json({ error: "env-managed" }, { status: 409 });
    }

    // すでに設定済みなら、現在のパスコード一致を要求する。
    if (state.configured) {
      const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);
      const current = (body.currentCode ?? "").trim();
      if (!stored || !current || !verifyPasscode(current, stored)) {
        return NextResponse.json({ error: "wrong-current" }, { status: 401 });
      }
    }

    try {
      await setConfigValue(GUARDIAN_PASSCODE_KEY, hashPasscode(newCode));
    } catch {
      // 保存先が無い（NoopStore）
      return NextResponse.json({ error: "no-store" }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(GUARDIAN_COOKIE, newCode, cookieOptions());
    return res;
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
