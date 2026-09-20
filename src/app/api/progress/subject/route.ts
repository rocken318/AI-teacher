// src/app/api/progress/subject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild, getChild } from "@/lib/auth/accounts";
import { listAttempts } from "@/lib/db/read";
import { subjectStats } from "@/lib/progress-stats";
import { isTestSubject } from "@/lib/test/pool";
import { isStage, type Stage } from "@/lib/stage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  const subject = req.nextUrl.searchParams.get("subject");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }
  if (!(await ownsChild(accountId, childId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!subject || !isTestSubject(subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }
  const child = await getChild(childId);
  const stage: Stage = isStage(child?.stage) ? child.stage : "elementary";
  const attempts = await listAttempts(childId);
  return NextResponse.json(subjectStats(attempts, subject, stage));
}
