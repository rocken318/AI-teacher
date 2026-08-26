import { NextRequest, NextResponse } from "next/server";
import { getUnit, generateProblem } from "@/lib/math";
import { encodeToken } from "@/lib/math/token";

export const runtime = "nodejs";

/**
 * 問題を1問配る API。
 *
 * リクエスト: { unitId: string }
 * レスポンス: {
 *   problem: { unitId, prompt, answerType, choices? },  // answer は含めない（カンニング防止）
 *   answerToken: string,                                 // 採点用の難読化トークン
 * }
 *
 * 採点方式（MVP・難読化程度の簡易実装）:
 *   generateProblem で確定した正解（problem.answer）はクライアントに晒さない。
 *   代わりに { unitId, answer, prompt } を JSON→base64url したトークンを返し、
 *   grade API 側で復元して gradeAnswer で採点する。
 *   HMAC 署名はしない（MVP割り切り）。ただし素の正解JSONをそのまま
 *   レスポンスに載せないことで、UI上の即時カンニングを防ぐ。
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

  const unit = getUnit(unitId);
  if (!unit) {
    return NextResponse.json({ error: "unknown unitId" }, { status: 404 });
  }

  // 問題生成・採点は別チームの純ロジックに委譲（自分では計算しない）
  const problem = generateProblem(unitId);

  // answer を含む採点トークン（base64url）。素の正解JSONは晒さない。
  const answerToken = encodeToken({
    unitId,
    answer: problem.answer,
    prompt: problem.prompt,
  });

  return NextResponse.json({
    problem: {
      unitId: problem.unitId,
      prompt: problem.prompt,
      answerType: problem.answerType,
      // choices は契約として保持（現状の単元では未使用のことが多い）
      choices: problem.choices,
    },
    answerToken,
  });
}
