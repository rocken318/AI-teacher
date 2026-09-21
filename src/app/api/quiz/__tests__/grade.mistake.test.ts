// src/app/api/quiz/__tests__/grade.mistake.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeQuizToken } from "@/lib/quiz/token";
import { QUIZ_UNITS } from "@/lib/quiz";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-qmist-"));
  delete process.env.DATABASE_URL; delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function req(payload: unknown) {
  return new Request("http://localhost/api/quiz/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
// 実在の unit/item を1つ使う。
function firstItem() {
  const u = QUIZ_UNITS.find((x) => x.items.length > 0)!;
  return { unitId: u.id, item: u.items[0] };
}

test("わからない(unknown)は correct:false で記録し、answerIndex/explanation を返す", async () => {
  const { unitId, item } = firstItem();
  const token = encodeQuizToken({ unitId, itemId: item.id, answerIndex: item.answerIndex });
  const { POST } = await import("../grade/route");
  const res = await POST(req({ token, choiceIndex: -1, unknown: true, childId: "c1" }) as never);
  const body = await res.json();
  expect(body.correct).toBe(false);
  expect(typeof body.answerIndex).toBe("number");
  const { getStore } = await import("@/lib/db");
  expect(await getStore().countMistakes("c1")).toBe(1);
});
