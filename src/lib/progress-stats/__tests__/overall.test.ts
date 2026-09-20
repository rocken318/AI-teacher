// src/lib/progress-stats/__tests__/overall.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord } from "@/lib/progress-stats/types";
import { overallStats } from "@/lib/progress-stats/overall";
import { stageTargetUnits } from "@/lib/progress-stats/targets";

/** ある教科の対象単元を1つ取り、その単元を n 回・全問正解で埋める。 */
function masterUnit(subject: string, unitId: string, n: number): AttemptRecord[] {
  return Array.from({ length: n }, (_, i) => ({
    subject,
    unitId,
    correct: true,
    createdAtMs: Date.parse("2026-09-20T01:00:00Z") + i * 1000,
  }));
}

test("制覇0のとき全体%は0・のべ0・レベル1", () => {
  const r = overallStats([], "elementary");
  expect(r.overall.masteredUnits).toBe(0);
  expect(r.overall.percent).toBe(0);
  expect(r.totalAttempts).toBe(0);
  expect(r.level.level).toBe(1);
  expect(r.overall.targetUnits).toBe(stageTargetUnits("elementary").total);
});

test("対象単元を1つ制覇すると全体・教科の分子が1増える", () => {
  const t = stageTargetUnits("elementary");
  // math の対象単元を1つ選ぶ
  const unitId = t.bySubject["math"][0];
  const recs = masterUnit("math", unitId, 5); // 5問全正解=制覇
  const r = overallStats(recs, "elementary");
  expect(r.overall.masteredUnits).toBe(1);
  expect(r.bySubject["math"].masteredUnits).toBe(1);
  expect(r.bySubject["math"].targetUnits).toBe(t.bySubject["math"].length);
  expect(r.totalAttempts).toBe(5);
  expect(r.totalCorrect).toBe(5);
  // 全体% = 1 / total（丸めは百分率整数）
  expect(r.overall.percent).toBe(Math.round((1 / t.total) * 100));
});

test("対象外の単元を制覇しても分子には数えない（total 攻撃防止）", () => {
  const recs = masterUnit("math", "not-a-real-unit-xyz", 5);
  const r = overallStats(recs, "elementary");
  expect(r.overall.masteredUnits).toBe(0);
  expect(r.totalAttempts).toBe(5); // のべには数える
});
