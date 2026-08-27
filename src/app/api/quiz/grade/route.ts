import { NextRequest, NextResponse } from "next/server";
import { gradeQuiz, getQuizUnit } from "@/lib/quiz";
import { decodeQuizToken } from "@/lib/quiz/token";
import { logAttempt } from "@/lib/db/log";

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
  let body: { token?: string; choiceIndex?: number; childId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const choiceIndex = body.choiceIndex;

  if (!token || typeof choiceIndex !== "number" || !Number.isInteger(choiceIndex)) {
    return NextResponse.json(
      { error: "token and choiceIndex are required" },
      { status: 400 },
    );
  }

  const payload = decodeQuizToken(token);
  if (!payload) {
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }

  const result = gradeQuiz(payload.unitId, payload.itemId, choiceIndex);
  if (!result) {
    // トークンは正しいが単元/問題が見つからない（バンク更新でズレた等）→ 400。
    return NextResponse.json({ error: "invalid token" }, { status: 400 });
  }

  // 学習履歴を保存（childId があれば。教科は単元から取得）。
  const childId = (body.childId ?? "").trim();
  if (childId) {
    const subject = getQuizUnit(payload.unitId)?.subject ?? "quiz";
    logAttempt(childId, subject, payload.unitId, result.correct);
  }

  return NextResponse.json({
    correct: result.correct,
    answerIndex: result.answerIndex,
    explanation: result.explanation,
    hint: result.hint,
  });
}
