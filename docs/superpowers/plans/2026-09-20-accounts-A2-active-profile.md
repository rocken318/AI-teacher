# アクティブ子プロフィール＋記録＋引き継ぎ（A2）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** ログイン中に選んだ子プロフィールで学習記録が保存され、端末の匿名記録をそのプロフィールへ引き継げるようにする（プラミングのみ。画面は A4）。

**Architecture:** クライアントは「アクティブ子プロフィール id」を localStorage に持ち、`getChildId()` がそれを優先して返す（未設定は従来の匿名UUID）。既存の grade 系APIは `childId` をクライアントから受け取るので、アクティブ id を送れば自動的にそのプロフィールに記録される。ログイン状態は `/api/auth/me` で取得。引き継ぎは `attempts`/`test_results` の `child_id` を付け替える Store メソッド＋所有チェック付きAPI。

**Tech Stack:** Next.js 15 / TS / Vitest / 既存 Store 抽象・auth（A1）。

**Scope:** A2＝プラミング。プロフィール選択UI・ログイン画面・ダッシュボードは A4。

---

## File Structure
- `src/lib/progress.ts`（変更）— `ACTIVE_CHILD_KEY`＋`getActiveChild`/`setActiveChild`/`clearActiveChild`、`getChildId()` がアクティブを優先。
- `src/lib/progress.test.ts` or `src/lib/__tests__/progress-active.test.ts`（新規）— getChildId のアクティブ優先を jsdom で検証。
- `src/app/api/auth/me/route.ts`（新規）— ログイン状態＋email。
- `src/lib/db/index.ts`（変更）— `reassignChildData(fromChildId, toChildId)`（attempts＋test_results の child_id 更新）。3ストア。
- `src/lib/db/__tests__/reassign.test.ts`（新規）。
- `src/app/api/children/claim/route.ts`（新規）— 匿名id→アクティブプロフィールへ引き継ぎ（session＋所有チェック）。

---

## Task 1: アクティブ子プロフィール（progress.ts）

**Files:** Modify `src/lib/progress.ts`; Test `src/lib/__tests__/progress-active.test.ts`

- [ ] **Step 1: 失敗するテスト**（vitest は jsdom 環境。`vitest.config.ts` の `environment` を確認し、未設定なら該当テストファイル冒頭に `// @vitest-environment jsdom` を付ける）
```ts
// @vitest-environment jsdom
import { beforeEach, expect, test } from "vitest";
import { getChildId, getActiveChild, setActiveChild, clearActiveChild } from "@/lib/progress";

beforeEach(() => localStorage.clear());

test("アクティブ未設定なら匿名UUIDを返し、以後同じ値", () => {
  const a = getChildId();
  expect(a).not.toBe("");
  expect(getChildId()).toBe(a); // 2回目も同じ（localStorageに保存）
  expect(getActiveChild()).toBe("");
});
test("アクティブを設定すると getChildId はそれを返す。clear で匿名に戻る", () => {
  const anon = getChildId();
  setActiveChild("prof-1");
  expect(getActiveChild()).toBe("prof-1");
  expect(getChildId()).toBe("prof-1");
  clearActiveChild();
  expect(getActiveChild()).toBe("");
  expect(getChildId()).toBe(anon); // 匿名に戻る
});
```

- [ ] **Step 2: 実行して FAIL**：`npx vitest run src/lib/__tests__/progress-active.test.ts`。

- [ ] **Step 3: 実装**（`progress.ts`）:
  - 定数追加: `const ACTIVE_CHILD_KEY = "ai-sensei-active-child-v1";`
  - 追加関数:
```ts
/** アクティブ子プロフィール id（未設定は ""）。ログイン中に選んだ子。 */
export function getActiveChild(): string {
  const s = storage();
  if (!s) return "";
  try {
    return s.getItem(ACTIVE_CHILD_KEY) ?? "";
  } catch {
    return "";
  }
}
/** アクティブ子プロフィールを設定する。 */
export function setActiveChild(childId: string): void {
  const s = storage();
  if (!s) return;
  try {
    if (childId) s.setItem(ACTIVE_CHILD_KEY, childId);
    else s.removeItem(ACTIVE_CHILD_KEY);
  } catch {
    /* noop */
  }
}
/** アクティブ子プロフィールを解除する（＝匿名に戻す）。 */
export function clearActiveChild(): void {
  setActiveChild("");
}
```
  - `getChildId()` の冒頭を変更してアクティブ優先に:
