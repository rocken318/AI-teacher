// src/app/api/progress/__tests__/subject.route.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-psubject-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

async function reqFor(childId: string, subject: string, token: string | null) {
  const { NextRequest } = await import("next/server");
  const { SESSION_COOKIE } = await import("@/lib/auth/session");
  const headers: Record<string, string> = {};
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  return new NextRequest(
    `http://localhost/api/progress/subject?childId=${childId}&subject=${subject}`,
    { headers },
  );
}

async function seedMe() {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  await s.createChild("kid", "acc-me", "こ", "elementary");
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  return signSession("acc-me", SESSION_TTL_MS);
}

test("未ログインは 401", async () => {
  const { GET } = await import("../subject/route");
  const res = await GET(await reqFor("kid", "math", null));
  expect(res.status).toBe(401);
});

test("不正な subject は 400", async () => {
  const token = await seedMe();
  const { GET } = await import("../subject/route");
  const res = await GET(await reqFor("kid", "not-a-subject", token));
  expect(res.status).toBe(400);
});

test("自分の子・妥当な教科は 200 で単元一覧を返す", async () => {
  const token = await seedMe();
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  for (let i = 0; i < 5; i++) {
    await s.recordAttempt(`x${i}`, "kid", "math", "div-basic", true, "practice");
  }
  const { GET } = await import("../subject/route");
  const res = await GET(await reqFor("kid", "math", token));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.subject).toBe("math");
  expect(Array.isArray(body.units)).toBe(true);
  expect(body.units.length).toBeGreaterThan(0);
});
