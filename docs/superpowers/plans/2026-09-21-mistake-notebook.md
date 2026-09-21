# まちがいノート 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`). **重要: 作業は隔離ワークツリー `Y:\ai-sensei-mistakes`（branch `feature/mistake-notebook`）で行う。** すべてのコマンド・編集はこのディレクトリの絶対パスで行い、`Y:\AI先生`（別セッションが使用中）は触らない。`cd "Y:\ai-sensei-mistakes"` で作業。

**Goal:** 間違えた問題（クイズ=同じ問題、算数=その数値の問題）をためて、まとめて解き直せる「まちがいノート」。自力正解／「もう覚えた」で消える。回答UIに「わからない」ボタンを置き偶然正解を防ぐ。

**Architecture:** 既存の Store 抽象に `mistakes` テーブルを足し、採点API（math/quiz/test grade）で不正解・「わからない」時に記録。`/api/review/*` でまちがいの一覧・次の問題・削除を提供し、`/review` ページで解き直す。既存の算数/クイズ採点エンジンを流用（新エンジンなし）。子ごと（childId 単位）＝ログイン中は別端末同期。**AI不使用。**

**Tech Stack:** Next.js App Router / TypeScript / 既存 Store（Postgres/SQLite/Noop）/ Vitest。

**Spec:** `docs/superpowers/specs/2026-09-21-mistake-notebook-design.md`

## ファイル構成
- Modify `src/lib/db/index.ts`: `MistakeInput`/`MistakeRow` 型・`Store` に4メソッド・3実装
- Modify `src/lib/db/read.ts`: `listMistakes`/`countMistakes` 読み取りラッパ
- Modify `src/lib/db/log.ts`: `logMistake`（after 経由）・`removeMistakeNow`（即await）
- Modify `src/app/api/math/grade/route.ts` / `quiz/grade/route.ts` / `test/grade/route.ts`: `unknown` 受理＋まちがい記録
- Create `src/app/api/review/list/route.ts` / `next/route.ts` / `remove/route.ts`
- Create `src/app/review/page.tsx`（＋`ReviewRunner` 相当）
- Modify `src/app/HomeHub.tsx`: まちがいノート カード
- Modify `src/app/math/MathPractice.tsx` / `src/app/quiz/QuizPractice.tsx` / `src/app/test/TestRunner.tsx`: 「わからない」ボタン

---

## Task 1: mistakes テーブルと Store メソッド

**Files:** Modify `src/lib/db/index.ts` / Test `src/lib/db/__tests__/mistakes-store.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/db/__tests__/mistakes-store.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-mist-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("addMistake は追加し、重複は入れない（quiz=item, math=problem）", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.addMistake({ id: "m1", childId: "c1", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.addMistake({ id: "m2", childId: "c1", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null }); // 重複
  await s.addMistake({ id: "m3", childId: "c1", subject: "math", unitId: "div-basic", kind: "math", itemId: null, problem: '{"prompt":"1+1","answer":"2"}' });
  await s.addMistake({ id: "m4", childId: "c1", subject: "math", unitId: "div-basic", kind: "math", itemId: null, problem: '{"prompt":"1+1","answer":"2"}' }); // 重複
  expect(await s.countMistakes("c1")).toBe(2);
  const list = await s.listMistakes("c1", 50);
  expect(list.map((m) => m.unitId).sort()).toEqual(["div-basic", "u1"]);
});

test("removeMistake は自分の分だけ消す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.addMistake({ id: "m1", childId: "c1", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.addMistake({ id: "m2", childId: "other", subject: "science", unitId: "u1", kind: "quiz", itemId: "i1", problem: null });
  await s.removeMistake("c1", "m1");
  expect(await s.countMistakes("c1")).toBe(0);
  expect(await s.countMistakes("other")).toBe(1);
  await s.removeMistake("c1", "m2"); // 他人の分は消えない
  expect(await s.countMistakes("other")).toBe(1);
});
```