```ts
export function getChildId(): string {
  const s = storage();
  if (!s) return "";
  // ログイン中に選んだ子プロフィールがあればそれを使う。
  const active = getActiveChild();
  if (active) return active;
  try {
    let id = s.getItem(CHILD_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      s.setItem(CHILD_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}
```

- [ ] **Step 4: PASS**：`npx vitest run src/lib/__tests__/progress-active.test.ts`（2件）＋`npx vitest run`（全緑）＋`npx tsc --noEmit`。
- [ ] **Step 5: Commit**：
```bash
git add src/lib/progress.ts src/lib/__tests__/progress-active.test.ts
git commit -m "feat(progress): アクティブ子プロフィールとgetChildId優先"
```

---

## Task 2: /api/auth/me（ログイン状態）

**Files:** Create `src/app/api/auth/me/route.ts`

- [ ] **Step 1: 実装**
```ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, findAccountById } from "@/lib/auth/accounts";

export const runtime = "nodejs";

/** GET → { loggedIn, email }。未ログインは { loggedIn:false, email:null }（200）。 */
export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ loggedIn: false, email: null });
  const account = await findAccountById(accountId);
  if (!account) return NextResponse.json({ loggedIn: false, email: null });
  return NextResponse.json({ loggedIn: true, email: account.email });
}
```

- [ ] **Step 2: 検証**：`npx tsc --noEmit` 緑、`npm run build` 緑。dev で未ログイン→`{"loggedIn":false,...}`、signup後のCookieで→`{"loggedIn":true,"email":"..."}`。**dev停止**。
- [ ] **Step 3: Commit**：
```bash
git add src/app/api/auth/me/route.ts
git commit -m "feat(api): /api/auth/me ログイン状態"
```

---

## Task 3: 引き継ぎ — Store.reassignChildData

**Files:** Modify `src/lib/db/index.ts`; Test `src/lib/db/__tests__/reassign.test.ts`

- [ ] **Step 1: 失敗するテスト** `src/lib/db/__tests__/reassign.test.ts`:
```ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-reassign-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("匿名idの attempts/test_results をプロフィールidへ付け替える", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.recordAttempt("a1", "anon", "math", "u1", true, "practice");
  await s.recordAttempt("a2", "anon", "math", "u1", false, "practice");
  await s.recordTestResult({ id: "r1", childId: "anon", subject: "math", unitIds: "u1", testKey: "math|u1", total: 5, score: 4 });

  await s.reassignChildData("anon", "prof-1");

  expect((await s.getChildProgress("anon")).total).toBe(0);
  const prog = await s.getChildProgress("prof-1");
  expect(prog.total).toBe(2);
  expect(prog.correct).toBe(1);
  const hist = await s.getTestHistory("prof-1", "math|u1", 50);
  expect(hist.length).toBe(1);
});
```

- [ ] **Step 2: FAIL**：`npx vitest run src/lib/db/__tests__/reassign.test.ts`。

- [ ] **Step 3: 実装**（`src/lib/db/index.ts`）:
  - `Store` インターフェースに: `reassignChildData(fromChildId: string, toChildId: string): Promise<void>;`
  - **PostgresStore**:
```ts
  async reassignChildData(fromChildId: string, toChildId: string): Promise<void> {
    await this.ready;
    await this.sql`UPDATE attempts SET child_id = ${toChildId} WHERE child_id = ${fromChildId}`;
    await this.sql`UPDATE test_results SET child_id = ${toChildId} WHERE child_id = ${fromChildId}`;
  }
```
  - **SqliteStore**（既存の `withDb`/prepare 流儀に合わせる）:
```ts
  async reassignChildData(fromChildId: string, toChildId: string): Promise<void> {
    await this.ready;
    // 既存メソッドと同じ書き方で 2 つの UPDATE を実行する。
    this.run("UPDATE attempts SET child_id = ? WHERE child_id = ?", [toChildId, fromChildId]);
    this.run("UPDATE test_results SET child_id = ? WHERE child_id = ?", [toChildId, fromChildId]);
  }
```
  > 注: SqliteStore が `withDb`/`this.db.prepare(...).run(...)` のどちらかを既存メソッドで使っているので、それに合わせて 2 つの UPDATE を書く。新戦略は導入しない。
  - **NoopStore**: `async reassignChildData(): Promise<void> {}`

