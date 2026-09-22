// src/app/api/progress/__tests__/daily.route.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-pdaily-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

async function reqFor(childId: string, token: string | null, days?: number) {
  const { NextRequest } = await import("next/server");
  const { SESSION_COOKIE } = await import("@/lib/auth/session");
  const headers: Record<string, string> = {};
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  const q = days ? `&days=${days}` : "";
  return new NextRequest(
    `http://localhost/api/progress/daily?childId=${childId}${q}`,
    { headers },
  );
}

test("未ログインは 401", async () => {
  const { GET } = await import("../daily/route");
  const res = await GET(await reqFor("kid", null));
  expect(res.status).toBe(401);
});

test("childId 無しは 400", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  const token = signSession("acc-me", SESSION_TTL_MS);
  const { NextRequest } = await import("next/server");
  const { SESSION_COOKIE } = await import("@/lib/auth/session");
  const req = new NextRequest("http://localhost/api/progress/daily", {
    headers: { cookie: `${SESSION_COOKIE}=${token}` },
  });
  const { GET } = await import("../daily/route");
  expect((await GET(req)).status).toBe(400);
});

test("他人の子は 403", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  await s.createAccount("acc-other", "other@example.com", "h");
  await s.createChild("kid-other", "acc-other", "こ", "elementary");
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  const token = signSession("acc-me", SESSION_TTL_MS);
  const { GET } = await import("../daily/route");
  const res = await GET(await reqFor("kid-other", token));
  expect(res.status).toBe(403);
});

test("自分の子は 200・今日解いた分が末日の count と streak に入る", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  await s.createChild("kid", "acc-me", "こ", "elementary");
  await s.recordAttempt("x0", "kid", "math", "div-basic", true, "practice");
  await s.recordAttempt("x1", "kid", "math", "div-basic", false, "practice");
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  const token = signSession("acc-me", SESSION_TTL_MS);

  const { GET } = await import("../daily/route");
  const res = await GET(await reqFor("kid", token, 30));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.days).toHaveLength(30);
  expect(body.days[29].count).toBe(2); // 今日
  expect(body.activeDays).toBe(1);
  expect(body.maxCount).toBe(2);
  expect(body.streak.current).toBe(1);
  expect(body.streak.thisMonth).toBe(1);
});
