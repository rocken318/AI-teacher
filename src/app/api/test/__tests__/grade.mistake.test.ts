import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeToken } from "@/lib/math/token";
import { encodeQuizToken } from "@/lib/quiz/token";
import { getQuizUnit } from "@/lib/quiz";

/**
 * /api/test/grade のまちがい記録テスト。
 * - 不正解・unknown のとき logMistake が呼ばれることを確認。
 * - 重複は入らない（Store の addMistake が防ぐ）。
 */

const MATH_UNIT = "div-basic";
const QUIZ_UNIT = "sci-4-electricity";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-tg-mist-"));
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

function makeReq(payload: unknown): Request {
  return new Request("http://localhost/api/test/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

test("math 不正解でまちがい記録、unknown:true でも記録", async () => {
  const { POST } = await import("../grade/route");
  const token = encodeToken({ unitId: MATH_UNIT, answer: "4", prompt: "2+2", meta: {} });
  const answers = [
    // 不正解
    { unitId: MATH_UNIT, answerToken: token, userInput: "99" },
    // unknown
    { unitId: MATH_UNIT, answerToken: token, userInput: "", unknown: true },
    // 正解（記録しない）
    { unitId: MATH_UNIT, answerToken: token, userInput: "4" },
    // 正解
    { unitId: MATH_UNIT, answerToken: token, userInput: "4" },
    // 正解
    { unitId: MATH_UNIT, answerToken: token, userInput: "4" },
  ];
  const res = await POST(
    makeReq({ subject: "math", unitIds: [MATH_UNIT], childId: "tc1", answers }) as never,
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.items[0].correct).toBe(false);
  expect(body.items[1].correct).toBe(false); // unknown → false
  expect(body.items[2].correct).toBe(true);

  const { getStore } = await import("@/lib/db");
  // 不正解 2件だが同じ problem JSON → 重複防止で 1件のみ。
  expect(await getStore().countMistakes("tc1")).toBe(1);
});

test("quiz unknown:true でまちがい記録", async () => {
  const unit = getQuizUnit(QUIZ_UNIT);
  if (!unit || unit.items.length < 5) throw new Error("fixture missing");
  const { POST } = await import("../grade/route");
  const answers = unit.items.slice(0, 5).map((item, i) => ({
    unitId: QUIZ_UNIT,
    itemId: item.id,
    token: encodeQuizToken({ unitId: QUIZ_UNIT, itemId: item.id, answerIndex: item.answerIndex }),
    choiceIndex: item.answerIndex, // correct
    // first two unknown
    unknown: i < 2 ? true : undefined,
  }));
  const res = await POST(
    makeReq({ subject: "science", unitIds: [QUIZ_UNIT], childId: "tc2", answers }) as never,
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.items[0].correct).toBe(false); // unknown
  expect(body.items[1].correct).toBe(false); // unknown
  expect(body.items[2].correct).toBe(true);

  const { getStore } = await import("@/lib/db");
  expect(await getStore().countMistakes("tc2")).toBe(2);
});
