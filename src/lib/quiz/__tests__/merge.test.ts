import { expect, test } from "vitest";
import { mergeUnitsById } from "@/lib/quiz";
import type { QuizItem, QuizUnit } from "@/lib/quiz";

function item(id: string): QuizItem {
  return { id, question: `q${id}`, choices: ["a", "b"], answerIndex: 0, explanation: "e" };
}
function unit(id: string, itemIds: string[]): QuizUnit {
  return {
    id,
    subject: "history",
    grade: "中2",
    title: `t${id}`,
    lesson: "l",
    items: itemIds.map(item),
  };
}

test("同一idの単元は items を連結して合体（メタは最初の定義）", () => {
  const merged = mergeUnitsById([
    unit("u1", ["a", "b"]),
    unit("u2", ["x"]),
    unit("u1", ["c", "d"]), // 追加ファイル相当
  ]);
  expect(merged.length).toBe(2); // u1, u2
  const u1 = merged.find((u) => u.id === "u1")!;
  expect(u1.items.map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
  expect(u1.title).toBe("tu1"); // 最初の定義のメタ
});

test("連結時に item id の重複は除く（単元内で一意を保つ）", () => {
  const merged = mergeUnitsById([
    unit("u1", ["a", "b"]),
    unit("u1", ["b", "c"]), // b は重複 → 無視
  ]);
  const u1 = merged[0];
  expect(u1.items.map((i) => i.id)).toEqual(["a", "b", "c"]);
});

test("重複なしなら順序と内容を保つ", () => {
  const merged = mergeUnitsById([unit("u1", ["a"]), unit("u2", ["b"])]);
  expect(merged.map((u) => u.id)).toEqual(["u1", "u2"]);
});
