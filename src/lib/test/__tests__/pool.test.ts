import { expect, test } from "vitest";
import {
  TEST_SUBJECTS,
  isTestSubject,
  subjectKind,
  subjectPool,
  isValidUnit,
} from "../pool";

test("TEST_SUBJECTS に全教科が含まれる", () => {
  expect(TEST_SUBJECTS).toEqual([
    "math",
    "science",
    "social",
    "history",
    "geography",
    "japanese",
    "english",
  ]);
  expect(isTestSubject("math")).toBe(true);
  expect(isTestSubject("science")).toBe(true);
  expect(isTestSubject("social")).toBe(true);
  expect(isTestSubject("unknown")).toBe(false);
});

test("subjectKind は math のみ math、他は quiz", () => {
  expect(subjectKind("math")).toBe("math");
  expect(subjectKind("science")).toBe("quiz");
  expect(subjectKind("history")).toBe("quiz");
  expect(subjectKind("english")).toBe("quiz");
});

test("subjectPool(math, 学年) は算数単元id、該当なしは空", () => {
  const pool = subjectPool("math", "小4");
  expect(pool.length).toBeGreaterThan(0);
  // すべて実在の算数単元。
  for (const id of pool) expect(isValidUnit("math", id)).toBe(true);
  // 存在しない学年は空。
  expect(subjectPool("math", "存在しない学年")).toEqual([]);
});

test("subjectPool(science, 小4) はクイズ単元id、該当なしは空", () => {
  const pool = subjectPool("science", "小4");
  expect(pool.length).toBeGreaterThan(0);
  expect(pool).toContain("sci-4-electricity");
  for (const id of pool) expect(isValidUnit("science", id)).toBe(true);
  expect(subjectPool("science", "存在しない学年")).toEqual([]);
});

test("isValidUnit は教科一致まで確認する", () => {
  // math 単元は math では真、science では偽。
  const mathPool = subjectPool("math", "小4");
  const mathUnit = mathPool[0];
  expect(isValidUnit("math", mathUnit)).toBe(true);
  expect(isValidUnit("science", mathUnit)).toBe(false);

  // science 単元は science では真、他教科(history)では偽。
  expect(isValidUnit("science", "sci-4-electricity")).toBe(true);
  expect(isValidUnit("history", "sci-4-electricity")).toBe(false);
  expect(isValidUnit("math", "sci-4-electricity")).toBe(false);

  // 完全に存在しない id は偽。
  expect(isValidUnit("math", "no-such-unit")).toBe(false);
  expect(isValidUnit("science", "no-such-unit")).toBe(false);
});