- [ ] **Step 2: 失敗を確認**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/lib/db/__tests__/mistakes-store.test.ts`
Expected: FAIL（addMistake 未定義）

- [ ] **Step 3: 型と Store インターフェイスを追加**

`src/lib/db/index.ts` の `TestResultRow` 定義の直後に:

```ts
/** まちがいノート 1件の保存入力。 */
export interface MistakeInput {
  id: string;
  childId: string;
  subject: string;
  unitId: string;
  kind: "quiz" | "math";
  itemId: string | null; // quiz のとき item id
  problem: string | null; // math のとき問題JSON（{prompt,answer,answerType,meta}）
}

/** まちがいノート 1件の行。 */
export interface MistakeRow {
  id: string;
  subject: string;
  unitId: string;
  kind: "quiz" | "math";
  itemId: string | null;
  problem: string | null;
  createdAt: string;
}
```

`Store` インターフェイスの `listTestResults` メソッドの直後に:

```ts
  /* --- まちがいノート --- */
  addMistake(input: MistakeInput): Promise<void>;
  listMistakes(childId: string, limit: number): Promise<MistakeRow[]>;
  countMistakes(childId: string): Promise<number>;
  removeMistake(childId: string, mistakeId: string): Promise<void>;
```

- [ ] **Step 4: PostgresStore に実装**

`init()` のテーブル作成群の末尾（`children` の CREATE の後）に追加:

```ts
    await this.sql`
      CREATE TABLE IF NOT EXISTS mistakes (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        item_id TEXT,
        problem TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`CREATE INDEX IF NOT EXISTS mistakes_child_idx ON mistakes (child_id)`;
```

`PostgresStore` の `listTestResults` メソッドの直後に:

```ts
  async addMistake(input: MistakeInput): Promise<void> {
    await this.ready;
    // 重複防止: quiz は (child, unit, item)、math は (child, unit, problem)。
    const dup = input.kind === "quiz"
      ? await this.sql`SELECT 1 FROM mistakes WHERE child_id=${input.childId} AND unit_id=${input.unitId} AND kind='quiz' AND item_id=${input.itemId} LIMIT 1`
      : await this.sql`SELECT 1 FROM mistakes WHERE child_id=${input.childId} AND unit_id=${input.unitId} AND kind='math' AND problem=${input.problem} LIMIT 1`;
    if ((dup as any[]).length > 0) return;
    await this.sql`
      INSERT INTO mistakes (id, child_id, subject, unit_id, kind, item_id, problem)
      VALUES (${input.id}, ${input.childId}, ${input.subject}, ${input.unitId}, ${input.kind}, ${input.itemId}, ${input.problem})
    `;
  }

  async listMistakes(childId: string, limit: number): Promise<MistakeRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, subject, unit_id, kind, item_id, problem, created_at
      FROM mistakes WHERE child_id = ${childId}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      unitId: String(r.unit_id),
      kind: (String(r.kind) === "math" ? "math" : "quiz") as "quiz" | "math",
      itemId: r.item_id == null ? null : String(r.item_id),
      problem: r.problem == null ? null : String(r.problem),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    }));
  }

  async countMistakes(childId: string): Promise<number> {
    await this.ready;
    const rows = await this.sql`SELECT COUNT(*) AS n FROM mistakes WHERE child_id = ${childId}`;
    return Number((rows as any[])[0]?.n ?? 0);
  }

  async removeMistake(childId: string, mistakeId: string): Promise<void> {
    await this.ready;
    await this.sql`DELETE FROM mistakes WHERE id = ${mistakeId} AND child_id = ${childId}`;
  }
```

- [ ] **Step 5: SqliteStore に実装**

`init()` の `sqlite.exec(...)` テーブル群の末尾（`children` の後、閉じ `);` の直前）に追加:

```sql
      CREATE TABLE IF NOT EXISTS mistakes (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        item_id TEXT,
        problem TEXT,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE INDEX IF NOT EXISTS mistakes_child_idx ON mistakes (child_id);
```

`SqliteStore` の `listTestResults` の直後に:

