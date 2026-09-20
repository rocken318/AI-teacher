# アカウント認証コア（A1）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 家族アカウント（メール＋パスワード）と子プロフィールを作成・ログインできる認証コアを、Neon＋自前の軽量認証（scrypt＋署名Cookie）で動かす。

**Architecture:** 既存の Store 抽象（`src/lib/db/index.ts`, Postgres/Sqlite/Noop）に `accounts`/`children` テーブルと CRUD を足す。パスワードは scrypt ハッシュ（`src/lib/auth/password.ts`）、セッションは HMAC 署名の httpOnly Cookie（`src/lib/auth/session.ts`, ステートレス）。API は `/api/auth/{signup,login,logout}` と `/api/children`。**AI不使用。**

**Tech Stack:** Next.js 15 App Router / TypeScript / Vitest / node:crypto（scrypt・HMAC）/ 既存 Store 抽象。

**Scope:** A1＝認証コアのみ。アクティブ子プロフィールでの記録（A2）、集計・見える化（A3）、画面（A4）は後続プラン。

---

## File Structure

- `src/lib/db/index.ts`（変更）— `AccountRow`/`ChildRow` 型、Store に account/children メソッド、Postgres/Sqlite/Noop 実装＋テーブル作成。
- `src/lib/db/__tests__/accounts-store.test.ts`（新規）— SqliteStore で accounts/children CRUD 検証。
- `src/lib/auth/password.ts`（新規）— `hashPassword`/`verifyPassword`（scrypt）。
- `src/lib/auth/__tests__/password.test.ts`（新規）。
- `src/lib/auth/session.ts`（新規）— `signSession`/`verifySession`/`SESSION_COOKIE`/`sessionCookieOptions`。
- `src/lib/auth/__tests__/session.test.ts`（新規）。
- `src/lib/auth/accounts.ts`（新規・server-only）— Store をラップした薄い read/write ヘルパー＋`currentAccountId(req)`。
- `src/app/api/auth/signup/route.ts` / `login/route.ts` / `logout/route.ts`（新規）。
- `src/app/api/children/route.ts`（新規, GET/POST）。

---

## Task 1: DB — accounts / children テーブル＋Store メソッド

**Files:**
- Modify: `src/lib/db/index.ts`
- Test: `src/lib/db/__tests__/accounts-store.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/db/__tests__/accounts-store.test.ts`:

```ts
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
```

- [ ] **Step 2: Run and confirm FAIL**

Run: `npx vitest run src/lib/db/__tests__/accounts-store.test.ts`
Expected: FAIL（メソッド未定義）。

- [ ] **Step 3: Implement — 型・インターフェース・3実装**

`src/lib/db/index.ts`:

(3a) `ProgressSummary` 付近に型を追加:
```ts
export interface AccountRow {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}
export interface ChildRow {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  createdAt: string;
}
```

(3b) `Store` インターフェースに追加:
```ts
  /* --- アカウント / 子プロフィール --- */
  createAccount(id: string, email: string, passwordHash: string): Promise<void>;
  getAccountByEmail(email: string): Promise<AccountRow | null>;
  getAccountById(id: string): Promise<AccountRow | null>;
  createChild(id: string, accountId: string, name: string, stage: string): Promise<void>;
  listChildren(accountId: string): Promise<ChildRow[]>;
  getChild(id: string): Promise<ChildRow | null>;
```

