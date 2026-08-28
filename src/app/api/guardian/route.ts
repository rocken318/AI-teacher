import { NextRequest, NextResponse } from "next/server";
import {
  listSessions,
  getSessionDetail,
  getChildProgress,
  getDbBackend,
} from "@/lib/db/read";
import { summarizeSession } from "@/lib/insights";
import { resolveGuardianAccess, GUARDIAN_COOKIE } from "@/lib/guardian-auth";

export const runtime = "nodejs";

/**
 * 見守りダッシュボードの読み取り API。
 *
 *  GET /api/guardian            → { backend, sessions }        （一覧）
 *  GET /api/guardian?list=1     → 同上
 *  GET /api/guardian?id=SESSION → { detail, insights }         （詳細＋要約）
 *
 * 詳細が無ければ 404 JSON。データ無し（noop）でも sessions=[] を返すだけで壊れない。
 */
export async function GET(req: NextRequest) {
  // アクセスゲート（ページと同じ判定）。会話ログを無認証で返さない。
  const access = await resolveGuardianAccess({
    providedCode:
      req.nextUrl.searchParams.get("code") ?? req.headers.get("x-guardian-code"),
    cookieCode: req.cookies.get(GUARDIAN_COOKIE)?.value,
  });
  if (!access.allowed) {
    return NextResponse.json(
      { error: "unauthorized", reason: access.reason },
      { status: 401 },
    );
  }

  // 学習の進捗（childId 指定時）。端末に保存された学習者IDで集計を返す。
  const childId = req.nextUrl.searchParams.get("childId");
  if (childId) {
    const progress = await getChildProgress(childId);
    return NextResponse.json({ backend: getDbBackend(), progress });
  }

  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const detail = await getSessionDetail(id);
    if (!detail) {
      return NextResponse.json(
        { error: "not-found", id },
        { status: 404 },
      );
    }
    const insights = await summarizeSession(
      detail.messages.map((m) => ({
        // sender は "child" | "ai" 以外は "ai" 扱いに寄せる（安全側）
        sender: m.sender === "child" ? "child" : "ai",
        text: m.text,
      })),
    );
    return NextResponse.json({ detail, insights });
  }

  const sessions = await listSessions(50);
  return NextResponse.json({ backend: getDbBackend(), sessions });
}