```ts
  async addMistake(input: MistakeInput): Promise<void> {
    await this.ready;
    this.withDb((db) => {
      const dup = input.kind === "quiz"
        ? db.prepare("SELECT 1 FROM mistakes WHERE child_id=? AND unit_id=? AND kind='quiz' AND item_id=? LIMIT 1").get(input.childId, input.unitId, input.itemId)
        : db.prepare("SELECT 1 FROM mistakes WHERE child_id=? AND unit_id=? AND kind='math' AND problem=? LIMIT 1").get(input.childId, input.unitId, input.problem);
      if (dup) return;
      db.prepare("INSERT INTO mistakes (id, child_id, subject, unit_id, kind, item_id, problem) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(input.id, input.childId, input.subject, input.unitId, input.kind, input.itemId, input.problem);
    });
  }

  async listMistakes(childId: string, limit: number): Promise<MistakeRow[]> {
    await this.ready;
    const rows = this.withDb((db) =>
      db.prepare(`SELECT id, subject, unit_id, kind, item_id, problem, created_at FROM mistakes WHERE child_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?`).all(childId, limit) as any[],
    );
    return rows.map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      unitId: String(r.unit_id),
      kind: (String(r.kind) === "math" ? "math" : "quiz") as "quiz" | "math",
      itemId: r.item_id == null ? null : String(r.item_id),
      problem: r.problem == null ? null : String(r.problem),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    }));
  }

  async countMistakes(childId: string): Promise<number> {
    await this.ready;
    const r = this.withDb((db) => db.prepare("SELECT COUNT(*) AS n FROM mistakes WHERE child_id = ?").get(childId) as any);
    return Number(r?.n ?? 0);
  }

  async removeMistake(childId: string, mistakeId: string): Promise<void> {
    await this.ready;
    this.withDb((db) => db.prepare("DELETE FROM mistakes WHERE id = ? AND child_id = ?").run(mistakeId, childId));
  }
```

- [ ] **Step 6: NoopStore に実装**

`NoopStore` の `listTestResults` の直後に:

```ts
  async addMistake(_input: MistakeInput): Promise<void> {}
  async listMistakes(_childId: string, _limit: number): Promise<MistakeRow[]> { return []; }
  async countMistakes(_childId: string): Promise<number> { return 0; }
  async removeMistake(_childId: string, _mistakeId: string): Promise<void> {}
```

- [ ] **Step 7: テスト＆tsc**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/lib/db/__tests__/mistakes-store.test.ts && npx tsc --noEmit`
Expected: PASS / エラーなし

- [ ] **Step 8: コミット**

```bash
cd "Y:\ai-sensei-mistakes" && git add src/lib/db/index.ts src/lib/db/__tests__/mistakes-store.test.ts && git commit -m "feat(db): mistakesテーブルとStoreメソッド（add/list/count/remove・重複防止）"
```

---

## Task 2: read.ts / log.ts のヘルパ

**Files:** Modify `src/lib/db/read.ts` / `src/lib/db/log.ts`

- [ ] **Step 1: read.ts にラッパ追加**

型 re-export に `MistakeRow` を追加。末尾に:

```ts
/** その子のまちがい一覧。失敗時は空配列。 */
export async function listMistakes(childId: string, limit = 200): Promise<import("./index").MistakeRow[]> {
  try { return await getStore().listMistakes(childId, limit); }
  catch (err) { console.error("[db:read] listMistakes failed:", err); return []; }
}
/** その子のまちがい件数。失敗時は 0。 */
export async function countMistakes(childId: string): Promise<number> {
  try { return await getStore().countMistakes(childId); }
  catch (err) { console.error("[db:read] countMistakes failed:", err); return 0; }
}
```

- [ ] **Step 2: log.ts にヘルパ追加**

`import type { DbBackend }` の付近に `import type { MistakeInput } from "./index";` を追加（無ければ）。`logAttempt` の後に:

```ts
/** まちがいを保存する（after 経由・ベストエフォート）。 */
export function logMistake(input: Omit<MistakeInput, "id">): void {
  const id = randomUUID();
  runAfterResponse(() => getStore().addMistake({ id, ...input }));
}
/** まちがいを削除する（即 await 用・解き直し正解/もう覚えた）。 */
export async function removeMistakeNow(childId: string, mistakeId: string): Promise<void> {
  await getStore().removeMistake(childId, mistakeId);
}
```

- [ ] **Step 3: tsc**

Run: `cd "Y:\ai-sensei-mistakes" && npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
cd "Y:\ai-sensei-mistakes" && git add src/lib/db/read.ts src/lib/db/log.ts && git commit -m "feat(db): まちがいの read/log ヘルパ（listMistakes/countMistakes/logMistake/removeMistakeNow）"
```

---

## Task 3: 算数採点ルートに「わからない」＋まちがい記録

**Files:** Modify `src/app/api/math/grade/route.ts` / Test `src/app/api/math/__tests__/grade.mistake.test.ts`

「わからない」= `unknown:true` のとき `correct=false` 相当（expected は返す）。不正解 or unknown のとき `logMistake`（kind=math, problem=トークン payload の JSON）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
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
```

