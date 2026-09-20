// src/lib/progress-stats/__tests__/stats.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord } from "@/lib/progress-stats/types";
import {
  aggregateByUnit,
  isMastered,
  levelForTotal,
  dateKeysOf,
  totalLearningDays,
  daysInMonth,
  currentStreak,
} from "@/lib/progress-stats/stats";

function at(unitId: string, correct: boolean, iso: string): AttemptRecord {
  return { subject: "math", unitId, correct, createdAtMs: Date.parse(iso) };
}

test("aggregateByUnit は単元ごとに試行数・正答数を集計", () => {
  const recs = [
    at("u1", true, "2026-09-20T01:00:00Z"),
    at("u1", false, "2026-09-20T02:00:00Z"),
    at("u2", true, "2026-09-20T03:00:00Z"),
  ];
  const agg = aggregateByUnit(recs);
  const u1 = agg.find((a) => a.unitId === "u1")!;
  expect(u1.attempts).toBe(2);
  expect(u1.correct).toBe(1);
});

test("制覇=累計正答率≥0.7 かつ 累計≥5問", () => {
  expect(isMastered({ subject: "s", unitId: "u", attempts: 5, correct: 4 })).toBe(true); // 0.8
  expect(isMastered({ subject: "s", unitId: "u", attempts: 5, correct: 3 })).toBe(false); // 0.6
  expect(isMastered({ subject: "s", unitId: "u", attempts: 4, correct: 4 })).toBe(false); // 4問=不足
  expect(isMastered({ subject: "s", unitId: "u", attempts: 10, correct: 7 })).toBe(true); // 0.7 ちょうど
});

test("レベルは floor(sqrt(total/10))+1、境界と残りが整合", () => {
  expect(levelForTotal(0)).toEqual({ level: 1, current: 0, span: 10, toNext: 10 });
  expect(levelForTotal(10)).toEqual({ level: 2, current: 0, span: 30, toNext: 30 });
  expect(levelForTotal(15).level).toBe(2);
  expect(levelForTotal(40)).toEqual({ level: 3, current: 0, span: 50, toNext: 50 });
});

test("学習日集合・のべ日数・今月日数", () => {
  const recs = [
    at("u", true, "2026-09-20T01:00:00Z"),
    at("u", true, "2026-09-20T05:00:00Z"), // 同日
    at("u", true, "2026-09-19T05:00:00Z"),
    at("u", true, "2026-08-31T05:00:00Z"),
  ];
  const keys = dateKeysOf(recs);
  expect(keys).toEqual(["2026-08-31", "2026-09-19", "2026-09-20"]);
  expect(totalLearningDays(keys)).toBe(3);
  expect(daysInMonth(keys, "2026-09")).toBe(2);
});

test("連続日数: 今日を含む連続を数える", () => {
  const keys = ["2026-09-18", "2026-09-19", "2026-09-20"];
  expect(currentStreak(keys, "2026-09-20")).toBe(3);
});

test("連続日数: 今日未学習でも前日まで連続なら継続（1日の猶予）", () => {
  const keys = ["2026-09-18", "2026-09-19"];
  expect(currentStreak(keys, "2026-09-20")).toBe(2);
});

test("連続日数: 2日以上空いていれば 0", () => {
  const keys = ["2026-09-17"];
  expect(currentStreak(keys, "2026-09-20")).toBe(0);
});
