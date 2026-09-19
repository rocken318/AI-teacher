import { NextRequest, NextResponse } from "next/server";
import { getUnit, generateProblem } from "@/lib/math";
import { encodeToken } from "@/lib/math/token";
import { buildTestKey, distributeCount } from "@/lib/test/session";

export const runtime = "nodejs";

const ALLOWED_COUNTS = [5, 10, 20];

/**
 * テストの出題セットを配る API（算数のみ・v1）。
 * リクエスト: { subject: "math", unitIds: string[], count: number }
 * レスポンス: { testKey, total, items: [{ index, unitId, prompt, answerType, answerToken }] }
 *  - answer は含めない（各問は既存の暗号トークンに封入）。
 */
export async function POST(req: NextRequest) {
  let body: { subject?: string; unitIds?: unknown; count?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const subject = (body.subject ?? "").toString().trim();
  if (subject !== "math") {
    return NextResponse.json({ error: "v1 は算数(math)のみ対応" }, { status: 400 });
  }

  const unitIds = Array.isArray(body.unitIds)
    ? body.unitIds.map((u) => String(u)).filter(Boolean)
    : [];
  if (unitIds.length === 0) {
    return NextResponse.json({ error: "unitIds is required" }, { status: 400 });
  }
  for (const id of unitIds) {
    if (!getUnit(id)) {
      return NextResponse.json({ error: `unknown unitId: ${id}` }, { status: 404 });
    }
  }

  const count = Number(body.count);
  if (!ALLOWED_COUNTS.includes(count)) {
    return NextResponse.json({ error: "count は 5 / 10 / 20 のいずれか" }, { status: 400 });
  }

  const slots = distributeCount(unitIds, count);
  const items = slots.map((unitId, index) => {
    const p = generateProblem(unitId);
    return {
      index,
      unitId,
      prompt: p.prompt,
      answerType: p.answerType,
      answerToken: encodeToken({
        unitId,
        answer: p.answer,
        prompt: p.prompt,
        meta: p.meta ?? {},
      }),
    };
  });

  return NextResponse.json({
    testKey: buildTestKey(subject, unitIds),
    total: count,
    items,
  });
}
