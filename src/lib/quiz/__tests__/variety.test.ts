import { expect, test } from "vitest";
import { pickQuestionExcluding, getQuizUnit } from "@/lib/quiz";

/**
 * 練習の「重複なし出題」: 単元の全問を出し切るまで既出を避け、
 * 出し切ったら reset=true で再シャッフル開始する。
 */
test("pickQuestionExcluding は既出を避け、全問出し切るまで重複しない", () => {
  const unitId = "j2h-edo-politics"; // 旧単元・6問（id q1..q6）
  const unit = getQuizUnit(unitId)!;
  const n = unit.items.length;
  expect(n).toBeGreaterThan(1);

  const seen: string[] = [];
  for (let i = 0; i < n; i++) {
    const q = pickQuestionExcluding(unitId, seen);
    expect(q, `${i}問目`).not.toBeNull();
    expect(q!.reset, `${i}問目 reset`).toBe(false);
    expect(seen, `${i}問目 未出題から出る`).not.toContain(q!.itemId);
    seen.push(q!.itemId);
  }
  // n問すべてが distinct
  expect(new Set(seen).size).toBe(n);

  // 全部出たあと → reset=true で再開（全問から選び直す）
  const again = pickQuestionExcluding(unitId, seen);
  expect(again).not.toBeNull();
  expect(again!.reset).toBe(true);
});

test("pickQuestionExcluding: 未知単元は null", () => {
  expect(pickQuestionExcluding("nope-unit", [])).toBeNull();
});

test("pickQuestionExcluding: seen 空なら全問から1問（reset=false）", () => {
  const q = pickQuestionExcluding("j2h-edo-politics", []);
  expect(q).not.toBeNull();
  expect(q!.reset).toBe(false);
  expect(q!.choices.length).toBeGreaterThan(1);
});
