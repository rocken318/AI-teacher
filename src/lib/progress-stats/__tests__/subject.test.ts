// src/lib/progress-stats/__tests__/subject.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord } from "@/lib/progress-stats/types";
import { subjectStats, unitTrend } from "@/lib/progress-stats/subject";
import { stageTargetUnits } from "@/lib/progress-stats/targets";

function recs(
  subject: string,
  unitId: string,
  pattern: boolean[],
): AttemptRecord[] {
  const base = Date.parse("2026-09-20T00:00:00Z");
  return pattern.map((correct, i) => ({
    subject,
    unitId,
    correct,
    createdAtMs: base + i * 60_000,
  }));
}

test("subjectStats は対象単元をすべて列挙し、未挑戦も0で含む", () => {
  const t = stageTargetUnits("elementary");
  const subject = "math";
  const unitId = t.bySubject[subject][0];
  const r = subjectStats(recs(subject, unitId, [true, true, true, true, true]), subject, "elementary");
  expect(r.targetUnits).toBe(t.bySubject[subject].length);
  expect(r.units.length).toBe(t.bySubject[subject].length);
  const first = r.units.find((u) => u.unitId === unitId)!;
  expect(first.attempts).toBe(5);
  expect(first.rate).toBe(1);
  expect(first.mastered).toBe(true);
  // 触っていない単元は 0 試行で含まれる
  const untouched = r.units.find((u) => u.attempts === 0);
  expect(untouched).toBeTruthy();
});

test("unitTrend は時系列を最大5区間に等分した正答率＋方向", () => {
  // 前半×→後半○ で上昇
  const pattern = [false, false, false, false, false, true, true, true, true, true];
  const trend = unitTrend(recs("math", "u", pattern));
  expect(trend.spark.length).toBe(5);
  expect(trend.spark[0]).toBe(0);
  expect(trend.spark[4]).toBe(1);
  expect(trend.direction).toBe("up");
});

test("unitTrend は試行が少なくても壊れない", () => {
  const trend = unitTrend(recs("math", "u", [true]));
  expect(trend.spark.length).toBeGreaterThan(0);
  expect(trend.direction).toBe("flat");
});

test("unitTrend は下降パターンで direction:down", () => {
  const pattern = [true, true, true, true, true, false, false, false, false, false];
  const trend = unitTrend(recs("math", "u", pattern));
  expect(trend.spark[0]).toBe(1);
  expect(trend.spark[4]).toBe(0);
  expect(trend.direction).toBe("down");
});

test("subjectStats は他教科の記録を数えない（教科間分離）", () => {
  const t = stageTargetUnits("elementary");
  const mathUnit = t.bySubject["math"][0];
  // science 教科の記録を、たまたま同じ unitId 文字列で与えても math には混ざらない
  const foreign = recs("science", mathUnit, [true, true, true, true, true]);
  const r = subjectStats(foreign, "math", "elementary");
  const row = r.units.find((u) => u.unitId === mathUnit)!;
  expect(row.attempts).toBe(0);
  expect(r.masteredUnits).toBe(0);
});