(3c) **PostgresStore.init()** に、既存 CREATE TABLE 群の末尾へ追加:
```ts
    await this.sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        stage TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`CREATE INDEX IF NOT EXISTS children_account_idx ON children (account_id)`;
```
PostgresStore にメソッド実装（生SQL＋既存の String() 変換に倣う）:
```ts
  async createAccount(id: string, email: string, passwordHash: string): Promise<void> {
    await this.ready;
    await this.sql`INSERT INTO accounts (id, email, password_hash) VALUES (${id}, ${email}, ${passwordHash})`;
  }
  async getAccountByEmail(email: string): Promise<AccountRow | null> {
    await this.ready;
    const rows = await this.sql`SELECT id, email, password_hash, created_at FROM accounts WHERE email = ${email} LIMIT 1`;
    const r = (rows as any[])[0];
    return r ? { id: String(r.id), email: String(r.email), passwordHash: String(r.password_hash), createdAt: r.created_at == null ? "" : String(r.created_at) } : null;
  }
  async getAccountById(id: string): Promise<AccountRow | null> {
    await this.ready;
    const rows = await this.sql`SELECT id, email, password_hash, created_at FROM accounts WHERE id = ${id} LIMIT 1`;
    const r = (rows as any[])[0];
    return r ? { id: String(r.id), email: String(r.email), passwordHash: String(r.password_hash), createdAt: r.created_at == null ? "" : String(r.created_at) } : null;
  }
  async createChild(id: string, accountId: string, name: string, stage: string): Promise<void> {
    await this.ready;
    await this.sql`INSERT INTO children (id, account_id, name, stage) VALUES (${id}, ${accountId}, ${name}, ${stage})`;
  }
  async listChildren(accountId: string): Promise<ChildRow[]> {
    await this.ready;
    const rows = await this.sql`SELECT id, account_id, name, stage, created_at FROM children WHERE account_id = ${accountId} ORDER BY created_at ASC`;
    return (rows as any[]).map((r) => ({ id: String(r.id), accountId: String(r.account_id), name: String(r.name), stage: String(r.stage), createdAt: r.created_at == null ? "" : String(r.created_at) }));
  }
  async getChild(id: string): Promise<ChildRow | null> {
    await this.ready;
    const rows = await this.sql`SELECT id, account_id, name, stage, created_at FROM children WHERE id = ${id} LIMIT 1`;
    const r = (rows as any[])[0];
    return r ? { id: String(r.id), accountId: String(r.account_id), name: String(r.name), stage: String(r.stage), createdAt: r.created_at == null ? "" : String(r.created_at) } : null;
  }
```

(3d) **SqliteStore.init()** の `exec` に追加（`test_results` 作成の近くに、CREATE TABLE 群へ）:
```ts
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE TABLE IF NOT EXISTS children (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        name TEXT NOT NULL,
        stage TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE INDEX IF NOT EXISTS children_account_idx ON children (account_id);
```
SqliteStore にメソッド（既存の `withDb`／同期 prepare スタイルに合わせる。このリポジトリの Sqlite 実装が `withDb(db => ...)` を使っているならそれに倣い、そうでなければ `this.db.prepare(...)` 同期呼び出し）:
```ts
  async createAccount(id: string, email: string, passwordHash: string): Promise<void> {
    await this.ready;
    this.run("INSERT INTO accounts (id, email, password_hash) VALUES (?, ?, ?)", [id, email, passwordHash]);
  }
  async getAccountByEmail(email: string): Promise<AccountRow | null> {
    await this.ready;
    const r = this.get("SELECT id, email, password_hash, created_at FROM accounts WHERE email = ? LIMIT 1", [email]);
    return r ? { id: String(r.id), email: String(r.email), passwordHash: String(r.password_hash), createdAt: r.created_at == null ? "" : String(r.created_at) } : null;
  }
  // getAccountById / createChild / listChildren / getChild も同様（accounts-store.test.ts が通る形で）。
```
> 注: SqliteStore が per-call open/close（`withDb`）か persistent（`this.db`）かを**既存コードで確認し、そのスタイルに合わせて** run/get/all を実装すること。`this.run`/`this.get`/`this.all` のような private ヘルパーが無ければ、既存メソッド（例 `recordTestResult`/`getTestHistory`）と同じ書き方で直接書く。**新しい接続戦略を勝手に導入しない。**

(3e) **NoopStore** にスタブ:
```ts
  async createAccount(): Promise<void> {}
  async getAccountByEmail(): Promise<AccountRow | null> { return null; }
  async getAccountById(): Promise<AccountRow | null> { return null; }
  async createChild(): Promise<void> {}
  async listChildren(): Promise<ChildRow[]> { return []; }
  async getChild(): Promise<ChildRow | null> { return null; }
```

- [ ] **Step 4: Run and confirm PASS**

Run: `npx vitest run src/lib/db/__tests__/accounts-store.test.ts`（2 tests PASS）→ 続けて `npx vitest run`（既存も緑）＋`npx tsc --noEmit`。

