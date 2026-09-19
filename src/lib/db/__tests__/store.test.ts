import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-db-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

test("test_results を保存して同一 test_key の履歴を新しい順で取得できる", async () => {
  const { getStore } = await import("@/lib/db");
  const store = getStore();

  await store.recordTestResult({
    id: "r1", childId: "c1", subject: "math",
    unitIds: "dec-mul,div-basic", testKey: "math|dec-mul,div-basic",
    total: 10, score: 6,
  });
  await store.recordTestResult({
    id: "r2", childId: "c1", subject: "math",
    unitIds: "dec-mul,div-basic", testKey: "math|dec-mul,div-basic",
    total: 10, score: 8,
  });
  await store.recordTestResult({
    id: "r3", childId: "c1", subject: "math",
    unitIds: "percent", testKey: "math|percent",
    total: 5, score: 5,
  });

  const hist = await store.getTestHistory("c1", "math|dec-mul,div-basic", 50);
  expect(hist.map((h) => h.id)).toEqual(["r2", "r1"]);
  expect(hist[0].score).toBe(8);
  expect(hist[0].total).toBe(10);
});

test("attempts に source='test' を保存できる", async () => {
  const { getStore } = await import("@/lib/db");
  const store = getStore();
  await store.recordAttempt("a1", "c1", "math", "div-basic", true, "test");
  const prog = await store.getChildProgress("c1");
  expect(prog.total).toBe(1);
  expect(prog.correct).toBe(1);
});
