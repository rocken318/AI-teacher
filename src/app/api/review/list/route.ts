import { NextRequest, NextResponse } from "next/server";
import { listMistakes, countMistakes } from "@/lib/db/read";
import { getQuizUnit } from "@/lib/quiz";

export const runtime = "nodejs";

/**
 * GET /api/review/list?childId=
 * その子のまちがい一覧。
 * レスポンス: { count: number, mistakes: { id, subject, unitId, kind, preview }[] }
 * preview = quiz: item の question, math: problem JSON の prompt。
 */
export async function GET(req: NextRequest) {
  const childId = (req.nextUrl.searchParams.get("childId") ?? "").trim();
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }

  // count は全件数（真の合計）。一覧は実用上十分な上限で取り、通常は count と一致する。
  const [mistakes, count] = await Promise.all([
    listMistakes(childId, 1000),
    countMistakes(childId),
  ]);

  const items = mistakes.map((m) => {
    let preview = "";
    if (m.kind === "quiz") {
      const unit = getQuizUnit(m.unitId);
      const item = unit?.items.find((i) => i.id === m.itemId);
      preview = item?.question ?? "";
    } else {
      try {
        preview = (JSON.parse(m.problem ?? "{}") as { prompt?: string }).prompt ?? "";
      } catch {
        preview = "";
      }
    }
    return {
      id: m.id,
      subject: m.subject,
      unitId: m.unitId,
      kind: m.kind,
      preview,
    };
  });

  return NextResponse.json({ count, mistakes: items });
}
