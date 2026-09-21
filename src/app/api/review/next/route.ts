import { NextRequest, NextResponse } from "next/server";
import { listMistakes } from "@/lib/db/read";
import { getQuizUnit } from "@/lib/quiz";
import { encodeQuizToken } from "@/lib/quiz/token";
import { encodeToken } from "@/lib/math/token";

export const runtime = "nodejs";

/**
 * GET /api/review/next?childId=
 * まちがいノートの先頭1問を「解き直し用の問題」として返す。答えは露出しない。
 *
 * quiz レスポンス: { mistakeId, kind:"quiz", unitId, question, choices, token }
 *   token = encodeQuizToken({ unitId, itemId, answerIndex }) — answerIndex は直接返さない。
 * math レスポンス: { mistakeId, kind:"math", unitId, prompt, answerToken }
 *   answerToken = encodeToken({ unitId, answer, prompt, meta }) — answer は直接返さない。
 * まちがいなし: { done: true }
 */
export async function GET(req: NextRequest) {
  const childId = (req.nextUrl.searchParams.get("childId") ?? "").trim();
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  const mistakes = await listMistakes(childId, 1);
  if (mistakes.length === 0) {
    return NextResponse.json({ done: true });
  }

  const m = mistakes[0];

  if (m.kind === "quiz") {
    const unit = getQuizUnit(m.unitId);
    const item = unit?.items.find((i) => i.id === m.itemId);
    if (!item || !unit) {
      // 問題バンクから消えた item — done 相当として空を返す。
      return NextResponse.json({ done: true });
    }
    const token = encodeQuizToken({
      unitId: m.unitId,
      itemId: item.id,
      answerIndex: item.answerIndex,
    });
    return NextResponse.json({
      mistakeId: m.id,
      kind: "quiz",
      unitId: m.unitId,
      question: item.question,
      choices: item.choices,
      token,
    });
  }

  // math
  let parsed: { prompt?: string; answer?: string; answerType?: string; meta?: Record<string, number> };
  try {
    parsed = JSON.parse(m.problem ?? "{}");
  } catch {
    return NextResponse.json({ done: true });
  }
  const { prompt = "", answer = "", meta = {} } = parsed;
  const answerToken = encodeToken({ unitId: m.unitId, answer, prompt, meta });
  return NextResponse.json({
    mistakeId: m.id,
    kind: "math",
    unitId: m.unitId,
    prompt,
    answerToken,
  });
}