- [ ] **Step 5: Commit**
```bash
git add src/lib/db/index.ts src/lib/db/__tests__/accounts-store.test.ts
git commit -m "feat(db): accounts/children テーブルとCRUDを追加"
```

---

## Task 2: パスワード hash（scrypt）

**Files:**
- Create: `src/lib/auth/password.ts`
- Test: `src/lib/auth/__tests__/password.test.ts`

- [ ] **Step 1: Write the failing test**
```ts
import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

test("hashPassword は毎回異なる（salt）が verify で一致する", () => {
  const h1 = hashPassword("correct horse");
  const h2 = hashPassword("correct horse");
  expect(h1).not.toBe(h2);
  expect(verifyPassword("correct horse", h1)).toBe(true);
  expect(verifyPassword("correct horse", h2)).toBe(true);
});
test("違うパスワードは false", () => {
  const h = hashPassword("secret1");
  expect(verifyPassword("secret2", h)).toBe(false);
});
test("壊れたハッシュは false（throwしない）", () => {
  expect(verifyPassword("x", "garbage")).toBe(false);
});
```

- [ ] **Step 2: Run and confirm FAIL**
Run: `npx vitest run src/lib/auth/__tests__/password.test.ts` → FAIL（未定義）。

- [ ] **Step 3: Implement** `src/lib/auth/password.ts`:
```ts
import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

/** パスワードを salt 付き scrypt でハッシュ化（保存用 "scrypt$salt$hash"）。 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** 生パスワードを保存ハッシュと定数時間比較。壊れた入力は false。 */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run and confirm PASS**（3 tests）＋`npx tsc --noEmit`。
> 注: `server-only` を import するので、テストは `vitest.config.ts` の既存エイリアス（`server-only`→空スタブ）で動く。既に設定済み。

- [ ] **Step 5: Commit**
```bash
git add src/lib/auth/password.ts src/lib/auth/__tests__/password.test.ts
git commit -m "feat(auth): パスワードのscryptハッシュ"
```

---

## Task 3: セッション（HMAC署名Cookie）

**Files:**
- Create: `src/lib/auth/session.ts`
- Test: `src/lib/auth/__tests__/session.test.ts`

- [ ] **Step 1: Write the failing test**
```ts
import { expect, test } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

test("sign→verify で accountId が復元できる", () => {
  const token = signSession("acc-1", 60_000); // 60秒後まで有効
  const v = verifySession(token);
  expect(v?.accountId).toBe("acc-1");
});
test("改ざんトークンは null", () => {
  const token = signSession("acc-1", 60_000);
  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
  expect(verifySession(tampered)).toBeNull();
});
test("期限切れは null", () => {
  const token = signSession("acc-1", -1000); // 過去
  expect(verifySession(token)).toBeNull();
});
test("ゴミ文字列は null（throwしない）", () => {
  expect(verifySession("garbage")).toBeNull();
  expect(verifySession("a.b.c")).toBeNull();
});
```

- [ ] **Step 2: Run and confirm FAIL** → `npx vitest run src/lib/auth/__tests__/session.test.ts`。

- [ ] **Step 3: Implement** `src/lib/auth/session.ts`:
```ts
import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** セッションCookie名。 */
export const SESSION_COOKIE = "ai_sensei_session";

const KEY = createHash("sha256")
  .update(process.env.AUTH_SECRET ?? "ai-sensei-auth-default-secret-v1")
  .digest();

/** payload を base64url、HMAC-SHA256 で署名して "body.sig" を返す。ttlMs 後に失効。 */
export function signSession(accountId: string, ttlMs: number): string {
  const payload = { accountId, exp: nowMs() + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", KEY).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/** 署名と期限を検証し accountId を返す。不正/期限切れは null。 */
export function verifySession(token: string): { accountId: string } | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  try {
    const expected = createHmac("sha256", KEY).update(body).digest();
    const got = Buffer.from(sig, "base64url");
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      accountId?: unknown;
      exp?: unknown;
    };
    if (typeof payload.accountId !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < nowMs()) return null;
    return { accountId: payload.accountId };
  } catch {
    return null;
  }
}

/** Cookie の共通オプション（90日）。 */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: Boolean(process.env.VERCEL),
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  };
}

