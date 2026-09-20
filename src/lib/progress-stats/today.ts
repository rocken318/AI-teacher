// src/lib/progress-stats/today.ts
import type { AttemptRecord, TestRecord } from "./types";
import { toJstDateKey } from "./time";

/** 今日の頑張り一式。 */
export interface TodayStats {
  total: number;
  correct: number;
  rate: number; // 0..1
  bySubject: Record<string, { attempts: number; correct: number }>;
  testCount: number;
}

/**
 * JST 今日（todayKey="YYYY-MM-DD"）の attempts / tests を集計する。
 * todayKey は API 側で toJstDateKey(Date.now()) を渡す（テストは固定値）。
 */
export function todayStats(
  records: AttemptRecord[],
  tests: TestRecord[],
  todayKey: string,
): TodayStats {
  const today = records.filter((r) => toJstDateKey(r.createdAtMs) === todayKey);
  const bySubject: Record<string, { attempts: number; correct: number }> = {};
  let correct = 0;
  for (const r of today) {
    const cur = bySubject[r.subject] ?? { attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (r.correct) {
      cur.correct += 1;
      correct += 1;
    }
    bySubject[r.subject] = cur;
  }
  const total = today.length;
  const testCount = tests.filter(
    (t) => toJstDateKey(t.takenAtMs) === todayKey,
  ).length;
  return {
    total,
    correct,
    rate: total > 0 ? correct / total : 0,
    bySubject,
    testCount,
  };
}
