import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { QUIZ_UNITS } from "@/lib/quiz";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-rev-"));
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

test("list/next/remove が動く（quiz）", async () => {
  const { getStore } = await import("@/lib/db");
  const u = QUIZ_UNITS.find((x) => x.items.length > 0)!;
  await getStore().addMistake({
    id: "m1",
    childId: "c1",
    subject: u.subject,
    unitId: u.id,
    kind: "quiz",
    itemId: u.items[0].id,
    problem: null,
  });

  const { NextRequest } = await import("next/server");

  // list → count 1
  const listRoute = await import("../list/route");
  const listRes = await listRoute.GET(
    new NextRequest(`http://localhost/api/review/list?childId=c1`),
  );
  expect(listRes.status).toBe(200);
  const listBody = await listRes.json();
  expect(listBody.count).toBe(1);
  expect(listBody.mistakes).toHaveLength(1);
  expect(listBody.mistakes[0].kind).toBe("quiz");
  expect(typeof listBody.mistakes[0].preview).toBe("string");

  // next → kind quiz, has choices, NO answerIndex
  const nextRoute = await import("../next/route");
  const nextRes = await nextRoute.GET(
    new NextRequest(`http://localhost/api/review/next?childId=c1`),
  );
  expect(nextRes.status).toBe(200);
  const nb = await nextRes.json();
  expect(nb.kind).toBe("quiz");
  expect(Array.isArray(nb.choices)).toBe(true);
  expect(nb.choices.length).toBeGreaterThan(0);
  expect(nb.answerIndex).toBeUndefined(); // 答え非露出
  expect(typeof nb.token).toBe("string"); // 採点用トークンあり
  expect(nb.mistakeId).toBe("m1");

  // remove → ok, count 0
  const removeRoute = await import("../remove/route");
  const rmRes = await removeRoute.POST(
    new NextRequest(`http://localhost/api/review/remove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId: "c1", mistakeId: "m1" }),
    }),
  );
  expect(rmRes.status).toBe(200);
  const rmBody = await rmRes.json();
  expect(rmBody.ok).toBe(true);
  expect(await getStore().countMistakes("c1")).toBe(0);
});

test("まちがいなしのとき next は done:true", async () => {
  const { NextRequest } = await import("next/server");
  const nextRoute = await import("../next/route");
  const res = await nextRoute.GET(
    new NextRequest(`http://localhost/api/review/next?childId=no-one`),
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.done).toBe(true);
});

test("list は childId なしで 400", async () => {
  const { NextRequest } = await import("next/server");
  const listRoute = await import("../list/route");
  const res = await listRoute.GET(
    new NextRequest(`http://localhost/api/review/list`),
  );
  expect(res.status).toBe(400);
});

test("math まちがいの next は prompt と answerToken を返す（answer 非露出）", async () => {
  const { getStore } = await import("@/lib/db");
  const problemJson = JSON.stringify({ prompt: "2+2", answer: "4", answerType: "integer", meta: {} });
  await getStore().addMistake({
    id: "m2",
    childId: "c2",
    subject: "math",
    unitId: "div-basic",
    kind: "math",
    itemId: null,
    problem: problemJson,
  });

  const { NextRequest } = await import("next/server");
  const nextRoute = await import("../next/route");
  const res = await nextRoute.GET(
    new NextRequest(`http://localhost/api/review/next?childId=c2`),
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.kind).toBe("math");
  expect(body.prompt).toBe("2+2");
  expect(typeof body.answerToken).toBe("string");
  expect(body.answer).toBeUndefined(); // 答え非露出
  expect(body.mistakeId).toBe("m2");
});