/** セッションの有効期間（署名の exp とCookie maxAge を揃える）。 */
export const SESSION_TTL_MS = 60 * 60 * 24 * 90 * 1000;

function nowMs(): number {
  return Date.now();
}
```

- [ ] **Step 4: Run and confirm PASS**（4 tests）＋`npx tsc --noEmit`。

- [ ] **Step 5: Commit**
```bash
git add src/lib/auth/session.ts src/lib/auth/__tests__/session.test.ts
git commit -m "feat(auth): HMAC署名セッショントークン"
```

---

## Task 4: accounts ヘルパー（server-only ラッパー＋現在アカウント取得）

**Files:**
- Create: `src/lib/auth/accounts.ts`

- [ ] **Step 1: Implement**（薄いラッパー。read.ts/log.ts の書き味に倣う）
```ts
import "server-only";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import type { AccountRow, ChildRow } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";

/** email 正規化（前後空白除去＋小文字化）。 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** アカウント作成。id を生成して返す。email 重複は呼び出し側で事前チェック。 */
export async function createAccount(email: string, passwordHash: string): Promise<string> {
  const id = randomUUID();
  await getStore().createAccount(id, normalizeEmail(email), passwordHash);
  return id;
}
export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  return getStore().getAccountByEmail(normalizeEmail(email));
}
export async function findAccountById(id: string): Promise<AccountRow | null> {
  return getStore().getAccountById(id);
}
export async function addChild(accountId: string, name: string, stage: string): Promise<string> {
  const id = randomUUID();
  await getStore().createChild(id, accountId, name, stage);
  return id;
}
export async function listChildren(accountId: string): Promise<ChildRow[]> {
  return getStore().listChildren(accountId);
}
export async function getChild(id: string): Promise<ChildRow | null> {
  return getStore().getChild(id);
}

/** リクエストの Cookie から現在ログイン中の accountId を得る（無効なら null）。 */
export function currentAccountId(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token)?.accountId ?? null;
}

/** 指定 child がこの account の所有か（見える化APIの所有チェック用）。 */
export async function ownsChild(accountId: string, childId: string): Promise<boolean> {
  const child = await getStore().getChild(childId);
  return !!child && child.accountId === accountId;
}
```

- [ ] **Step 2: 型チェック**：`npx tsc --noEmit`（緑）。

- [ ] **Step 3: Commit**
```bash
git add src/lib/auth/accounts.ts
git commit -m "feat(auth): accounts/children ラッパーと現在アカウント取得"
```

---

## Task 5: /api/auth/{signup,login,logout}

**Files:**
- Create: `src/app/api/auth/signup/route.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`

- [ ] **Step 1: signup** `src/app/api/auth/signup/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, sessionCookieOptions, SESSION_TTL_MS } from "@/lib/auth/session";
import { createAccount, findAccountByEmail, normalizeEmail } from "@/lib/auth/accounts";

export const runtime = "nodejs";

