import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-reassign-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("匿名idの attempts/test_results をプロフィールidへ付け替える", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.recordAttempt("a1", "anon", "math", "u1", true, "practice");
  await s.recordAttempt("a2", "anon", "math", "u1", false, "practice");
  await s.recordTestResult({ id: "r1", childId: "anon", subject: "math", unitIds: "u1", testKey: "math|u1", total: 5, score: 4 });

  await s.reassignChildData("anon", "prof-1");

  expect((await s.getChildProgress("anon")).total).toBe(0);
  const prog = await s.getChildProgress("prof-1");
  expect(prog.total).toBe(2);
  expect(prog.correct).toBe(1);
  const hist = await s.getTestHistory("prof-1", "math|u1", 50);
  expect(hist.length).toBe(1);
});

test("まちがいノートも付け替える（引き継ぎでノートが消えない）", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.addMistake({ id: "m1", childId: "anon", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.addMistake({ id: "m2", childId: "anon", subject: "math", unitId: "div-basic", kind: "math", itemId: null, problem: '{"prompt":"1+1","answer":"2"}' });

  await s.reassignChildData("anon", "prof-1");

  expect(await s.countMistakes("anon")).toBe(0);
  expect(await s.countMistakes("prof-1")).toBe(2);
});