- [ ] **Step 4: PASS**（1件）＋`npx vitest run` 全緑＋`npx tsc --noEmit`。
- [ ] **Step 5: Commit**：
```bash
git add src/lib/db/index.ts src/lib/db/__tests__/reassign.test.ts
git commit -m "feat(db): reassignChildData で学習記録を付け替え"
```

---

## Task 4: 引き継ぎ API `/api/children/claim`

**Files:** Create `src/app/api/children/claim/route.ts`; Modify `src/lib/db/log.ts`（`reassignChildData` の薄いラッパー）または直接 getStore を使う。

- [ ] **Step 1: log ヘルパー追加**（`src/lib/db/log.ts`）— 既存の書き味で:
```ts
/** 学習記録の付け替え（引き継ぎ）。after ではなく即時 await 用に read/write 直呼び。 */
export async function reassignChildData(fromChildId: string, toChildId: string): Promise<void> {
  await getStore().reassignChildData(fromChildId, toChildId);
}
```
（`log.ts` は `getStore` を import 済み。`import "server-only"` 済み。）

- [ ] **Step 2: ルート実装** `src/app/api/children/claim/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild } from "@/lib/auth/accounts";
import { reassignChildData } from "@/lib/db/log";

export const runtime = "nodejs";

/**
 * POST { fromChildId, toChildId } → 匿名端末の記録(fromChildId)を
 * 自分の子プロフィール(toChildId)へ引き継ぐ。session＋所有チェック必須。
 */
export async function POST(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { fromChildId?: string; toChildId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const fromChildId = (body.fromChildId ?? "").trim();
  const toChildId = (body.toChildId ?? "").trim();
  if (!fromChildId || !toChildId) {
    return NextResponse.json({ error: "fromChildId and toChildId required" }, { status: 400 });
  }
  // toChildId は必ず自分の子プロフィールでなければならない（他人の子に付け替えさせない）。
  if (!(await ownsChild(accountId, toChildId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // fromChildId は匿名端末UUIDを想定（他人の子プロフィールidを奪えないよう、
  // fromChildId が「どの account の子でもない」ことは要求しない＝匿名UUIDは children に無い。
  // ただし fromChildId が他アカウントの子プロフィールidだった場合の悪用を防ぐため、
  // fromChildId が children テーブルに存在するなら自分の所有であることを要求する）。
  if (fromChildId !== toChildId) {
    const { getChild } = await import("@/lib/auth/accounts");
    const fromChild = await getChild(fromChildId);
    if (fromChild && fromChild.accountId !== accountId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  await reassignChildData(fromChildId, toChildId);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 検証**：`npx tsc --noEmit`＋`npm run build` 緑。dev スモーク（signup→子作成→`/api/children/claim {fromChildId:"anonX", toChildId:子id}`→200、他人の子idへは403、Cookie無しは401）。**dev停止**。
- [ ] **Step 4: Commit**：
```bash
git add src/lib/db/log.ts src/app/api/children/claim/route.ts
git commit -m "feat(api): 学習記録の引き継ぎ /api/children/claim（所有チェック）"
```

---

## Task 5: リグレッション
- [ ] `npx vitest run`（既存＋progress-active 2・reassign 1）／`npx tsc --noEmit`／`npm run build` 全緑。

---

## Self-Review（スペック突合）
- **§3 引き継ぎ**: reassignChildData（Task3）＋claim API 所有チェック（Task4）。✅
- **§6 記録系がアクティブ id で保存**: getChildId 拡張（Task1）＝既存 grade API はクライアントの childId をそのまま使うので、アクティブ id を送れば達成。✅
- **§6 /api/auth/me**: Task2。✅
- **画面（プロフィール選択・ログイン・ダッシュボード）**: A4 に集約（本プラン外）。✅
- Placeholder なし。SqliteStore は「既存流儀に合わせる」注記のみ。型整合（reassignChildData／getActiveChild 等）一貫。✅