- [ ] **Step 2: 失敗を確認**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/app/api/math/__tests__/grade.mistake.test.ts`
Expected: FAIL

- [ ] **Step 3: ルートを修正**

`import { logAttempt } from "@/lib/db/log";` を `import { logAttempt, logMistake } from "@/lib/db/log";` に変更。body 型に `unknown?: boolean;` を追加。`const result = gradeAnswer(...)` 以降を次に置換:

```ts
  const graded = gradeAnswer(unitId, problem, userInput);
  const isUnknown = body.unknown === true;
  const correct = isUnknown ? false : graded.correct;

  const childId = (body.childId ?? "").trim();
  if (childId) {
    logAttempt(childId, "math", unitId, correct);
    if (!correct) {
      logMistake({
        childId, subject: "math", unitId, kind: "math", itemId: null,
        problem: JSON.stringify({ prompt: payload.prompt, answer: payload.answer, answerType: unit.answerType, meta: payload.meta ?? {} }),
      });
    }
  }

  const diagnosis = correct ? null : diagnose(unitId, problem, userInput);

  return NextResponse.json({
    correct,
    expected: graded.expected,
    ...(diagnosis ? { diagnosis } : {}),
  });
```

- [ ] **Step 4: テスト**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/app/api/math/__tests__/grade.mistake.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
cd "Y:\ai-sensei-mistakes" && git add src/app/api/math/grade/route.ts src/app/api/math/__tests__/grade.mistake.test.ts && git commit -m "feat(api): 算数採点にわからない(unknown)＋まちがい記録"
```

---

## Task 4: クイズ採点ルートに「わからない」＋まちがい記録

**Files:** Modify `src/app/api/quiz/grade/route.ts` / Test `src/app/api/quiz/__tests__/grade.mistake.test.ts`

