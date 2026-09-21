import { describe, expect, test } from "vitest";
import {
  masteryView,
  masteryHint,
  pickUnitStat,
  bumpUnit,
  type UnitStat,
} from "@/lib/unit-mastery";

describe("masteryView", () => {
  test("未挑戦は 0・未制覇", () => {
    const v = masteryView(undefined);
    expect(v).toEqual({
      attempts: 0,
      correct: 0,
      rate: 0,
      percent: 0,
      mastered: false,
    });
  });

  test("5問中4問正解（80%・5問）は制覇", () => {
    const v = masteryView({ attempts: 5, correct: 4 });
    expect(v.percent).toBe(80);
    expect(v.mastered).toBe(true);
  });

  test("ちょうど 0.7・5問 は制覇（境界）", () => {
    // 7/10 = 0.7
    expect(masteryView({ attempts: 10, correct: 7 }).mastered).toBe(true);
  });

  test("正答率は高いが問題数不足（4/4）は未制覇", () => {
    const v = masteryView({ attempts: 4, correct: 4 });
    expect(v.percent).toBe(100);
    expect(v.mastered).toBe(false);
  });

  test("問題数は足りるが正答率不足（3/5=60%）は未制覇", () => {
    expect(masteryView({ attempts: 5, correct: 3 }).mastered).toBe(false);
  });
});

describe("masteryHint", () => {
  test("制覇済みは空", () => {
    expect(masteryHint(masteryView({ attempts: 5, correct: 5 }))).toBe("");
  });
  test("未挑戦は空", () => {
    expect(masteryHint(masteryView({ attempts: 0, correct: 0 }))).toBe("");
  });
  test("問題数不足はあと何問", () => {
    expect(masteryHint(masteryView({ attempts: 2, correct: 2 }))).toBe(
      "あと3問で制覇はんてい",
    );
  });
  test("正答率不足は正答率の案内", () => {
    expect(masteryHint(masteryView({ attempts: 8, correct: 4 }))).toBe(
      "制覇まで正答率70%",
    );
  });
});

describe("pickUnitStat", () => {
  const local: Record<string, UnitStat> = { u1: { attempts: 2, correct: 1 } };
  test("サーバーにある単元はサーバー優先", () => {
    const server = { u1: { attempts: 10, correct: 9 } };
    expect(pickUnitStat("u1", local, server)).toEqual({
      attempts: 10,
      correct: 9,
    });
  });
  test("サーバーに無ければローカル", () => {
    expect(pickUnitStat("u1", local, { u2: { attempts: 1, correct: 0 } })).toEqual(
      { attempts: 2, correct: 1 },
    );
  });
  test("どちらにも無ければ空", () => {
    expect(pickUnitStat("zzz", local, null)).toEqual({
      attempts: 0,
      correct: 0,
    });
  });
});

describe("bumpUnit", () => {
  test("正解は attempts と correct を +1（元を破壊しない）", () => {
    const before: Record<string, UnitStat> = { u1: { attempts: 2, correct: 1 } };
    const after = bumpUnit(before, "u1", true);
    expect(after.u1).toEqual({ attempts: 3, correct: 2 });
    expect(before.u1).toEqual({ attempts: 2, correct: 1 });
  });
  test("不正解は attempts のみ +1", () => {
    expect(bumpUnit({}, "new", false).new).toEqual({ attempts: 1, correct: 0 });
  });
});
