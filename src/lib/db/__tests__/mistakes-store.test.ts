import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-mist-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("addMistake は追加し、重複は入れない（quiz=item, math=problem）", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.addMistake({ id: "m1", childId: "c1", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.addMistake({ id: "m2", childId: "c1", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null }); // 重複
  await s.addMistake({ id: "m3", childId: "c1", subject: "math", unitId: "div-basic", kind: "math", itemId: null, problem: '{"prompt":"1+1","answer":"2"}' });
  await s.addMistake({ id: "m4", childId: "c1", subject: "math", unitId: "div-basic", kind: "math", itemId: null, problem: '{"prompt":"1+1","answer":"2"}' }); // 重複
  expect(await s.countMistakes("c1")).toBe(2);
  const list = await s.listMistakes("c1", 50);
  expect(list.map((m) => m.unitId).sort()).toEqual(["div-basic", "u1"]);
});

test("removeMistake は自分の分だけ消す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.addMistake({ id: "m1", childId: "c1", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.addMistake({ id: "m2", childId: "other", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.removeMistake("c1", "m1");
  expect(await s.countMistakes("c1")).toBe(0);
  expect(await s.countMistakes("other")).toBe(1);
  await s.removeMistake("c1", "m2"); // 他人の分は消えない
  expect(await s.countMistakes("other")).toBe(1);
});