unknown のとき correct=false（answerIndex/explanation は返す）。不正解 or unknown で `logMistake`（kind=quiz, itemId=payload.itemId）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/app/api/quiz/__tests__/grade.mistake.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeQuizToken } from "@/lib/quiz/token";
import { QUIZ_UNITS } from "@/lib/quiz";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-qmist-"));
  delete process.env.DATABASE_URL; delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function req(payload: unknown) {
  return new Request("http://localhost/api/quiz/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
// 実在の unit/item を1つ使う。
function firstItem() {
  const u = QUIZ_UNITS.find((x) => x.items.length > 0)!;
  return { unitId: u.id, item: u.items[0] };
}

test("わからない(unknown)は correct:false で記録し、answerIndex/explanation を返す", async () => {
  const { unitId, item } = firstItem();
  const token = encodeQuizToken({ unitId, itemId: item.id, answerIndex: item.answerIndex });
  const { POST } = await import("../grade/route");
  const res = await POST(req({ token, choiceIndex: -1, unknown: true, childId: "c1" }) as never);
  const body = await res.json();
  expect(body.correct).toBe(false);
  expect(typeof body.answerIndex).toBe("number");
  const { getStore } = await import("@/lib/db");
  expect(await getStore().countMistakes("c1")).toBe(1);
});
```

- [ ] **Step 2: 失敗を確認**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/app/api/quiz/__tests__/grade.mistake.test.ts`
Expected: FAIL

- [ ] **Step 3: ルートを修正**

import を `import { logAttempt, logMistake } from "@/lib/db/log";` に。body 型に `unknown?: boolean;`。`choiceIndex` 必須チェックは unknown 時は緩める（下記）。`const result = gradeQuiz(...)` 以降を修正:

```ts
  // わからない のときは choiceIndex を問わない（-1 等でも可）。
  const isUnknown = body.unknown === true;
  if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
  if (!isUnknown && (typeof choiceIndex !== "number" || !Number.isInteger(choiceIndex))) {
    return NextResponse.json({ error: "choiceIndex required" }, { status: 400 });
  }
  const payload = decodeQuizToken(token);
  if (!payload) return NextResponse.json({ error: "invalid token" }, { status: 400 });
  const graded = gradeQuiz(payload.unitId, payload.itemId, isUnknown ? -1 : (choiceIndex as number));
  if (!graded) return NextResponse.json({ error: "invalid token" }, { status: 400 });
  const correct = isUnknown ? false : graded.correct;

  const childId = (body.childId ?? "").trim();
  if (childId) {
    const subject = getQuizUnit(payload.unitId)?.subject ?? "quiz";
    logAttempt(childId, subject, payload.unitId, correct);
    if (!correct) {
      logMistake({ childId, subject, unitId: payload.unitId, kind: "quiz", itemId: payload.itemId, problem: null });
    }
  }

  return NextResponse.json({
    correct,
    answerIndex: graded.answerIndex,
    explanation: graded.explanation,
    hint: graded.hint,
  });
```

（注: 既存の `if (!token || typeof choiceIndex ...)` の一括チェックは上記に置き換えて削除する。）

- [ ] **Step 4: テスト**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/app/api/quiz/__tests__/grade.mistake.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
cd "Y:\ai-sensei-mistakes" && git add src/app/api/quiz/grade/route.ts src/app/api/quiz/__tests__/grade.mistake.test.ts && git commit -m "feat(api): クイズ採点にわからない(unknown)＋まちがい記録"
```

---

## Task 5: テスト採点ルートに「わからない」＋まちがい記録

**Files:** Modify `src/app/api/test/grade/route.ts`

まず `src/app/api/test/grade/route.ts` を読み、各回答を採点して記録している箇所を把握する。各回答項目に `unknown?: boolean` を受け、unknown/不正解のときに `logMistake` を呼ぶ（math 項目→kind=math・problem を token payload から、quiz 項目→kind=quiz・itemId）。テストは既存の `grade.test.ts`/`grade.quiz.test.ts` を壊さないこと（unknown 未指定時は従来動作）。

- [ ] **Step 1: ルートを読み実装**（math/quiz 分岐それぞれで、correct=false のとき logMistake を追加。unknown フラグを項目単位で受理）
- [ ] **Step 2: 既存テスト＋新規最小テストで確認**

Run: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/app/api/test`
Expected: 既存緑＋新規緑

- [ ] **Step 3: コミット**

```bash
cd "Y:\ai-sensei-mistakes" && git add src/app/api/test/grade/route.ts && git commit -m "feat(api): テスト採点にわからない＋まちがい記録"
```

---

## Task 6: /api/review ルート（一覧・次の問題・削除）

**Files:** Create `src/app/api/review/list/route.ts` / `next/route.ts` / `remove/route.ts` / Test `src/app/api/review/__tests__/review.test.ts`

childId 単位（既存 grade API と同じく childId をクライアントから受ける）。答えは露出しない。
- `GET /api/review/list?childId=` → `{ count, mistakes: {id,subject,unitId,kind,preview}[] }`（preview=問題文の先頭。quiz は item.question、math は problem.prompt）
- `GET /api/review/next?childId=` → 次に解く1問。quiz=`{mistakeId,kind:"quiz",unitId,question,choices,token}`（token=encodeQuizToken で再発行・答え非露出）、math=`{mistakeId,kind:"math",unitId,prompt,answerToken}`（answerToken=encodeToken で再発行）。無ければ `{done:true}`。
- `POST /api/review/remove` `{childId, mistakeId}` → `removeMistakeNow`。

- [ ] **Step 1: 失敗するテストを書く**（下記の受け入れを満たす最小テスト。SQLite temp DB に addMistake しておき、list/next/remove を検証。next の quiz は choices を返し answerIndex を返さないこと、remove で count が減ることを確認）

```ts
// src/app/api/review/__tests__/review.test.ts （骨子。実装に合わせ調整可）
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs"; import { tmpdir } from "node:os"; import { join } from "node:path";
import { QUIZ_UNITS } from "@/lib/quiz";
let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "ai-sensei-rev-")); delete process.env.DATABASE_URL; delete process.env.VERCEL; process.env.SQLITE_PATH = join(dir, "t.db"); vi.resetModules(); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));
test("list/next/remove が動く（quiz）", async () => {
  const { getStore } = await import("@/lib/db");
  const u = QUIZ_UNITS.find((x) => x.items.length > 0)!;
  await getStore().addMistake({ id: "m1", childId: "c1", subject: u.subject, unitId: u.id, kind: "quiz", itemId: u.items[0].id, problem: null });
  const { NextRequest } = await import("next/server");
  const list = await (await import("../list/route")).GET(new NextRequest(`http://localhost/api/review/list?childId=c1`));
  expect((await list.json()).count).toBe(1);
  const next = await (await import("../next/route")).GET(new NextRequest(`http://localhost/api/review/next?childId=c1`));
  const nb = await next.json();
  expect(nb.kind).toBe("quiz"); expect(Array.isArray(nb.choices)).toBe(true); expect(nb.answerIndex).toBeUndefined();
  const rm = await (await import("../remove/route")).POST(new NextRequest(`http://localhost/api/review/remove`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ childId: "c1", mistakeId: "m1" }) }));
  expect(rm.status).toBe(200);
  expect(await getStore().countMistakes("c1")).toBe(0);
});
```

- [ ] **Step 2〜4: 3ルートを実装 → テスト緑 → コミット**

実装要点:
- `list/route.ts`: `listMistakes`+`countMistakes`（read.ts）。preview は quiz=`getQuizUnit(unitId)?.items.find(itemId)?.question`、math=`JSON.parse(problem).prompt`。
- `next/route.ts`: 先頭1件を取り、quiz は該当 item の question/choices＋`encodeQuizToken({unitId,itemId,answerIndex})`、math は `JSON.parse(problem)` から prompt＋`encodeToken({unitId,answer,prompt,meta})`。答え(answerIndex/answer)は返さない。
- `remove/route.ts`: `removeMistakeNow(childId, mistakeId)`。

Run（各後）: `cd "Y:\ai-sensei-mistakes" && npx vitest run src/app/api/review`
Commit: `feat(api): /api/review（まちがい一覧・次の問題・削除）`

---

## Task 7: 「わからない」ボタン（Quiz/Math/Test の回答UI）

**Files:** Modify `src/app/quiz/QuizPractice.tsx` / `src/app/math/MathPractice.tsx` / `src/app/test/TestRunner.tsx`

各回答画面に「わからない」ボタンを追加。押下時、既存の採点fetchに `unknown: true` を付けて送る（Quiz: `/api/quiz/grade` に `{token, choiceIndex:-1, unknown:true, childId}`、Math: `/api/math/grade` に `{..., userInput:"", unknown:true}`、Test: 各項目に unknown フラグ）。結果は「不正解」と同じ表示（正解＋解説を見せる）。まちがいノート追加はサーバー側で自動。

**受け入れ**: 通常の選択/入力の隣に「わからない」ボタン（`type="button"`、控えめなスタイル `border-line text-ink-soft`）。押すと採点が走り、正解と解説が出て「もう一回/次へ」に進める。既存の正誤フローを壊さない。各ファイルの既存 grade fetch 箇所を踏襲して `unknown` を足すだけ。

- [ ] 実装 → `npx tsc --noEmit` 緑 → `npm run build` 緑 → コミット `feat(ui): 回答画面に「わからない」ボタン`

---

## Task 8: /review ページ（まちがいノート）

**Files:** Create `src/app/review/page.tsx`（＋必要なら `ReviewRunner.tsx`）

`"use client"`。`getChildId()` で childId を得て `/api/review/list` を表示。
- 一覧: 各まちがいの preview＋教科ラベル、各行に「もう覚えた」ボタン（`/api/review/remove` を叩く→一覧更新）。
- 「まとめてやり直す」: `/api/review/next?childId=` で1問ずつ取得→ Quiz は4択、Math は入力で解答→ 既存の grade API で採点（token/answerToken を使用）。**自力正解なら** `/api/review/remove` でその mistakeId を削除し次へ。「わからない」ボタンも設置（消さずに次へ）。残数を表示。
- 0問なら「まちがいはありません」表示。
- 既存 `QuizPractice`/`MathPractice` の回答UI・解説表示を参考に、最小の解き直しUIを作る（答え非露出は grade API 側で担保）。

**受け入れ**: `/review` で一覧＋やり直しが動く。自力正解で残数が減る。「もう覚えた」で消える。SSR mount ガード。

- [ ] 実装 → tsc/build 緑 → コミット `feat(review): まちがいノート ページ（一覧＋まとめてやり直す＋もう覚えた）`

---

## Task 9: ホームに「まちがいノート」カード

**Files:** Modify `src/app/HomeHub.tsx`

ログイン/アクティブ子がいるとき、`/api/review/list?childId=` の count を取得し、「まちがいノート（◯問）」カード → `/review` を表示。0問なら控えめ（または非表示）。既存のカード群の近く、探究カードと同様の独立導線として置く。学齢モード共通で表示。

**受け入れ**: ホームにまちがい件数カードが出て `/review` へ行ける。件数はサーバー（childId）から。既存表示を壊さない。

- [ ] 実装 → tsc/build 緑 → コミット `feat(home): まちがいノート カード（件数表示→/review）`

---

## Task 10: 全体検証

- [ ] `cd "Y:\ai-sensei-mistakes" && npx tsc --noEmit`（クリーン）
- [ ] `npx vitest run`（全緑・新規テスト含む）
- [ ] `npm run build`（成功・`/review`・`/api/review/*` 出力）
- [ ] `git status`（未コミット無し）

---

## Self-Review（作成者記録）
- **Spec §2 データ**=Task1（mistakes 3実装・重複防止）。**§3 記録（不正解/わからない）**=Task3/4/5。**§4 消える（自力正解/もう覚えた）**=Task6(remove)＋Task8。**§5 導線（/review＋ホームカード）**=Task8/9。**§6 わからないボタン**=Task7。**§7 進捗（件数）**=Task9。全項目に対応タスクあり。
- **型整合**: `MistakeInput`/`MistakeRow`（Task1）を read/log（Task2）・API（Task3-6）で一貫使用。`logMistake` は `Omit<MistakeInput,"id">`。quiz=itemId / math=problem(JSON)。
- **非プレースホルダ**: Task5/7/8/9 は既存ファイル依拠のため「まず読む→踏襲」を明示。骨子コードと受け入れ基準を記載（UIは既存 MathPractice/QuizPractice/HomeHub を手本）。
- **セキュリティ**: 答え非露出は既存 grade/token 方式を流用（review/next も token 再発行で answerIndex/answer を返さない）。childId 単位はattempts と同方針。
