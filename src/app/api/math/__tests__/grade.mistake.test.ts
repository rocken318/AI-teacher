// src/app/api/math/__tests__/grade.mistake.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeToken } from "@/lib/math/token";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-mmist-"));
  delete process.env.DATABASE_URL; delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function req(payload: unknown) {
  return new Request("http://localhost/api/math/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}

test("わからない(unknown)は correct:false で記録し、expected は返す", async () => {
  const token = encodeToken({ unitId: "div-basic", answer: "2", prompt: "1+1", meta: {} });
  const { POST } = await import("../grade/route");
  const res = await POST(req({ unitId: "div-basic", answerToken: token, userInput: "", unknown: true, childId: "c1" }) as never);
  const body = await res.json();
  expect(body.correct).toBe(false);
  expect(body.expected).toBe("2");
});

test("不正解でまちがいが1件入り、同じ問題は重複しない", async () => {
  const token = encodeToken({ unitId: "div-basic", answer: "2", prompt: "1+1", meta: {} });
  const { POST } = await import("../grade/route");
  await POST(req({ unitId: "div-basic", answerToken: token, userInput: "9", childId: "c1" }) as never);
  await POST(req({ unitId: "div-basic", answerToken: token, userInput: "9", childId: "c1" }) as never);
  const { getStore } = await import("@/lib/db");
  expect(await getStore().countMistakes("c1")).toBe(1);
});
