import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-acct-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("account を作成し email/id で取得できる", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("a1", "parent@example.com", "hash1");
  const byEmail = await s.getAccountByEmail("parent@example.com");
  expect(byEmail?.id).toBe("a1");
  expect(byEmail?.passwordHash).toBe("hash1");
  const byId = await s.getAccountById("a1");
  expect(byId?.email).toBe("parent@example.com");
  expect(await s.getAccountByEmail("nope@example.com")).toBeNull();
});

test("children を作成し account ごとに一覧・id取得できる", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("a1", "p@example.com", "h");
  await s.createChild("c1", "a1", "はると", "junior");
  await s.createChild("c2", "a1", "さくら", "elementary");
  const list = await s.listChildren("a1");
  expect(list.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
  expect((await s.getChild("c1"))?.name).toBe("はると");
  expect(await s.listChildren("other")).toEqual([]);
});
