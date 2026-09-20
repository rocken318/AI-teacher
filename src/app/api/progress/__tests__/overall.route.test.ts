// src/app/api/progress/__tests__/overall.route.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-poverall-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET; // 既定鍵で署名/検証が閉じる
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** session cookie 付き NextRequest を作る。 */
async function reqFor(childId: string, token: string | null) {
  const { NextRequest } = await import("next/server");
  const { SESSION_COOKIE } = await import("@/lib/auth/session");
  const headers: Record<string, string> = {};
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  return new NextRequest(
    `http://localhost/api/progress/overall?childId=${childId}`,
    { headers },
  );
}

test("未ログインは 401", async () => {
  const { GET } = await import("../overall/route");
  const res = await GET(await reqFor("c1", null));
  expect(res.status).toBe(401);
});

test("他人の子は 403", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  await s.createAccount("acc-other", "other@example.com", "h");
  await s.createChild("kid-other", "acc-other", "こ", "elementary");
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  const token = signSession("acc-me", SESSION_TTL_MS);

  const { GET } = await import("../overall/route");
  const res = await GET(await reqFor("kid-other", token));
  expect(res.status).toBe(403);
});

test("自分の子は 200 で全体集計を返す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  await s.createChild("kid", "acc-me", "こ", "elementary");
  for (let i = 0; i < 5; i++) {
    await s.recordAttempt(`x${i}`, "kid", "math", "div-basic", true, "practice");
  }
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  const token = signSession("acc-me", SESSION_TTL_MS);

  const { GET } = await import("../overall/route");
  const res = await GET(await reqFor("kid", token));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.totalAttempts).toBe(5);
  expect(body.overall.targetUnits).toBeGreaterThan(0);
  expect(body.level.level).toBeGreaterThanOrEqual(1);
});