/** POST { email, password } → アカウント作成＋セッションCookie。 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスを正しく入力してください。" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上にしてください。" }, { status: 400 });
  }
  try {
    if (await findAccountByEmail(email)) {
      return NextResponse.json({ error: "このメールアドレスは既に使われています。" }, { status: 409 });
    }
    const id = await createAccount(email, hashPassword(password));
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, signSession(id, SESSION_TTL_MS), sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: "no-store" }, { status: 500 });
  }
}
```

- [ ] **Step 2: login** `src/app/api/auth/login/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, SESSION_COOKIE, sessionCookieOptions, SESSION_TTL_MS } from "@/lib/auth/session";
import { findAccountByEmail, normalizeEmail } from "@/lib/auth/accounts";

export const runtime = "nodejs";

/** POST { email, password } → 照合しセッションCookie。失敗は401（原因は曖昧に）。 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const account = await findAccountByEmail(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return NextResponse.json({ error: "メールアドレスかパスワードが違います。" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, signSession(account.id, SESSION_TTL_MS), sessionCookieOptions());
  return res;
}
```

- [ ] **Step 3: logout** `src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const runtime = "nodejs";

/** POST → セッションCookieを失効。 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: Boolean(process.env.VERCEL), path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 4: 検証（スモーク）**：`npx tsc --noEmit` 緑、`npm run build` 緑。dev で:
```bash
# signup
curl -s -i -X POST localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"p@example.com","password":"password1"}' | grep -iE "set-cookie|ok|error"
# 重複 → 409
curl -s -X POST localhost:3000/api/auth/signup -H "Content-Type: application/json" -d '{"email":"p@example.com","password":"password1"}'
# login 誤パス → 401
curl -s -X POST localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"p@example.com","password":"wrong"}'
```
Expected: signup で Set-Cookie（ai_sensei_session）＋`{"ok":true}`、重複 409、誤パス 401。**dev サーバーは止める。**（ローカルは SQLite 保存）

- [ ] **Step 5: Commit**
```bash
git add src/app/api/auth/signup/route.ts src/app/api/auth/login/route.ts src/app/api/auth/logout/route.ts
git commit -m "feat(api): 認証 signup/login/logout"
```

---

## Task 6: /api/children（一覧・作成）

**Files:**
- Create: `src/app/api/children/route.ts`

- [ ] **Step 1: Implement**
```ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, listChildren, addChild } from "@/lib/auth/accounts";

export const runtime = "nodejs";

const STAGES = ["elementary", "junior", "senior"];

/** GET → ログイン中アカウントの子プロフィール一覧。未ログインは401。 */
export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const children = await listChildren(accountId);
  return NextResponse.json({ children });
}

/** POST { name, stage } → 子プロフィール作成。未ログインは401。 */
export async function POST(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { name?: string; stage?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const name = (body.name ?? "").trim();
  const stage = (body.stage ?? "").trim();
  if (!name || name.length > 20) return NextResponse.json({ error: "なまえは1〜20文字で。" }, { status: 400 });
  if (!STAGES.includes(stage)) return NextResponse.json({ error: "学齢が不正です。" }, { status: 400 });
  const id = await addChild(accountId, name, stage);
  return NextResponse.json({ id });
}
```

- [ ] **Step 2: 検証（スモーク）**：dev で signup の Cookie を保存 → その Cookie で `POST /api/children {name,stage}` → `GET /api/children` に出る、Cookie 無しは 401。`npx tsc --noEmit`＋`npm run build` 緑。**dev を止める。**

- [ ] **Step 3: Commit**
```bash
git add src/app/api/children/route.ts
git commit -m "feat(api): 子プロフィールの一覧・作成"
```

---

## Task 7: 全体リグレッション

- [ ] **Step 1**：`npx vitest run`（既存＋新規〈accounts-store 2・password 3・session 4〉すべて緑）／`npx tsc --noEmit`／`npm run build` 緑。
- [ ] **Step 2**：3系統DBメモ — Postgres は `CREATE TABLE IF NOT EXISTS` で冪等、SQLite はローカル、Noop はメソッドが空/null を返し API は 401/500 で壊れない（本番で DATABASE_URL 有り前提だが、無くてもクラッシュしない）。

---

## Self-Review（スペック突合）

- **§2 認証方式**: scrypt（Task2）＋HMAC署名Cookie（Task3）＋90日。✅ レート制限は非スコープ（§8）。
- **§3 データモデル**: accounts/children（Task1）。既存 attempts/test_results は不変。引き継ぎは A2（本プラン外）。✅
- **§6 API**: signup/login/logout（Task5）、children GET/POST（Task6）。progress系・アクティブプロフィールは A2/A3（本プラン外）。✅
- **§7 段階**: 本プラン＝A1。A2（記録）・A3（集計）・A4（画面）は後続。✅
- **Placeholder**: 各手順に実コード。SqliteStore の run/get は「既存スタイルに合わせる」と明示（唯一の環境依存注記）。✅
- **型整合**: `AccountRow`/`ChildRow`（Task1）を accounts.ts（Task4）・API（Task5/6）で一致利用。`signSession(accountId, ttlMs)`/`verifySession→{accountId}` を session.ts と API/accounts で一致。✅

（A2＝アクティブ子プロフィール＋記録／A3＝集計・見える化ロジック＋/api/progress/*／A4＝今日/全体/教科の画面・旧guardian撤去 は別プランで。）
