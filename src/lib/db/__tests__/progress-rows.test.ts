import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-prog-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("listAttempts は childId の attempts を UTC エポックms 付きで返す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.recordAttempt("a1", "c1", "math", "div-basic", true, "practice");
  await s.recordAttempt("a2", "c1", "science", "xb-1", false, "test");
  await s.recordAttempt("a3", "other", "math", "div-basic", true, "practice");

  const rows = await s.listAttempts("c1");
  expect(rows.length).toBe(2);
  const r0 = rows.find((r) => r.subject === "math")!;
  expect(r0.unitId).toBe("div-basic");
  expect(r0.correct).toBe(true);
  expect(typeof r0.createdAtMs).toBe("number");
  expect(r0.createdAtMs).toBeGreaterThan(0);
  // false 行が正しくラウンドトリップする
  const rSci = rows.find((r) => r.subject === "science")!;
  expect(rSci.correct).toBe(false);
  // 結果が時刻昇順になっている
  expect(rows[0].createdAtMs <= rows[1].createdAtMs).toBe(true);
  // 別 child のデータは混ざらない
  expect(rows.every((r) => r.subject !== undefined)).toBe(true);
});

test("listTestResults は childId のテスト結果を takenAtMs 付きで返す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.recordTestResult({
    id: "t1", childId: "c1", subject: "math",
    unitIds: "div-basic", testKey: "math|div-basic", total: 5, score: 4,
  });
  const rows = await s.listTestResults("c1");
  expect(rows.length).toBe(1);
  expect(rows[0].score).toBe(4);
  expect(typeof rows[0].takenAtMs).toBe("number");
  expect(await s.listTestResults("nobody")).toEqual([]);
});
