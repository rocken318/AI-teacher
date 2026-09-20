# A3 見える化ロジック＋進捗API 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 子プロフィールの学習記録（attempts / test_results）から「今日の頑張り・全体の進捗・教科の進捗」を導く純関数群と、それを返す `/api/progress/*`（session＋所有チェック）を実装する。

**Architecture:** DB からは「行を最小限そのまま返す」薄い Store メソッド（`listAttempts` / `listTestResults`）を足し、日付境界・集計・制覇判定・レベル・継続・推移は **すべてテスト可能な純関数** (`src/lib/progress-stats/`) に閉じ込める。時刻は Store 側で **UTC エポックミリ秒 (number)** に正規化して返し（バックエンド別の文字列パースを排除）、純関数が JST 日付キーへ変換する。API は「session 検証 → `ownsChild` 所有チェック → `listAttempts` 取得 → 純関数で集計 → JSON」の一本道。**AI 不使用。**

**Tech Stack:** TypeScript / Next.js App Router (route handlers, `runtime = "nodejs"`) / 既存 Store 抽象（Postgres / SQLite / Noop）/ Vitest。

**設計書:** `docs/superpowers/specs/2026-09-20-accounts-and-progress-design.md`（§4 見える化ロジック定義・§6 API）。

---

## 前提・既存資産（変更しないもの）

- 所有チェック: `currentAccountId(req)` / `ownsChild(accountId, childId)` … `src/lib/auth/accounts.ts`
- 単元プール: `subjectPool(subject, grade)` / `TEST_SUBJECTS` / `subjectKind` … `src/lib/test/pool.ts`
- 学齢→学年: `STAGE_GRADES: Record<Stage, string[]>`（例 `elementary: ["小4","小5","小6"]`）/ `Stage` … `src/lib/stage.ts`
- 子の学齢: `ChildRow.stage`（`getChild(id)` で取得）
- 既存 Store メソッド `getChildProgress` はそのまま（教科別合計のみ・ハブ用）。今回は生行を返す新メソッドを足す。
- attempts 列: `child_id, subject, unit_id, correct, source, created_at`（Postgres=TIMESTAMPTZ / SQLite=`CURRENT_TIMESTAMP` の UTC 文字列）。
- test_results 列: `child_id, subject, unit_ids, test_key, total, score, taken_at`。

## 見える化ロジックの定義（設計書 §4 の実装値）

- **制覇 (mastered):** その単元の `累計正答率 ≥ 0.7` **かつ** `累計試行数 ≥ 5`。
- **全体%:** 制覇単元数 / 対象単元数。対象＝その子の学齢の `TEST_SUBJECTS × STAGE_GRADES[stage]` を `subjectPool` で列挙した単元集合。
- **教科%:** その教科の制覇（対象）単元数 / その教科の対象単元数。
- **のべ問題数:** attempts の件数。**レベル:** `Lv = floor(sqrt(total/10)) + 1`。
- **継続:** 連続日数（今日/前日アンカーから遡って連続する学習日）／今月の学習日数／のべ学習日数。日付は **JST**。
- **今日:** JST 今日の attempts の 問題数・正答率・教科別、test_results の テスト回数。
- **単元別 推移:** 単元の時系列 attempts を最大 5 区間に等分した各区間の正答率（スパークライン）＋方向（↑→↓）。

## ファイル構成（このプランで作る/触る）

- Create: `src/lib/progress-stats/time.ts` … JST 日付キー・日付加算（純）
- Create: `src/lib/progress-stats/types.ts` … 入出力型
- Create: `src/lib/progress-stats/stats.ts` … 単元集約・制覇・レベル・学習日/継続（純）
- Create: `src/lib/progress-stats/targets.ts` … 学齢の対象単元集合（純, `pool`/`STAGE_GRADES` 利用）
- Create: `src/lib/progress-stats/overall.ts` … 全体の進捗の合成（純）
- Create: `src/lib/progress-stats/subject.ts` … 教科の進捗＋単元別推移（純）
- Create: `src/lib/progress-stats/today.ts` … 今日の頑張り（純）
- Create: `src/lib/progress-stats/index.ts` … re-export
- Create（各 `__tests__/*.test.ts`）
- Modify: `src/lib/db/index.ts` … `Store` に `listAttempts` / `listTestResults` を追加（4 実装）
- Modify: `src/lib/db/read.ts` … 上記の読み取りラッパを公開
- Create: `src/app/api/progress/overall/route.ts` / `subject/route.ts` / `today/route.ts`
- Create: `src/app/api/progress/__tests__/*.test.ts`

---

## Task 1: JST 時刻ヘルパー（time.ts）

**Files:**
- Create: `src/lib/progress-stats/time.ts`
- Test: `src/lib/progress-stats/__tests__/time.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/progress-stats/__tests__/time.test.ts
import { expect, test } from "vitest";
import { toJstDateKey, jstMonthKey, addDaysKey } from "@/lib/progress-stats/time";

test("UTC エポックmsを JST 日付キーに変換（+9h 境界）", () => {
  // 2026-09-20T14:59:59Z は JST では 2026-09-20 23:59:59
  expect(toJstDateKey(Date.parse("2026-09-20T14:59:59Z"))).toBe("2026-09-20");
  // 2026-09-20T15:00:00Z は JST では 2026-09-21 00:00:00（日付が繰り上がる）
  expect(toJstDateKey(Date.parse("2026-09-20T15:00:00Z"))).toBe("2026-09-21");
});

test("jstMonthKey は YYYY-MM", () => {
  expect(jstMonthKey(Date.parse("2026-09-20T15:00:00Z"))).toBe("2026-09");
});

test("addDaysKey は日付キーを暦どおりに加減算（月跨ぎ）", () => {
  expect(addDaysKey("2026-09-20", -1)).toBe("2026-09-19");
  expect(addDaysKey("2026-03-01", -1)).toBe("2026-02-28");
  expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/time.test.ts`
Expected: FAIL（`Cannot find module '@/lib/progress-stats/time'`）

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/progress-stats/time.ts
/**
 * JST（UTC+9）で日付を判定する純ヘルパー。
 * 入力は「UTC エポックミリ秒」に正規化済みの number（Store 側で変換）。
 * これにより SQLite / Postgres の日時文字列フォーマット差を純関数に持ち込まない。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC エポックms → "YYYY-MM-DD"（JST の暦日）。 */
