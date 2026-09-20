// src/lib/progress-stats/__tests__/today.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord, TestRecord } from "@/lib/progress-stats/types";
import { todayStats } from "@/lib/progress-stats/today";

const TODAY = "2026-09-20";
// JST 2026-09-20 は UTC 2026-09-19T15:00 〜 2026-09-20T14:59
const inToday = Date.parse("2026-09-20T01:00:00Z"); // JST 10:00 当日
const yesterday = Date.parse("2026-09-19T10:00:00Z"); // JST 前日 19:00

function at(subject: string, correct: boolean, ms: number): AttemptRecord {
  return { subject, unitId: "u", correct, createdAtMs: ms };
}

test("todayStats は JST 今日の attempts のみ集計（教科別内訳つき）", () => {
  const recs = [
    at("math", true, inToday),
    at("math", false, inToday),
    at("science", true, inToday),
    at("math", true, yesterday), // 前日は除外
  ];
  const r = todayStats(recs, [], TODAY);
  expect(r.total).toBe(3);
  expect(r.correct).toBe(2);
  expect(r.bySubject["math"]).toEqual({ attempts: 2, correct: 1 });
  expect(r.bySubject["science"]).toEqual({ attempts: 1, correct: 1 });
});

test("todayStats は今日のテスト回数を数える", () => {
  const tests: TestRecord[] = [
    { subject: "math", testKey: "k", total: 5, score: 4, takenAtMs: inToday },
    { subject: "math", testKey: "k", total: 5, score: 5, takenAtMs: yesterday },
  ];
  const r = todayStats([], tests, TODAY);
  expect(r.testCount).toBe(1);
});

test("何もしていない日は total0・rate0", () => {
  const r = todayStats([], [], TODAY);
  expect(r.total).toBe(0);
  expect(r.rate).toBe(0);
  expect(r.testCount).toBe(0);
});
