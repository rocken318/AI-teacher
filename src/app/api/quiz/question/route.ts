import { NextRequest, NextResponse } from "next/server";
import { getQuizUnit, pickQuestion } from "@/lib/quiz";
import { encodeQuizToken } from "@/lib/quiz/token";

export const runtime = "nodejs";

/**
 * 問題を1問配る API。
 *
 * リクエスト: { unitId: string }
 * レスポンス: {
 *   itemId: string,
 *   question: string,
 *   choices: string[],
 *   token: string,   // { unitId, itemId, answerIndex } を暗号化した採点トークン
 * }
 *
 * answerIndex はレスポンスに出さない（token に暗号化して入れる＝カンニング防止）。
 * 未知の unitId は 404。
 */
export async function POST(req: NextRequest) {
  let body: { unitId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const unitId = (body.unitId ?? "").trim();
  if (!unitId) {
    return NextResponse.json({ error: "unitId is required" }, { status: 400 });
  }

  const unit = getQuizUnit(unitId);
  if (!unit) {
    return NextResponse.json({ error: "unknown unitId" }, { status: 404 });
  }

  const picked = pickQuestion(unitId);
  if (!picked) {
    return NextResponse.json({ error: "no question available" }, { status: 404 });
  }

  // 正解 answerIndex は単元→item から取得し、token に暗号化して閉じ込める。
  const item = unit.items.find((it) => it.id === picked.itemId);
  if (!item) {
    return NextResponse.json({ error: "no question available" }, { status: 404 });
  }

  const token = encodeQuizToken({
    unitId,
    itemId: picked.itemId,
    answerIndex: item.answerIndex,
  });

  return NextResponse.json({
    itemId: picked.itemId,
    question: picked.question,
    choices: picked.choices,
    token,
  });
}
