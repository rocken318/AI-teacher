import { NextRequest, NextResponse } from "next/server";
import { removeMistakeNow } from "@/lib/db/log";

export const runtime = "nodejs";

/**
 * POST /api/review/remove
 * リクエスト: { childId: string, mistakeId: string }
 * レスポンス: { ok: true }
 * その子のまちがいを1件削除する（自力正解 or「もう覚えた」）。
 * 他人の mistakeId を渡しても自分の分しか消えない（Store 側で child_id を確認）。
 */
export async function POST(req: NextRequest) {
  let body: { childId?: string; mistakeId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const childId = (body.childId ?? "").trim();
  const mistakeId = (body.mistakeId ?? "").trim();

  if (!childId || !mistakeId) {
    return NextResponse.json({ error: "childId and mistakeId required" }, { status: 400 });
  }

  await removeMistakeNow(childId, mistakeId);
  return NextResponse.json({ ok: true });
}
