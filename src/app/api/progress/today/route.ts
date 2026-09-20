// src/app/api/progress/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild } from "@/lib/auth/accounts";
import { listAttempts, listTestResults } from "@/lib/db/read";
import { todayStats, toJstDateKey } from "@/lib/progress-stats";

export const runtime = "nodejs";

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
  const [attempts, tests] = await Promise.all([
    listAttempts(childId),
    listTestResults(childId),
  ]);
  const todayKey = toJstDateKey(Date.now());
  return NextResponse.json(todayStats(attempts, tests, todayKey));
}
