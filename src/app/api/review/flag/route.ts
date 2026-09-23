import { NextRequest, NextResponse } from "next/server";
import { decodeQuizToken } from "@/lib/quiz/token";
import { getQuizUnit } from "@/lib/quiz";
import { addMistakeNow } from "@/lib/db/log";

export const runtime = "nodejs";

/**
 * POST /api/review/flag
 * リクエスト: { token: string, childId: string }
 * レスポンス: { ok: true }
 *
 * クイズの「怪しい」ボタン用。採点済みトークンを復号して、その問題（item）を
 * まちがいノートに追加する（正解でも復習に回す）。既存の重複防止で二重追加なし。
 * 認可は review 系と同じく childId ベース（未ログインの子でも動く）。
 * answerIndex 等は受け取らない・返さない（答え非露出）。
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; childId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const childId = (body.childId ?? "").trim();
  if (!token || !childId) {
    return NextResponse.json({ error: "token and childId required" }, { status: 400 });
  }

  const payload = decodeQuizToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }

  const subject = getQuizUnit(payload.unitId)?.subject ?? "quiz";
  await addMistakeNow({
    childId,
    subject,
    unitId: payload.unitId,
    kind: "quiz",
    itemId: payload.itemId,
    problem: null,
  });

  return NextResponse.json({ ok: true });
}
