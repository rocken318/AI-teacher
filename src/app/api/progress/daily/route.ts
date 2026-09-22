// src/app/api/progress/daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild } from "@/lib/auth/accounts";
import { listAttempts } from "@/lib/db/read";
import {
  dailyActivity,
  dateKeysOf,
  currentStreak,
  daysInMonth,
  toJstDateKey,
  jstMonthKey,
} from "@/lib/progress-stats";

export const runtime = "nodejs";

/** days クエリを 7〜60 にクランプ（既定30）。 */
function parseDays(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 30;
  return Math.min(60, Math.max(7, Math.floor(n)));
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

  const days = parseDays(req.nextUrl.searchParams.get("days"));
  const attempts = await listAttempts(childId);
  const now = Date.now();
  const todayKey = toJstDateKey(now);
  const monthKey = jstMonthKey(now);

  const activity = dailyActivity(attempts, todayKey, days);
  const keys = dateKeysOf(attempts);
  return NextResponse.json({
    ...activity,
    streak: {
      current: currentStreak(keys, todayKey),
      thisMonth: daysInMonth(keys, monthKey),
    },
  });
}
