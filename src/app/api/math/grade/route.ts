import { NextRequest, NextResponse } from "next/server";
import { getUnit, gradeAnswer, diagnose } from "@/lib/math";
import type { Problem } from "@/lib/math";
import { decodeToken } from "@/lib/math/token";

export const runtime = "nodejs";

/**
 * 採点 API。
 *
 * リクエスト: {
 *   unitId: string,
 *   answerToken: string,   // problem API が返したトークン
 *   userInput: string,     // 子どもの入力（"3/4" など）
 *   prompt?: string,       // UI表示中の問題文（任意・突き合わせ確認用）
 * }
 * レスポンス: { correct: boolean, expected: string }
 *
 * 採点はサーバーで gradeAnswer に委譲する（自分では判定しない）。
 * トークンから正解を復元し、gradeAnswer の期待する Problem 形へ組み立てる。
 */
export async function POST(req: NextRequest) {
  let body: {
    unitId?: string;
    answerToken?: string;
    userInput?: string;
    prompt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const unitId = (body.unitId ?? "").trim();
  const answerToken = (body.answerToken ?? "").trim();
  const userInput = body.userInput ?? "";

  if (!unitId || !answerToken) {
    return NextResponse.json(
      { error: "unitId and answerToken are required" },
      { status: 400 },
    );
  }

  const unit = getUnit(unitId);
  if (!unit) {
    return NextResponse.json({ error: "unknown unitId" }, { status: 404 });
  }

  const payload = decodeToken(answerToken);
  if (!payload || payload.unitId !== unitId) {
    return NextResponse.json({ error: "invalid answerToken" }, { status: 400 });
  }

  // UI表示中の prompt が渡された場合、トークン内の prompt と一致確認
  // （不一致なら別問題の使い回し等 → 400）
  if (typeof body.prompt === "string" && body.prompt.trim() !== payload.prompt) {
    return NextResponse.json({ error: "prompt mismatch" }, { status: 400 });
  }

  // gradeAnswer に渡す Problem を、トークンの確定正解から復元する。
  // answerType は単元メタ（Unit）から取り、prompt / answer はトークンの確定値を使う。
  const problem: Problem = {
    unitId,
    prompt: payload.prompt,
    answer: payload.answer,
    answerType: unit.answerType,
    meta: payload.meta ?? {},
  };

  const result = gradeAnswer(unitId, problem, userInput);

  // 不正解のときだけ、ルール診断で「どう考えたか→正しい筋道」を計算する。
  // 生成AIは使わず、meta から誤答パターンを再現して確実に判定する。
  const diagnosis = result.correct
    ? null
    : diagnose(unitId, problem, userInput);

  return NextResponse.json({
    correct: result.correct,
    expected: result.expected,
    // 正解時は diagnosis を省略、不正解でも特定できなければ null。
    ...(diagnosis ? { diagnosis } : {}),
  });
}
