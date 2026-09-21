import { NextRequest, NextResponse } from "next/server";
import { gradeQuiz, getQuizUnit } from "@/lib/quiz";
import { decodeQuizToken } from "@/lib/quiz/token";
import { logAttempt, logMistake } from "@/lib/db/log";

export const runtime = "nodejs";

/**
 * 採点 API。
 *
 * リクエスト: { token: string, choiceIndex: number }
 * レスポンス: { correct: boolean, answerIndex: number, explanation: string, hint: string | null }
 *
 * token を復号して { unitId, itemId, answerIndex } を取り出し、
 * gradeQuiz(unitId, itemId, choiceIndex) で採点する（正解はサーバー内で確定）。
 * 壊れた／改ざんされたトークンは 400。
 * 解説は gradeQuiz が返すバンクの authored 文言（AIは使わない）。
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; choiceIndex?: number; childId?: string; unknown?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const choiceIndex = body.choiceIndex;

  // わからない のときは choiceIndex を問わない（-1 等でも可）。
  const isUnknown = body.unknown === true;
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  if (!isUnknown && (typeof choiceIndex !== "number" || !Number.isInteger(choiceIndex))) {
    return NextResponse.json({ error: "choiceIndex required" }, { status: 400 });
  }
  const payload = decodeQuizToken(token);
  if (!payload) return NextResponse.json({ error: "invalid token" }, { status: 400 });
  const graded = gradeQuiz(payload.unitId, payload.itemId, isUnknown ? -1 : (choiceIndex as number));
  if (!graded) return NextResponse.json({ error: "invalid token" }, { status: 400 });
  const correct = isUnknown ? false : graded.correct;

  const childId = (body.childId ?? "").trim();
  if (childId) {
    const subject = getQuizUnit(payload.unitId)?.subject ?? "quiz";
    logAttempt(childId, subject, payload.unitId, correct);
    if (!correct) {
      logMistake({ childId, subject, unitId: payload.unitId, kind: "quiz", itemId: payload.itemId, problem: null });
    }
  }

  return NextResponse.json({
    correct,
    answerIndex: graded.answerIndex,
    explanation: graded.explanation,
    hint: graded.hint,
  });
}
