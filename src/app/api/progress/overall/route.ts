// src/app/api/progress/overall/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild, getChild } from "@/lib/auth/accounts";
import { listAttempts } from "@/lib/db/read";
import { overallStats } from "@/lib/progress-stats";
import type { Stage } from "@/lib/stage";

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
  const child = await getChild(childId);
  const stage = (child?.stage ?? "elementary") as Stage;
  const attempts = await listAttempts(childId);
  return NextResponse.json(overallStats(attempts, stage));
}
