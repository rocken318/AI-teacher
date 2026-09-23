import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { QUIZ_UNITS } from "@/lib/quiz";
import { encodeQuizToken } from "@/lib/quiz/token";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-flag-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  delete process.env.SQLITE_PATH;
  vi.resetModules();
});

async function post(body: unknown) {
  const { NextRequest } = await import("next/server");
  const { POST } = await import("../flag/route");
  return POST(
    new NextRequest("http://localhost/api/review/flag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

test("怪しい: 正解でもトークンから まちがいノートに追加（二重押しは重複なし）", async () => {
  const { getStore } = await import("@/lib/db");
  const u = QUIZ_UNITS.find((x) => x.items.length > 0)!;
  const item = u.items[0];
  const token = encodeQuizToken({ unitId: u.id, itemId: item.id, answerIndex: item.answerIndex });

  const res = await post({ token, childId: "c1" });
  expect(res.status).toBe(200);
  expect((await res.json()).ok).toBe(true);
  expect(await getStore().countMistakes("c1")).toBe(1);

  // 二重押し（同じ問題）→ 重複追加なし
  await post({ token, childId: "c1" });
  expect(await getStore().countMistakes("c1")).toBe(1);

  // 追加された1件は quiz で、その item
  const [m] = await getStore().listMistakes("c1", 10);
  expect(m.kind).toBe("quiz");
  expect(m.unitId).toBe(u.id);
  expect(m.itemId).toBe(item.id);
});

test("token/childId 欠如は 400", async () => {
  expect((await post({ childId: "c1" })).status).toBe(400);
  expect((await post({ token: "x" })).status).toBe(400);
});

test("不正トークンは 400（まちがいは増えない）", async () => {
  const { getStore } = await import("@/lib/db");
  const res = await post({ token: "not-a-real-token", childId: "c1" });
  expect(res.status).toBe(400);
  expect(await getStore().countMistakes("c1")).toBe(0);
});