export function toJstDateKey(ms: number): string {
  return keyFromUtcMs(ms + JST_OFFSET_MS);
}

/** UTC エポックms → "YYYY-MM"（JST の暦月）。 */
export function jstMonthKey(ms: number): string {
  return toJstDateKey(ms).slice(0, 7);
}

/** 日付キー "YYYY-MM-DD" に delta 日を足した日付キー。 */
export function addDaysKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return keyFromUtcMs(Date.UTC(y, m - 1, d) + delta * 86_400_000);
}

/** UTC の暦日で "YYYY-MM-DD" を作る（JST シフトはしない内部関数）。 */
function keyFromUtcMs(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/time.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/progress-stats/time.ts src/lib/progress-stats/__tests__/time.test.ts
git commit -m "feat(progress-stats): JST 日付キー・日付加算の純ヘルパー"
```

---

## Task 2: 型＋集約/制覇/レベル/継続（stats.ts）

**Files:**
- Create: `src/lib/progress-stats/types.ts`
- Create: `src/lib/progress-stats/stats.ts`
- Test: `src/lib/progress-stats/__tests__/stats.test.ts`

- [ ] **Step 1: 型を書く**

```ts
// src/lib/progress-stats/types.ts
/** attempts 1 件（Store が UTC エポックms に正規化して返す）。 */
export interface AttemptRecord {
  subject: string;
  unitId: string;
  correct: boolean;
  createdAtMs: number;
}

/** test_results 1 件（takenAtMs は UTC エポックms）。 */
export interface TestRecord {
  subject: string;
  testKey: string;
  total: number;
  score: number;
  takenAtMs: number;
}

/** 単元ごとの累計集約。 */
export interface UnitAgg {
  subject: string;
  unitId: string;
  attempts: number;
  correct: number;
}

/** レベル情報。 */
export interface LevelInfo {
  level: number;
  current: number; // 現レベル開始点からの到達数
  span: number; // 現→次レベルに必要な数
  toNext: number; // 次レベルまでの残り
}

/** 継続情報。 */
export interface StreakInfo {
  current: number; // 連続日数
  thisMonth: number; // 今月の学習日数
  totalDays: number; // のべ学習日数
}
```

- [ ] **Step 2: 失敗するテストを書く**

```ts
// src/lib/progress-stats/__tests__/stats.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord } from "@/lib/progress-stats/types";
import {
  aggregateByUnit,
  isMastered,
  levelForTotal,
  dateKeysOf,
  totalLearningDays,
  daysInMonth,
  currentStreak,
} from "@/lib/progress-stats/stats";

function at(unitId: string, correct: boolean, iso: string): AttemptRecord {
  return { subject: "math", unitId, correct, createdAtMs: Date.parse(iso) };
}

test("aggregateByUnit は単元ごとに試行数・正答数を集計", () => {
  const recs = [
    at("u1", true, "2026-09-20T01:00:00Z"),
    at("u1", false, "2026-09-20T02:00:00Z"),
    at("u2", true, "2026-09-20T03:00:00Z"),
  ];
  const agg = aggregateByUnit(recs);
  const u1 = agg.find((a) => a.unitId === "u1")!;
  expect(u1.attempts).toBe(2);
  expect(u1.correct).toBe(1);
});

test("制覇=累計正答率≥0.7 かつ 累計≥5問", () => {
  expect(isMastered({ subject: "s", unitId: "u", attempts: 5, correct: 4 })).toBe(true); // 0.8
  expect(isMastered({ subject: "s", unitId: "u", attempts: 5, correct: 3 })).toBe(false); // 0.6
  expect(isMastered({ subject: "s", unitId: "u", attempts: 4, correct: 4 })).toBe(false); // 4問=不足
  expect(isMastered({ subject: "s", unitId: "u", attempts: 10, correct: 7 })).toBe(true); // 0.7 ちょうど
});

test("レベルは floor(sqrt(total/10))+1、境界と残りが整合", () => {
  expect(levelForTotal(0)).toEqual({ level: 1, current: 0, span: 10, toNext: 10 });
  expect(levelForTotal(10)).toEqual({ level: 2, current: 0, span: 30, toNext: 30 });
  expect(levelForTotal(15).level).toBe(2);
  expect(levelForTotal(40)).toEqual({ level: 3, current: 0, span: 50, toNext: 50 });
});

test("学習日集合・のべ日数・今月日数", () => {
  const recs = [
    at("u", true, "2026-09-20T01:00:00Z"),
    at("u", true, "2026-09-20T05:00:00Z"), // 同日
    at("u", true, "2026-09-19T05:00:00Z"),
    at("u", true, "2026-08-31T05:00:00Z"),
  ];
  const keys = dateKeysOf(recs);
  expect(keys).toEqual(["2026-08-31", "2026-09-19", "2026-09-20"]);
  expect(totalLearningDays(keys)).toBe(3);
  expect(daysInMonth(keys, "2026-09")).toBe(2);
});

test("連続日数: 今日を含む連続を数える", () => {
  const keys = ["2026-09-18", "2026-09-19", "2026-09-20"];
  expect(currentStreak(keys, "2026-09-20")).toBe(3);
});

test("連続日数: 今日未学習でも前日まで連続なら継続（1日の猶予）", () => {
  const keys = ["2026-09-18", "2026-09-19"];
  expect(currentStreak(keys, "2026-09-20")).toBe(2);
});

test("連続日数: 2日以上空いていれば 0", () => {
  const keys = ["2026-09-17"];
  expect(currentStreak(keys, "2026-09-20")).toBe(0);
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/stats.test.ts`
Expected: FAIL（module 未実装）

- [ ] **Step 4: 実装を書く**

```ts
// src/lib/progress-stats/stats.ts
import type { AttemptRecord, UnitAgg, LevelInfo } from "./types";
import { toJstDateKey, addDaysKey } from "./time";

/** 制覇しきい値（設計書 §4）。 */
export const MASTERY_RATE = 0.7;
export const MASTERY_MIN_ATTEMPTS = 5;

/** attempts を単元ごとに集約。 */
export function aggregateByUnit(records: AttemptRecord[]): UnitAgg[] {
  const map = new Map<string, UnitAgg>();
  for (const r of records) {
    const cur =
      map.get(r.unitId) ??
      { subject: r.subject, unitId: r.unitId, attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (r.correct) cur.correct += 1;
    map.set(r.unitId, cur);
  }
  return [...map.values()];
}

/** 制覇判定: 累計正答率 ≥ 0.7 かつ 累計 ≥ 5 問。 */
export function isMastered(a: UnitAgg): boolean {
  return (
    a.attempts >= MASTERY_MIN_ATTEMPTS &&
    a.correct / a.attempts >= MASTERY_RATE
  );
}

/** のべ問題数 → レベル。Lv = floor(sqrt(total/10)) + 1。 */
export function levelForTotal(total: number): LevelInfo {
  const level = Math.floor(Math.sqrt(total / 10)) + 1;
  const base = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { level, current: total - base, span: next - base, toNext: next - total };
}

/** attempts の JST 日付キー（昇順・ユニーク）。 */
export function dateKeysOf(records: AttemptRecord[]): string[] {
  const set = new Set(records.map((r) => toJstDateKey(r.createdAtMs)));
  return [...set].sort();
}

/** のべ学習日数。 */
export function totalLearningDays(keys: string[]): number {
  return new Set(keys).size;
}

/** 今月（monthKey="YYYY-MM"）の学習日数。 */
export function daysInMonth(keys: string[], monthKey: string): number {
  return new Set(keys.filter((k) => k.startsWith(monthKey + "-"))).size;
}

/**
 * 連続日数。今日（todayKey）または前日をアンカーに遡って連続する日数。
 * 今日未学習でも前日まで続いていれば継続扱い（1日の猶予）。2日以上空けば 0。
 */
export function currentStreak(keys: string[], todayKey: string): number {
  const set = new Set(keys);
  let anchor = todayKey;
  if (!set.has(anchor)) {
    anchor = addDaysKey(todayKey, -1);
    if (!set.has(anchor)) return 0;
  }
  let count = 0;
  let cur = anchor;
  while (set.has(cur)) {
    count += 1;
    cur = addDaysKey(cur, -1);
  }
  return count;
}
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/stats.test.ts`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/lib/progress-stats/types.ts src/lib/progress-stats/stats.ts src/lib/progress-stats/__tests__/stats.test.ts
git commit -m "feat(progress-stats): 単元集約・制覇・レベル・継続の純関数"
```

---

## Task 3: 学齢の対象単元集合（targets.ts）

**Files:**
- Create: `src/lib/progress-stats/targets.ts`
- Test: `src/lib/progress-stats/__tests__/targets.test.ts`

対象単元＝`TEST_SUBJECTS × STAGE_GRADES[stage]` を `subjectPool` で列挙し、教科ごとに重複除去した単元 id 集合。`subjectPool` は「問題を1問以上持つ単元」だけを返す（空単元は対象から除外）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/progress-stats/__tests__/targets.test.ts
import { expect, test } from "vitest";
import { stageTargetUnits } from "@/lib/progress-stats/targets";
import { STAGE_GRADES } from "@/lib/stage";
import { subjectPool, TEST_SUBJECTS } from "@/lib/test/pool";

test("小学生の対象単元は 各教科×小4-6 の subjectPool の和（重複なし）", () => {
  const t = stageTargetUnits("elementary");
  // 期待値を実データから独立に再計算して照合する
  const expected: Record<string, string[]> = {};
  let expectedTotal = 0;
  for (const s of TEST_SUBJECTS) {
    const set = new Set<string>();
    for (const g of STAGE_GRADES.elementary) {
      for (const u of subjectPool(s, g)) set.add(u);
    }
    expected[s] = [...set];
    expectedTotal += set.size;
  }
  for (const s of TEST_SUBJECTS) {
    expect(new Set(t.bySubject[s])).toEqual(new Set(expected[s]));
  }
  expect(t.total).toBe(expectedTotal);
  expect(t.total).toBeGreaterThan(0); // 小学生は単元が存在する
});

test("bySubject は全 TEST_SUBJECTS のキーを持ち、total は各教科の和", () => {
  const t = stageTargetUnits("junior");
  expect(Object.keys(t.bySubject).sort()).toEqual([...TEST_SUBJECTS].sort());
  const sum = Object.values(t.bySubject).reduce((n, arr) => n + arr.length, 0);
  expect(t.total).toBe(sum);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/targets.test.ts`
Expected: FAIL（module 未実装）

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/progress-stats/targets.ts
import type { Stage } from "@/lib/stage";
import { STAGE_GRADES } from "@/lib/stage";
import { TEST_SUBJECTS, subjectPool } from "@/lib/test/pool";

/** 学齢の対象単元集合（教科別 id 配列と総数）。 */
export interface TargetUnits {
  bySubject: Record<string, string[]>;
  total: number;
}

/**
 * その学齢で「対象となる全単元」を教科別に列挙する。
 * 各教科について STAGE_GRADES[stage] の全学年の subjectPool を集めて重複除去。
 * subjectPool は出題可能（1問以上）な単元のみを返すため、空単元は自動的に除外される。
 */
export function stageTargetUnits(stage: Stage): TargetUnits {
  const bySubject: Record<string, string[]> = {};
  let total = 0;
  const grades = STAGE_GRADES[stage] ?? [];
  for (const subject of TEST_SUBJECTS) {
    const set = new Set<string>();
    for (const grade of grades) {
      for (const unitId of subjectPool(subject, grade)) set.add(unitId);
    }
    bySubject[subject] = [...set];
    total += set.size;
  }
  return { bySubject, total };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/targets.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/progress-stats/targets.ts src/lib/progress-stats/__tests__/targets.test.ts
git commit -m "feat(progress-stats): 学齢の対象単元集合を pool から列挙"
```

---

## Task 4: 全体の進捗の合成（overall.ts）

**Files:**
- Create: `src/lib/progress-stats/overall.ts`
- Test: `src/lib/progress-stats/__tests__/overall.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/progress-stats/__tests__/overall.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord } from "@/lib/progress-stats/types";
import { overallStats } from "@/lib/progress-stats/overall";
import { stageTargetUnits } from "@/lib/progress-stats/targets";

/** ある教科の対象単元を1つ取り、その単元を n 回・全問正解で埋める。 */
function masterUnit(subject: string, unitId: string, n: number): AttemptRecord[] {
  return Array.from({ length: n }, (_, i) => ({
    subject,
    unitId,
    correct: true,
    createdAtMs: Date.parse("2026-09-20T01:00:00Z") + i * 1000,
  }));
}

test("制覇0のとき全体%は0・のべ0・レベル1", () => {
  const r = overallStats([], "elementary");
  expect(r.overall.masteredUnits).toBe(0);
  expect(r.overall.percent).toBe(0);
  expect(r.totalAttempts).toBe(0);
  expect(r.level.level).toBe(1);
  expect(r.overall.targetUnits).toBe(stageTargetUnits("elementary").total);
});

test("対象単元を1つ制覇すると全体・教科の分子が1増える", () => {
  const t = stageTargetUnits("elementary");
  // math の対象単元を1つ選ぶ
  const unitId = t.bySubject["math"][0];
  const recs = masterUnit("math", unitId, 5); // 5問全正解=制覇
  const r = overallStats(recs, "elementary");
  expect(r.overall.masteredUnits).toBe(1);
  expect(r.bySubject["math"].masteredUnits).toBe(1);
  expect(r.bySubject["math"].targetUnits).toBe(t.bySubject["math"].length);
  expect(r.totalAttempts).toBe(5);
  expect(r.totalCorrect).toBe(5);
  // 全体% = 1 / total（丸めは百分率整数）
  expect(r.overall.percent).toBe(Math.round((1 / t.total) * 100));
});

test("対象外の単元を制覇しても分子には数えない（total 攻撃防止）", () => {
  const recs = masterUnit("math", "not-a-real-unit-xyz", 5);
  const r = overallStats(recs, "elementary");
  expect(r.overall.masteredUnits).toBe(0);
  expect(r.totalAttempts).toBe(5); // のべには数える
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/overall.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/progress-stats/overall.ts
import type { Stage } from "@/lib/stage";
import type { AttemptRecord, LevelInfo, StreakInfo } from "./types";
import {
  aggregateByUnit,
  isMastered,
  levelForTotal,
  dateKeysOf,
  totalLearningDays,
  daysInMonth,
  currentStreak,
} from "./stats";
import { stageTargetUnits } from "./targets";
import { toJstDateKey, jstMonthKey } from "./time";

/** 単一スコープ（全体 or 教科）の制覇割合。 */
export interface MasteryShare {
  masteredUnits: number;
  targetUnits: number;
  percent: number; // 0..100 の整数
}

/** 全体の進捗ページに必要な集計一式。 */
export interface OverallStats {
  stage: Stage;
  overall: MasteryShare;
  bySubject: Record<string, MasteryShare>;
  totalAttempts: number;
  totalCorrect: number;
  level: LevelInfo;
  streak: StreakInfo;
}

function share(mastered: number, target: number): MasteryShare {
  return {
    masteredUnits: mastered,
    targetUnits: target,
    percent: target > 0 ? Math.round((mastered / target) * 100) : 0,
  };
}

/**
 * 全体の進捗を合成する。
 * @param records その子の全 attempts（UTC エポックms 正規化済み）
 * @param stage   その子の学齢
 * @param nowMs   「今月/連続日数」の基準時刻（既定 Date.now()）。テストで固定可。
 */
export function overallStats(
  records: AttemptRecord[],
  stage: Stage,
  nowMs: number = Date.now(),
): OverallStats {
  const target = stageTargetUnits(stage);

  const bySubject: Record<string, MasteryShare> = {};
  let overallMastered = 0;
  for (const [subject, unitIds] of Object.entries(target.bySubject)) {
    // その教科の記録だけを集約する。単元 id が教科をまたいで衝突しても
    // 集約が混ざらない（教科横断で unitId 単独キーにしない）。
    const agg = aggregateByUnit(records.filter((r) => r.subject === subject));
    const masteredIds = new Set(agg.filter(isMastered).map((a) => a.unitId));
    const m = unitIds.filter((id) => masteredIds.has(id)).length; // 対象単元のみ数える
    bySubject[subject] = share(m, unitIds.length);
    overallMastered += m;
  }

  const totalAttempts = records.length;
  const totalCorrect = records.reduce((n, r) => n + (r.correct ? 1 : 0), 0);
  const keys = dateKeysOf(records);

  return {
    stage,
    overall: share(overallMastered, target.total),
    bySubject,
    totalAttempts,
    totalCorrect,
    level: levelForTotal(totalAttempts),
    streak: {
      current: currentStreak(keys, toJstDateKey(nowMs)),
      thisMonth: daysInMonth(keys, jstMonthKey(nowMs)),
      totalDays: totalLearningDays(keys),
    },
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/overall.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/progress-stats/overall.ts src/lib/progress-stats/__tests__/overall.test.ts
git commit -m "feat(progress-stats): 全体の進捗（全体%/教科%/のべ/レベル/継続）の合成"
```

---

## Task 5: 教科の進捗＋単元別推移（subject.ts）

**Files:**
- Create: `src/lib/progress-stats/subject.ts`
- Test: `src/lib/progress-stats/__tests__/subject.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/progress-stats/__tests__/subject.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord } from "@/lib/progress-stats/types";
import { subjectStats, unitTrend } from "@/lib/progress-stats/subject";
import { stageTargetUnits } from "@/lib/progress-stats/targets";

function recs(
  subject: string,
  unitId: string,
  pattern: boolean[],
): AttemptRecord[] {
  const base = Date.parse("2026-09-20T00:00:00Z");
  return pattern.map((correct, i) => ({
    subject,
    unitId,
    correct,
    createdAtMs: base + i * 60_000,
  }));
}

test("subjectStats は対象単元をすべて列挙し、未挑戦も0で含む", () => {
  const t = stageTargetUnits("elementary");
  const subject = "math";
  const unitId = t.bySubject[subject][0];
  const r = subjectStats(recs(subject, unitId, [true, true, true, true, true]), subject, "elementary");
  expect(r.targetUnits).toBe(t.bySubject[subject].length);
  expect(r.units.length).toBe(t.bySubject[subject].length);
  const first = r.units.find((u) => u.unitId === unitId)!;
  expect(first.attempts).toBe(5);
  expect(first.rate).toBe(1);
  expect(first.mastered).toBe(true);
  // 触っていない単元は 0 試行で含まれる
  const untouched = r.units.find((u) => u.attempts === 0);
  expect(untouched).toBeTruthy();
});

test("unitTrend は時系列を最大5区間に等分した正答率＋方向", () => {
  // 前半×→後半○ で上昇
  const pattern = [false, false, false, false, false, true, true, true, true, true];
  const trend = unitTrend(recs("math", "u", pattern));
  expect(trend.spark.length).toBe(5);
  expect(trend.spark[0]).toBe(0);
  expect(trend.spark[4]).toBe(1);
  expect(trend.direction).toBe("up");
});

test("unitTrend は試行が少なくても壊れない", () => {
  const trend = unitTrend(recs("math", "u", [true]));
  expect(trend.spark.length).toBeGreaterThan(0);
  expect(trend.direction).toBe("flat");
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/subject.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/progress-stats/subject.ts
import type { Stage } from "@/lib/stage";
import type { AttemptRecord } from "./types";
import { isMastered } from "./stats";
import { stageTargetUnits } from "./targets";

/** 単元別の推移（スパークライン）。 */
export interface UnitTrend {
  spark: number[]; // 各区間の正答率 0..1（最大5点）
  direction: "up" | "flat" | "down";
}

/** 教科ページの単元1行。 */
export interface UnitProgress {
  unitId: string;
  attempts: number;
  correct: number;
  rate: number; // 累計正答率 0..1
  mastered: boolean;
  trend: UnitTrend;
}

/** 教科の進捗一式。 */
export interface SubjectStats {
  subject: string;
  masteredUnits: number;
  targetUnits: number;
  percent: number; // 0..100 の整数
  units: UnitProgress[];
}

const MAX_BUCKETS = 5;

/**
 * 単元の時系列 attempts を最大5区間に等分し、各区間の正答率を出す。
 * direction は「後半の平均 − 前半の平均」で ↑→↓ を判定（差 > 0.1 で有意）。
 */
export function unitTrend(records: AttemptRecord[]): UnitTrend {
  const sorted = [...records].sort((a, b) => a.createdAtMs - b.createdAtMs);
  const n = sorted.length;
  if (n === 0) return { spark: [], direction: "flat" };

  const buckets = Math.min(MAX_BUCKETS, n);
  const spark: number[] = [];
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor((b * n) / buckets);
    const end = Math.floor(((b + 1) * n) / buckets);
    const slice = sorted.slice(start, end);
    const rate = slice.length
      ? slice.filter((r) => r.correct).length / slice.length
      : 0;
    spark.push(rate);
  }

  const half = Math.floor(spark.length / 2);
  const early = spark.slice(0, half);
  const late = spark.slice(spark.length - half);
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
  const delta = half > 0 ? avg(late) - avg(early) : 0;
  const direction = delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat";
  return { spark, direction };
}

/**
 * 教科の進捗。対象単元（学齢の subjectPool）をすべて行にし、
 * 触っていない単元も 0 試行で含める（一覧の抜けを防ぐ）。
 */
export function subjectStats(
  records: AttemptRecord[],
  subject: string,
  stage: Stage,
): SubjectStats {
  const target = stageTargetUnits(stage);
  const targetIds = target.bySubject[subject] ?? [];
  const forSubject = records.filter((r) => r.subject === subject);
  const byUnit = new Map<string, AttemptRecord[]>();
  for (const r of forSubject) {
    const arr = byUnit.get(r.unitId) ?? [];
    arr.push(r);
    byUnit.set(r.unitId, arr);
  }

  let mastered = 0;
  const units: UnitProgress[] = targetIds.map((unitId) => {
    const rs = byUnit.get(unitId) ?? [];
    const attempts = rs.length;
    const correct = rs.filter((r) => r.correct).length;
    const isM = isMastered({ subject, unitId, attempts, correct });
    if (isM) mastered += 1;
    return {
      unitId,
      attempts,
      correct,
      rate: attempts > 0 ? correct / attempts : 0,
      mastered: isM,
      trend: unitTrend(rs),
    };
  });

  return {
    subject,
    masteredUnits: mastered,
    targetUnits: targetIds.length,
    percent: targetIds.length > 0 ? Math.round((mastered / targetIds.length) * 100) : 0,
    units,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/subject.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/progress-stats/subject.ts src/lib/progress-stats/__tests__/subject.test.ts
git commit -m "feat(progress-stats): 教科の進捗＋単元別推移スパークライン"
```

---

## Task 6: 今日の頑張り（today.ts）＋ index.ts

**Files:**
- Create: `src/lib/progress-stats/today.ts`
- Create: `src/lib/progress-stats/index.ts`
- Test: `src/lib/progress-stats/__tests__/today.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/progress-stats/__tests__/today.test.ts
import { expect, test } from "vitest";
import type { AttemptRecord, TestRecord } from "@/lib/progress-stats/types";
import { todayStats } from "@/lib/progress-stats/today";

const TODAY = "2026-09-20";
// JST 2026-09-20 は UTC 2026-09-19T15:00 〜 2026-09-20T14:59
const inToday = Date.parse("2026-09-20T01:00:00Z"); // JST 10:00 当日
const yesterday = Date.parse("2026-09-19T10:00:00Z"); // JST 前日 19:00

function at(subject: string, correct: boolean, ms: number): AttemptRecord {
  return { subject, unitId: "u", correct, createdAtMs: ms };
}

test("todayStats は JST 今日の attempts のみ集計（教科別内訳つき）", () => {
  const recs = [
    at("math", true, inToday),
    at("math", false, inToday),
    at("science", true, inToday),
    at("math", true, yesterday), // 前日は除外
  ];
  const r = todayStats(recs, [], TODAY);
  expect(r.total).toBe(3);
  expect(r.correct).toBe(2);
  expect(r.bySubject["math"]).toEqual({ attempts: 2, correct: 1 });
  expect(r.bySubject["science"]).toEqual({ attempts: 1, correct: 1 });
});

test("todayStats は今日のテスト回数を数える", () => {
  const tests: TestRecord[] = [
    { subject: "math", testKey: "k", total: 5, score: 4, takenAtMs: inToday },
    { subject: "math", testKey: "k", total: 5, score: 5, takenAtMs: yesterday },
  ];
  const r = todayStats([], tests, TODAY);
  expect(r.testCount).toBe(1);
});

test("何もしていない日は total0・rate0", () => {
  const r = todayStats([], [], TODAY);
  expect(r.total).toBe(0);
  expect(r.rate).toBe(0);
  expect(r.testCount).toBe(0);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/today.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/progress-stats/today.ts
import type { AttemptRecord, TestRecord } from "./types";
import { toJstDateKey } from "./time";

/** 今日の頑張り一式。 */
export interface TodayStats {
  total: number;
  correct: number;
  rate: number; // 0..1
  bySubject: Record<string, { attempts: number; correct: number }>;
  testCount: number;
}

/**
 * JST 今日（todayKey="YYYY-MM-DD"）の attempts / tests を集計する。
 * todayKey は API 側で toJstDateKey(Date.now()) を渡す（テストは固定値）。
 */
export function todayStats(
  records: AttemptRecord[],
  tests: TestRecord[],
  todayKey: string,
): TodayStats {
  const today = records.filter((r) => toJstDateKey(r.createdAtMs) === todayKey);
  const bySubject: Record<string, { attempts: number; correct: number }> = {};
  let correct = 0;
  for (const r of today) {
    const cur = bySubject[r.subject] ?? { attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (r.correct) {
      cur.correct += 1;
      correct += 1;
    }
    bySubject[r.subject] = cur;
  }
  const total = today.length;
  const testCount = tests.filter(
    (t) => toJstDateKey(t.takenAtMs) === todayKey,
  ).length;
  return {
    total,
    correct,
    rate: total > 0 ? correct / total : 0,
    bySubject,
    testCount,
  };
}
```

- [ ] **Step 4: index.ts を書く**

```ts
// src/lib/progress-stats/index.ts
export * from "./types";
export * from "./time";
export * from "./stats";
export * from "./targets";
export * from "./overall";
export * from "./subject";
export * from "./today";
```

- [ ] **Step 5: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-stats/__tests__/today.test.ts`
Expected: PASS

- [ ] **Step 6: コミット**

```bash
git add src/lib/progress-stats/today.ts src/lib/progress-stats/index.ts src/lib/progress-stats/__tests__/today.test.ts
git commit -m "feat(progress-stats): 今日の頑張り集計＋index re-export"
```

---

## Task 7: Store に生行取得を追加（listAttempts / listTestResults）

**Files:**
- Modify: `src/lib/db/index.ts`（`AttemptRow`/`TestResultFullRow` 型・`Store` インターフェイス・Postgres/Sqlite/Noop の3実装）
- Modify: `src/lib/db/read.ts`（読み取りラッパ公開）
- Test: `src/lib/db/__tests__/progress-rows.test.ts`

時刻は **UTC エポックミリ秒 (number)** で返す（Postgres=`EXTRACT(EPOCH ...)`、SQLite=`strftime('%s', ...)`）。これで純関数側は日時文字列の差異を意識しない。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/db/__tests__/progress-rows.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-prog-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

test("listAttempts は childId の attempts を UTC エポックms 付きで返す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.recordAttempt("a1", "c1", "math", "div-basic", true, "practice");
  await s.recordAttempt("a2", "c1", "science", "xb-1", false, "test");
  await s.recordAttempt("a3", "other", "math", "div-basic", true, "practice");

  const rows = await s.listAttempts("c1");
  expect(rows.length).toBe(2);
  const r0 = rows.find((r) => r.subject === "math")!;
  expect(r0.unitId).toBe("div-basic");
  expect(r0.correct).toBe(true);
  expect(typeof r0.createdAtMs).toBe("number");
  expect(r0.createdAtMs).toBeGreaterThan(0);
  // 別 child のデータは混ざらない
  expect(rows.every((r) => r.subject !== undefined)).toBe(true);
});

test("listTestResults は childId のテスト結果を takenAtMs 付きで返す", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.recordTestResult({
    id: "t1", childId: "c1", subject: "math",
    unitIds: "div-basic", testKey: "math|div-basic", total: 5, score: 4,
  });
  const rows = await s.listTestResults("c1");
  expect(rows.length).toBe(1);
  expect(rows[0].score).toBe(4);
  expect(typeof rows[0].takenAtMs).toBe("number");
  expect(await s.listTestResults("nobody")).toEqual([]);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/db/__tests__/progress-rows.test.ts`
Expected: FAIL（`listAttempts` は Store に無い）

- [ ] **Step 3: 型と Store インターフェイスを足す**

`src/lib/db/index.ts` の `TestResultRow` インターフェイス定義の直後（`export interface Store {` の前）に追加:

```ts
/** attempts 1 行（進捗集計用・created_at は UTC エポックms）。 */
export interface AttemptRow {
  subject: string;
  unitId: string;
  correct: boolean;
  createdAtMs: number;
}

/** test_results 1 行（進捗集計用・taken_at は UTC エポックms）。 */
export interface TestResultFullRow {
  subject: string;
  testKey: string;
  total: number;
  score: number;
  takenAtMs: number;
}
```

`Store` インターフェイスの `getChildProgress(childId: string): Promise<ProgressSummary>;` の直後に追加:

```ts
  /** 進捗集計用: その子の全 attempts（created_at 昇順・UTC エポックms）。 */
  listAttempts(childId: string): Promise<AttemptRow[]>;
  /** 進捗集計用: その子の全 test_results（taken_at 昇順・UTC エポックms）。 */
  listTestResults(childId: string): Promise<TestResultFullRow[]>;
```

- [ ] **Step 4: PostgresStore に実装を足す**

`PostgresStore` の `getChildProgress` メソッドの直後に追加:

```ts
  async listAttempts(childId: string): Promise<AttemptRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT subject, unit_id, correct,
             (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_ms
      FROM attempts
      WHERE child_id = ${childId}
      ORDER BY created_at ASC
    `;
    return (rows as any[]).map((r) => ({
      subject: String(r.subject),
      unitId: String(r.unit_id),
      correct: Boolean(r.correct),
      createdAtMs: Number(r.created_ms ?? 0),
    }));
  }

  async listTestResults(childId: string): Promise<TestResultFullRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT subject, test_key, total, score,
             (EXTRACT(EPOCH FROM taken_at) * 1000)::bigint AS taken_ms
      FROM test_results
      WHERE child_id = ${childId}
      ORDER BY taken_at ASC
    `;
    return (rows as any[]).map((r) => ({
      subject: String(r.subject),
      testKey: String(r.test_key),
      total: Number(r.total ?? 0),
      score: Number(r.score ?? 0),
      takenAtMs: Number(r.taken_ms ?? 0),
    }));
  }
```

- [ ] **Step 5: SqliteStore に実装を足す**

`SqliteStore` の `getChildProgress` メソッドの直後に追加（SQLite の `created_at` は `CURRENT_TIMESTAMP`＝UTC 文字列なので `strftime('%s', ...)` で UTC 秒→ms）:

```ts
  async listAttempts(childId: string): Promise<AttemptRow[]> {
    await this.ready;
    const rows = this.withDb(
      (db) =>
        db
          .prepare(
            `SELECT subject, unit_id, correct,
                    CAST(strftime('%s', created_at) AS INTEGER) * 1000 AS created_ms
             FROM attempts
             WHERE child_id = ?
             ORDER BY created_at ASC, rowid ASC`,
          )
          .all(childId) as any[],
    );
    return rows.map((r) => ({
      subject: String(r.subject),
      unitId: String(r.unit_id),
      correct: Number(r.correct) === 1,
      createdAtMs: Number(r.created_ms ?? 0),
    }));
  }

  async listTestResults(childId: string): Promise<TestResultFullRow[]> {
    await this.ready;
    const rows = this.withDb(
      (db) =>
        db
          .prepare(
            `SELECT subject, test_key, total, score,
                    CAST(strftime('%s', taken_at) AS INTEGER) * 1000 AS taken_ms
             FROM test_results
             WHERE child_id = ?
             ORDER BY taken_at ASC, rowid ASC`,
          )
          .all(childId) as any[],
    );
    return rows.map((r) => ({
      subject: String(r.subject),
      testKey: String(r.test_key),
      total: Number(r.total ?? 0),
      score: Number(r.score ?? 0),
      takenAtMs: Number(r.taken_ms ?? 0),
    }));
  }
```

- [ ] **Step 6: NoopStore に実装を足す**

`NoopStore` の `getChildProgress` メソッドの直後に追加:

```ts
  async listAttempts(_childId: string): Promise<AttemptRow[]> {
    return [];
  }

  async listTestResults(_childId: string): Promise<TestResultFullRow[]> {
    return [];
  }
```

- [ ] **Step 7: テストが通ることを確認**

Run: `npx vitest run src/lib/db/__tests__/progress-rows.test.ts`
Expected: PASS（2 件緑）

- [ ] **Step 8: read.ts に読み取りラッパを足す**

`src/lib/db/read.ts` の型 re-export に `AttemptRow`, `TestResultFullRow` を追加し、末尾に関数を追加:

`export type { ... } from "./index";` のリストへ `AttemptRow` と `TestResultFullRow` を加える。ファイル末尾に:

```ts
/** その子の全 attempts（進捗集計用）。失敗時は空配列。 */
export async function listAttempts(
  childId: string,
): Promise<import("./index").AttemptRow[]> {
  try {
    return await getStore().listAttempts(childId);
  } catch (err) {
    console.error("[db:read] listAttempts failed:", err);
    return [];
  }
}

/** その子の全 test_results（進捗集計用）。失敗時は空配列。 */
export async function listTestResults(
  childId: string,
): Promise<import("./index").TestResultFullRow[]> {
  try {
    return await getStore().listTestResults(childId);
  } catch (err) {
    console.error("[db:read] listTestResults failed:", err);
    return [];
  }
}
```

- [ ] **Step 9: tsc で型を確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 10: コミット**

```bash
git add src/lib/db/index.ts src/lib/db/read.ts src/lib/db/__tests__/progress-rows.test.ts
git commit -m "feat(db): 進捗集計用に listAttempts/listTestResults（UTCエポックms正規化）"
```

---

## Task 8: `/api/progress/overall`

**Files:**
- Create: `src/app/api/progress/overall/route.ts`
- Test: `src/app/api/progress/__tests__/overall.route.test.ts`

共通の認可: `currentAccountId(req)` が無ければ 401。`childId` クエリ必須（無ければ 400）。`ownsChild(accountId, childId)` が false なら 403（他人の子は見せない）。子の `stage` は `getChild` から取得。

- [ ] **Step 1: 失敗するテストを書く**

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/app/api/progress/__tests__/overall.route.test.ts`
Expected: FAIL（route 未実装）

- [ ] **Step 3: 実装を書く**

```ts
// src/app/api/progress/overall/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild, getChild } from "@/lib/auth/accounts";
import { listAttempts } from "@/lib/db/read";
import { overallStats } from "@/lib/progress-stats";
import type { Stage } from "@/lib/stage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }
  if (!(await ownsChild(accountId, childId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const child = await getChild(childId);
  const stage = (child?.stage ?? "elementary") as Stage;
  const attempts = await listAttempts(childId);
  return NextResponse.json(overallStats(attempts, stage));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/app/api/progress/__tests__/overall.route.test.ts`
Expected: PASS（3 件緑）

- [ ] **Step 5: コミット**

```bash
git add src/app/api/progress/overall/route.ts src/app/api/progress/__tests__/overall.route.test.ts
git commit -m "feat(api): /api/progress/overall（session＋所有チェック）"
```

---

## Task 9: `/api/progress/subject`

**Files:**
- Create: `src/app/api/progress/subject/route.ts`
- Test: `src/app/api/progress/__tests__/subject.route.test.ts`

`subject` クエリも必須（`isTestSubject` で検証、不正なら 400）。認可は overall と同型。

- [ ] **Step 1: 失敗するテストを書く**

```ts
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
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/app/api/progress/__tests__/subject.route.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を書く**

```ts
// src/app/api/progress/subject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild, getChild } from "@/lib/auth/accounts";
import { listAttempts } from "@/lib/db/read";
import { subjectStats } from "@/lib/progress-stats";
import { isTestSubject } from "@/lib/test/pool";
import type { Stage } from "@/lib/stage";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  const subject = req.nextUrl.searchParams.get("subject");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }
  if (!subject || !isTestSubject(subject)) {
    return NextResponse.json({ error: "invalid subject" }, { status: 400 });
  }
  if (!(await ownsChild(accountId, childId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const child = await getChild(childId);
  const stage = (child?.stage ?? "elementary") as Stage;
  const attempts = await listAttempts(childId);
  return NextResponse.json(subjectStats(attempts, subject, stage));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/app/api/progress/__tests__/subject.route.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/app/api/progress/subject/route.ts src/app/api/progress/__tests__/subject.route.test.ts
git commit -m "feat(api): /api/progress/subject（教科別・所有チェック）"
```

---

## Task 10: `/api/progress/today`

**Files:**
- Create: `src/app/api/progress/today/route.ts`
- Test: `src/app/api/progress/__tests__/today.route.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/app/api/progress/__tests__/today.route.test.ts
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "ai-sensei-ptoday-"));
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  delete process.env.AUTH_SECRET;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

async function reqFor(childId: string, token: string | null) {
  const { NextRequest } = await import("next/server");
  const { SESSION_COOKIE } = await import("@/lib/auth/session");
  const headers: Record<string, string> = {};
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  return new NextRequest(
    `http://localhost/api/progress/today?childId=${childId}`,
    { headers },
  );
}

test("未ログインは 401", async () => {
  const { GET } = await import("../today/route");
  const res = await GET(await reqFor("kid", null));
  expect(res.status).toBe(401);
});

test("自分の子は 200・今日解いた分が total に入る", async () => {
  const { getStore } = await import("@/lib/db");
  const s = getStore();
  await s.createAccount("acc-me", "me@example.com", "h");
  await s.createChild("kid", "acc-me", "こ", "elementary");
  // 今記録した attempt は JST 今日に入る
  await s.recordAttempt("x0", "kid", "math", "div-basic", true, "practice");
  await s.recordAttempt("x1", "kid", "math", "div-basic", false, "practice");
  const { signSession, SESSION_TTL_MS } = await import("@/lib/auth/session");
  const token = signSession("acc-me", SESSION_TTL_MS);

  const { GET } = await import("../today/route");
  const res = await GET(await reqFor("kid", token));
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.total).toBe(2);
  expect(body.correct).toBe(1);
  expect(body.bySubject.math).toEqual({ attempts: 2, correct: 1 });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/app/api/progress/__tests__/today.route.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を書く**

```ts
// src/app/api/progress/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild } from "@/lib/auth/accounts";
import { listAttempts, listTestResults } from "@/lib/db/read";
import { todayStats, toJstDateKey } from "@/lib/progress-stats";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }
  if (!(await ownsChild(accountId, childId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const [attempts, tests] = await Promise.all([
    listAttempts(childId),
    listTestResults(childId),
  ]);
  const todayKey = toJstDateKey(Date.now());
  return NextResponse.json(todayStats(attempts, tests, todayKey));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/app/api/progress/__tests__/today.route.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/app/api/progress/today/route.ts src/app/api/progress/__tests__/today.route.test.ts
git commit -m "feat(api): /api/progress/today（今日の頑張り・所有チェック）"
```

---

## Task 11: 全体検証

- [ ] **Step 1: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 2: 全テスト**

Run: `npx vitest run`
Expected: 既存 + 新規（time/stats/targets/overall/subject/today/progress-rows/3ルート）すべて緑

- [ ] **Step 3: ビルド**

Run: `npm run build`
Expected: 成功。`/api/progress/{overall,subject,today}` が route として出力される

- [ ] **Step 4: 差分を確認して不足がないか目視**

Run: `git status && git log --oneline -12`
Expected: 未コミットの変更が無い（全タスクがコミット済み）

---

## Self-Review（計画作成者による確認・記録）

- **Spec §4 カバレッジ:** 制覇=Task2/`isMastered`、全体%=Task4、教科%=Task5、のべ=Task4、レベル=Task2/4、継続(連続/今月/のべ)=Task2/4、今日=Task6、単元別推移=Task5。JST 境界=Task1。→ 全定義に対応タスクあり。
- **Spec §6 API:** overall=Task8、subject=Task9、today=Task10。所有チェック(403)・未ログイン(401)・不正入力(400)を各ルートテストで検証。記録系 API・`getChildId()` 拡張は A2 で完了済み（本プラン対象外）。
- **3系統DB:** listAttempts/listTestResults を Postgres/Sqlite/Noop の3実装に追加（Task7）。Noop は空配列で画面が壊れない。SQLite テストで実挙動を担保。Postgres は同一 SQL 契約（エポックms）で対称。
- **型整合:** `AttemptRecord`(純関数側, createdAtMs) と `AttemptRow`(Store側, createdAtMs) は同フィールドで直接代入可能。`Stage` は `@/lib/stage` の型を一貫使用。`overallStats`/`subjectStats` は `stage` を受ける。`todayStats` は `TestRecord[]` を受け、Store の `TestResultFullRow` と同フィールド。
- **非スコープ:** 画面（A4）・旧 /guardian 撤去は本プラン外。today のテスト内訳詳細（点数分布）は testCount のみに留め、詳細は A4 で必要になれば拡張。

## Notes（A4 への申し送り）

- 全体ページの「5教科ドーナツ（算/理/社/英/国）」は、`overallStats.bySubject`（7キー: math/science/social/history/geography/japanese/english）を **表示側で集約**する（中学は社会=history+geography を合算 or 併記）。集約は A4 の表示ロジックで行う（API は素の教科別を返す）。
- 教科ページ `/progress/[subject]` は `subjectStats.units[].trend.spark`（0..1 の最大5点）でスパークラインを描く。`mastered` で色/印。
