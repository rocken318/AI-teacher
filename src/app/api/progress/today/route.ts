// src/app/api/progress/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild } from "@/lib/auth/accounts";
import { listAttempts, listTestResults, listMistakes } from "@/lib/db/read";
import { todayStats, toJstDateKey } from "@/lib/progress-stats";
import { getQuizUnit } from "@/lib/quiz";
import { getUnit as getMathUnit } from "@/lib/math";

export const runtime = "nodejs";

/** 単元タイトルを解決（算数=math カタログ／その他=quiz カタログ／無ければ unitId）。 */
function unitTitle(subject: string, unitId: string): string {
  const t = subject === "math" ? getMathUnit(unitId)?.title : getQuizUnit(unitId)?.title;
  return t ?? unitId;
}

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }
  if (!(await ownsChild(accountId, childId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const [attempts, tests, mistakes] = await Promise.all([
    listAttempts(childId),
    listTestResults(childId),
    listMistakes(childId, 1000),
  ]);
  const todayKey = toJstDateKey(Date.now());
  const stats = todayStats(attempts, tests, todayKey);

  // 単元別内訳にタイトルを付与。
  const byUnit = stats.byUnit.map((u) => ({
    ...u,
    title: unitTitle(u.subject, u.unitId),
  }));

  // 今日(JST)のまちがいを問題文プレビューつきで（答え・answerIndex は出さない）。
  const todayMistakes = mistakes
    .filter((m) => toJstDateKey(m.createdAtMs) === todayKey)
    .map((m) => {
      let preview = "";
      if (m.kind === "quiz") {
        const unit = getQuizUnit(m.unitId);
        preview = unit?.items.find((i) => i.id === m.itemId)?.question ?? "";
      } else {
        try {
          preview = (JSON.parse(m.problem ?? "{}") as { prompt?: string }).prompt ?? "";
        } catch {
          preview = "";
        }
      }
      return { id: m.id, subject: m.subject, unitId: m.unitId, kind: m.kind, preview };
    });

  return NextResponse.json({ ...stats, byUnit, todayMistakes });
}
