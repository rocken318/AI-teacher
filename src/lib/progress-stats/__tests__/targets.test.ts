// src/lib/progress-stats/__tests__/targets.test.ts
import { expect, test } from "vitest";
import { stageTargetUnits } from "@/lib/progress-stats/targets";
import { STAGE_GRADES } from "@/lib/stage";
import { subjectPool, TEST_SUBJECTS } from "@/lib/test/pool";

test("小学生の対象単元は 各教科×小4-6 の subjectPool の和（重複なし）", () => {
  const t = stageTargetUnits("elementary");
  // 期待値を実データから独立に再計算して照合する
  const expected: Record<string, string[]> = {};
  let expectedTotal = 0;
  for (const s of TEST_SUBJECTS) {
    const set = new Set<string>();
    for (const g of STAGE_GRADES.elementary) {
      for (const u of subjectPool(s, g)) set.add(u);
    }
    expected[s] = [...set];
    expectedTotal += set.size;
  }
  for (const s of TEST_SUBJECTS) {
    expect(new Set(t.bySubject[s])).toEqual(new Set(expected[s]));
  }
  expect(t.total).toBe(expectedTotal);
  expect(t.total).toBeGreaterThan(0); // 小学生は単元が存在する
});

test("bySubject は全 TEST_SUBJECTS のキーを持ち、total は各教科の和", () => {
  const t = stageTargetUnits("junior");
  expect(Object.keys(t.bySubject).sort()).toEqual([...TEST_SUBJECTS].sort());
  const sum = Object.values(t.bySubject).reduce((n, arr) => n + arr.length, 0);
  expect(t.total).toBe(sum);
});
