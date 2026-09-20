# A4 画面（認証・子選択・がんばり見える化）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 家族アカウントでログインし、子プロフィールを選んで「今日の頑張り／全体の進捗／教科の進捗」を別端末からでも見られる画面一式を作り、旧パスコード式 `/guardian` をアカウント制ダッシュボードへ置き換える。

**Architecture:** 認証・子・進捗の API（A1〜A3で実装済み）を叩くクライアント画面群。ダッシュボードは **クライアントコンポーネント**で、localStorage のアクティブ子 id（`getChildId()`）を `?childId=` に載せて `/api/progress/*` を fetch、401 なら `/login` へ誘導する。チャートは**依存追加なしの手書き SVG**（純粋な幾何関数＋presentational コンポーネント）。旧 `/guardian` 一式は削除し、各ページのヘッダ nav を新導線へ差し替える。**AI 不使用。**

**Tech Stack:** Next.js App Router（client components, `next/navigation` の `useRouter`/`redirect`）/ TypeScript / Tailwind（意味トークン `bg-paper`/`text-ink`/`text-sky`(=primary)/`text-terra`(=accent)/`border-line`/`shadow-card`、`data-stage` テーマ）/ Vitest（純関数のみ）。

**設計書:** `docs/superpowers/specs/2026-09-20-accounts-and-progress-design.md`（§5 画面構成・§6 API）。
**A3 申し送り（重要）:** `/api/progress/overall` の `bySubject` は **7教科**（math/science/social/history/geography/japanese/english）を返す。表示は **5教科（算/理/社/英/国）に集約**する（中学は 社会=history+geography を合算）。`overall.percent` の分母も history/geography 単元を含む。`/api/progress/today` は `tests: {subject,total,score}[]` を返す。

---

## 前提・既存資産

- 認証 API（実装済・本計画は叩くだけ）:
  - `POST /api/auth/signup` `{email,password}` → セッションCookie発行＋`{ok:true}` 相当。
  - `POST /api/auth/login` `{email,password}` → 成功でCookie、失敗 401。
  - `POST /api/auth/logout` → Cookie失効。
  - `GET /api/auth/me` → ログイン状態（`{accountId}` 等）。
  - `GET /api/children` → `{children: ChildRow[]}`（session必須・401）。`POST /api/children` `{name,stage}` → `{id}`。
  - `POST /api/children/claim` → 匿名記録を子へ引き継ぎ（所有チェック）。※リクエスト形は実装を確認して合わせる。
  - `GET /api/progress/{today,overall,subject}?childId=&subject=` → 401/400/403/200。
- クライアント状態: `src/lib/progress.ts` の `getChildId()`（アクティブ子id優先）/`getActiveChild`/`setActiveChild`/`clearActiveChild`。`src/lib/stage.ts` の `Stage`/`STAGES`/`STAGE_GRADES`/`getStageMeta`/`isStage`/`setStage`。
- 型: `OverallStats`/`SubjectStats`/`TodayStats`（`src/lib/progress-stats`）、`ChildRow`（`src/lib/db`）。**注意: これらはサーバ専用モジュール（`server-only`）を含むため、クライアントからは型だけを別途定義する**（下記 Task で JSON レスポンス用の軽量型をクライアント側に定義）。
- 教科メタ: `src/lib/quiz` の `SUBJECTS`（key/label/emoji/accent）。math のラベルは別途「算数🔢」。
- スタイル既存例: `src/app/HomeHub.tsx`（意味トークン・`Bar`・SSRガード `mounted` パターン・stageコピー）。ヘッダは各ページ `page.tsx` にインライン（共有ヘッダ無し）。

## 画面とルート

- `/signup`（メール＋パスワード作成）→ 成功で `/family` へ。
- `/login`（ログイン）→ 成功で `/family` へ。失敗はエラー表示。
- `/family`（ログイン後ハブ）: 子プロフィール一覧→選択（`setActiveChild`）→ 子ホーム `/` へ／プロフィール追加（名前＋学齢、任意で「この端末の記録を引き継ぐ」）／ログアウト。未ログイン（`/api/children` が401）なら `/login` へ。
- `/today`（今日の頑張り・独立ページ・layout A・子と一緒に見るトーン）。
- `/progress`（全体の進捗ダッシュボード）。
- `/progress/[subject]`（教科の進捗。`isTestSubject` で妥当な教科のみ）。
- 旧 `/guardian` 一式は削除。

## 見た目の方針（全ダッシュボード共通）

- 意味トークンのみ使用（数値スケール色は避ける）。カード＝`rounded-2xl border border-line bg-white/70 shadow-card p-5`。見出し＝`font-serif text-ink`。補助文＝`text-ink-soft`/`text-faint`。主要数値＝大きく `text-sky`（primary）、強調＝`text-terra`（accent）。
- SSR ガード（`mounted`）を守る。localStorage 読取は `useEffect` 後。
- reduced-motion 配慮（既存 globals.css の作法に合わせる。派手なアニメは足さない）。

---

## Task 1: 表示ヘルパー（7教科→5教科集約・ラベル）

**Files:**
- Create: `src/lib/progress-view.ts`
- Test: `src/lib/progress-view.test.ts`

7つの `TEST_SUBJECTS` を、表示用の5バケット（math=算数 / science=理科 / social=社会 / japanese=国語 / english=英語）に集約する。中学の `history`/`geography` は `social`（社会）に合算する。集約は `masteredUnits` と `targetUnits` を合算し、`percent` は合算後に再計算する（percentの平均ではない）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/progress-view.test.ts
import { expect, test } from "vitest";
import { groupSubjects, DISPLAY_SUBJECTS, displaySubjectMeta } from "@/lib/progress-view";

type Share = { masteredUnits: number; targetUnits: number; percent: number };

test("groupSubjects は history/geography を social に合算し percent を再計算", () => {
  const bySubject: Record<string, Share> = {
    math: { masteredUnits: 2, targetUnits: 10, percent: 20 },
    science: { masteredUnits: 1, targetUnits: 4, percent: 25 },
    social: { masteredUnits: 0, targetUnits: 0, percent: 0 },
    history: { masteredUnits: 3, targetUnits: 6, percent: 50 },
    geography: { masteredUnits: 1, targetUnits: 4, percent: 25 },
    japanese: { masteredUnits: 0, targetUnits: 2, percent: 0 },
    english: { masteredUnits: 5, targetUnits: 5, percent: 100 },
  };
  const g = groupSubjects(bySubject);
  const social = g.find((x) => x.key === "social")!;
  // social(0/0) + history(3/6) + geography(1/4) = 4/10 = 40%
  expect(social.masteredUnits).toBe(4);
  expect(social.targetUnits).toBe(10);
  expect(social.percent).toBe(40);
  const math = g.find((x) => x.key === "math")!;
  expect(math.percent).toBe(20);
});

test("groupSubjects は常に5バケットを DISPLAY_SUBJECTS の順で返す", () => {
  const g = groupSubjects({});
  expect(g.map((x) => x.key)).toEqual(DISPLAY_SUBJECTS.map((d) => d.key));
  expect(g.every((x) => x.percent === 0 && x.targetUnits === 0)).toBe(true);
});

test("displaySubjectMeta はラベル/絵文字を返す", () => {
  expect(displaySubjectMeta("math").label).toBe("算数");
  expect(displaySubjectMeta("social").label).toBe("社会");
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/progress-view.test.ts`
Expected: FAIL（module 未実装）

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/progress-view.ts
/**
 * 進捗の表示ヘルパー（クライアント安全・純関数）。
 * API の 7 教科（TEST_SUBJECTS）を、画面の 5 教科ドーナツ（算/理/社/英/国）へ集約する。
 * 中学の history / geography は social（社会）へ合算する。
 */

export interface SubjectShare {
  masteredUnits: number;
  targetUnits: number;
  percent: number;
}

/** 表示用 5 教科。key は「集約後」の教科キー。 */
export interface DisplaySubject {
  key: "math" | "science" | "social" | "japanese" | "english";
  label: string;
  emoji: string;
  /** その表示バケットに合算する API 教科キー。 */
  sources: string[];
}

export const DISPLAY_SUBJECTS: DisplaySubject[] = [
  { key: "math", label: "算数", emoji: "🔢", sources: ["math"] },
  { key: "science", label: "理科", emoji: "🔬", sources: ["science"] },
  { key: "social", label: "社会", emoji: "🗺️", sources: ["social", "history", "geography"] },
  { key: "japanese", label: "国語", emoji: "✍️", sources: ["japanese"] },
  { key: "english", label: "英語", emoji: "🔤", sources: ["english"] },
];

export interface GroupedShare extends SubjectShare {
  key: DisplaySubject["key"];
  label: string;
  emoji: string;
}

/** API の bySubject（7教科）を 5 表示教科へ集約。percent は合算後に再計算。 */
export function groupSubjects(
  bySubject: Record<string, SubjectShare>,
): GroupedShare[] {
  return DISPLAY_SUBJECTS.map((d) => {
    let mastered = 0;
    let target = 0;
    for (const src of d.sources) {
      const s = bySubject[src];
      if (s) {
        mastered += s.masteredUnits;
        target += s.targetUnits;
      }
    }
    return {
      key: d.key,
      label: d.label,
      emoji: d.emoji,
      masteredUnits: mastered,
      targetUnits: target,
      percent: target > 0 ? Math.round((mastered / target) * 100) : 0,
    };
  });
}

/** 表示教科メタ（ラベル/絵文字）を返す。未知キーは算数扱いのフォールバック。 */
export function displaySubjectMeta(key: string): DisplaySubject {
  return DISPLAY_SUBJECTS.find((d) => d.key === key) ?? DISPLAY_SUBJECTS[0];
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/progress-view.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/progress-view.ts src/lib/progress-view.test.ts
git commit -m "feat(progress-view): API7教科→表示5教科の集約ヘルパー"
```

---

## Task 2: チャート幾何（純関数：ドーナツ・スパークライン）

**Files:**
- Create: `src/lib/charts.ts`
- Test: `src/lib/charts.test.ts`

SVG 描画に必要な幾何だけを純関数化（コンポーネントから分離してテスト可能に）。

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/charts.test.ts
import { expect, test } from "vitest";
import { donutDash, sparklinePoints, clampPercent } from "@/lib/charts";

test("clampPercent は 0..100 に丸める", () => {
  expect(clampPercent(-5)).toBe(0);
  expect(clampPercent(150)).toBe(100);
  expect(clampPercent(47.6)).toBe(48);
});

test("donutDash は円周に対する dash 長を返す（percentに比例）", () => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const d0 = donutDash(0, r);
  const d100 = donutDash(100, r);
  const d50 = donutDash(50, r);
  expect(d0.dash).toBeCloseTo(0);
  expect(d0.gap).toBeCloseTo(circ);
  expect(d100.dash).toBeCloseTo(circ);
  expect(d50.dash).toBeCloseTo(circ / 2);
  expect(d50.circumference).toBeCloseTo(circ);
});

test("sparklinePoints は 0..1 の系列を w×h 内の座標へ写像（左→右、上下反転）", () => {
  const pts = sparklinePoints([0, 1], 100, 20);
  // 2点: x=0 と x=100、y は rate=0→下端(h)、rate=1→上端(0)
  expect(pts).toEqual([
    { x: 0, y: 20 },
    { x: 100, y: 0 },
  ]);
});

test("sparklinePoints は1点でも中央に置き壊れない", () => {
  const pts = sparklinePoints([0.5], 100, 20);
  expect(pts.length).toBe(1);
  expect(pts[0].y).toBeCloseTo(10);
});

test("sparklinePoints は空系列で空配列", () => {
  expect(sparklinePoints([], 100, 20)).toEqual([]);
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run src/lib/charts.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/charts.ts
/**
 * チャート描画の純粋な幾何ヘルパー（依存追加なし・SVG 用）。
 * コンポーネントはこの結果を SVG 属性に流し込むだけにして、ロジックをテスト可能にする。
 */

export interface DonutDash {
  circumference: number;
  dash: number; // 塗る長さ
  gap: number; // 残り
}

/** percent(0..100) を丸める。 */
export function clampPercent(p: number): number {
  return Math.max(0, Math.min(100, Math.round(p)));
}

/** 半径 r の円で percent 分だけ塗る stroke-dasharray 用の長さ。 */
export function donutDash(percent: number, r: number): DonutDash {
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(100, percent)) / 100;
  const dash = circumference * ratio;
  return { circumference, dash, gap: circumference - dash };
}

export interface Point {
  x: number;
  y: number;
}

/**
 * 0..1 の系列を w×h の矩形内の座標に写像する。
 * x は等間隔（左→右）、y は上下反転（rate=1 が上端 y=0、rate=0 が下端 y=h）。
 * 1点のときは x=0（描画側で単点マーカーにする）。空系列は空配列。
 */
export function sparklinePoints(series: number[], w: number, h: number): Point[] {
  const n = series.length;
  if (n === 0) return [];
  if (n === 1) {
    const v = Math.max(0, Math.min(1, series[0]));
    return [{ x: 0, y: h - v * h }];
  }
  return series.map((raw, i) => {
    const v = Math.max(0, Math.min(1, raw));
    return { x: (i / (n - 1)) * w, y: h - v * h };
  });
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run src/lib/charts.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/charts.ts src/lib/charts.test.ts
git commit -m "feat(charts): ドーナツ/スパークラインの純幾何ヘルパー"
```

---

## Task 3: チャートコンポーネント（Donut / Sparkline / StatTile）

**Files:**
- Create: `src/components/charts/Donut.tsx`
- Create: `src/components/charts/Sparkline.tsx`
- Create: `src/components/charts/StatTile.tsx`

presentational（副作用なし・props→SVG/JSX）。`"use client"` は不要（サーバでもクライアントでもレンダー可の純表示）。色は意味トークンの CSS 変数を使う（`stroke="rgb(var(--c-primary))"` 等）。

- [ ] **Step 1: Donut を書く**

```tsx
// src/components/charts/Donut.tsx
import { donutDash, clampPercent } from "@/lib/charts";

/**
 * パーセント表示のドーナツ（手書きSVG・依存なし）。
 * 色は意味トークン（--c-primary / --c-accent 等）を使い、学齢テーマに追従する。
 */
export function Donut({
  percent,
  size = 120,
  stroke = 14,
  color = "rgb(var(--c-primary))",
  track = "rgb(var(--c-line))",
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
}) {
  const p = clampPercent(percent);
  const r = (size - stroke) / 2;
  const { circumference, dash } = donutDash(p, r);
  const c = size / 2;
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={label ? `${label} ${p}%` : `${p}%`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4} /* 12時開始 */
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
        />
        <text x={c} y={c} textAnchor="middle" dominantBaseline="central"
          className="fill-ink font-serif" style={{ fontSize: size * 0.26 }}>
          {p}%
        </text>
      </svg>
      {label && <span className="mt-1 text-sm text-ink">{label}</span>}
      {sublabel && <span className="text-xs text-faint">{sublabel}</span>}
    </div>
  );
}
```

（注: `fill-ink` は Tailwind の `fill` ユーティリティ＋意味トークンが効かない場合、`style={{ fill: "rgb(var(--c-ink))" }}` に切替。実装時にビルドで確認する。）

- [ ] **Step 2: Sparkline を書く**

```tsx
// src/components/charts/Sparkline.tsx
import { sparklinePoints } from "@/lib/charts";

/** 0..1 の系列を小さな折れ線で描く（推移表示）。色は意味トークン。 */
export function Sparkline({
  series,
  width = 80,
  height = 24,
  color = "rgb(var(--c-primary))",
}: {
  series: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const pts = sparklinePoints(series, width, height);
  if (pts.length === 0) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }
  if (pts.length === 1) {
    return (
      <svg width={width} height={height} role="img" aria-label="推移データ1件">
        <circle cx={pts[0].x + 2} cy={pts[0].y} r={2.5} fill={color} />
      </svg>
    );
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg width={width} height={height} role="img" aria-label="正答率の推移">
      <path d={d} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
```

- [ ] **Step 3: StatTile を書く**

```tsx
// src/components/charts/StatTile.tsx
/** 数値をひとつ大きく見せるタイル（連続日数・のべ問題数など）。 */
export function StatTile({
  value,
  unit,
  label,
  accent = false,
}: {
  value: number | string;
  unit?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
      <div className={`font-serif leading-none ${accent ? "text-terra" : "text-sky"}`}
        style={{ fontSize: 34 }}>
        {value}
        {unit && <span className="ml-0.5 text-base text-ink-soft">{unit}</span>}
      </div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
```

- [ ] **Step 4: ビルドで型・描画を確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（未使用 export の警告は問題なし）

- [ ] **Step 5: コミット**

```bash
git add src/components/charts/
git commit -m "feat(charts): Donut/Sparkline/StatTile 表示コンポーネント（手書きSVG）"
```

---

## Task 4: アカウント/進捗の fetch クライアント＋レスポンス型

**Files:**
- Create: `src/lib/account-client.ts`
- Create: `src/lib/progress-client-types.ts`

クライアントからサーバ専用モジュール（`server-only` を含む `progress-stats`/`db`）を import できないため、JSON レスポンス用の軽量型をクライアント側に定義する。fetch は `credentials: "same-origin"`（Cookie 送信）。

- [ ] **Step 1: レスポンス型を書く**

```ts
// src/lib/progress-client-types.ts
/** API JSON レスポンスのクライアント用型（server-only 依存を避けるため独立定義）。 */
export interface Share {
  masteredUnits: number;
  targetUnits: number;
  percent: number;
}
export interface OverallResponse {
  stage: string;
  overall: Share;
  bySubject: Record<string, Share>;
  totalAttempts: number;
  totalCorrect: number;
  level: { level: number; current: number; span: number; toNext: number };
  streak: { current: number; thisMonth: number; totalDays: number };
}
export interface TodayResponse {
  total: number;
  correct: number;
  rate: number;
  bySubject: Record<string, { attempts: number; correct: number }>;
  testCount: number;
  tests: { subject: string; total: number; score: number }[];
}
export interface UnitProgressResponse {
  unitId: string;
  attempts: number;
  correct: number;
  rate: number;
  mastered: boolean;
  trend: { spark: number[]; direction: "up" | "flat" | "down" };
}
export interface SubjectResponse {
  subject: string;
  masteredUnits: number;
  targetUnits: number;
  percent: number;
  units: UnitProgressResponse[];
}
export interface Child {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  createdAt: string;
}
```

- [ ] **Step 2: fetch クライアントを書く**

まず実装済みルートの入出力を確認する（形を合わせるため）:
Run: `cat src/app/api/auth/login/route.ts src/app/api/auth/signup/route.ts src/app/api/children/route.ts src/app/api/children/claim/route.ts`

その上で、確認した形に合わせて以下を作成（成功/失敗の判定はHTTPステータス＋`{error}`メッセージ）:

```ts
// src/lib/account-client.ts
"use client";
import type {
  OverallResponse, TodayResponse, SubjectResponse, Child,
} from "@/lib/progress-client-types";

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
}

/** signup。成功 true、失敗はエラーメッセージ。 */
export async function signup(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await postJson("/api/auth/signup", { email, password });
  if (res.ok) return { ok: true };
  const j = await res.json().catch(() => ({}));
  return { ok: false, error: j.error ?? "登録に失敗しました。" };
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await postJson("/api/auth/login", { email, password });
  if (res.ok) return { ok: true };
  const j = await res.json().catch(() => ({}));
  return { ok: false, error: j.error ?? "メールかパスワードが違います。" };
}

export async function logout(): Promise<void> {
  await postJson("/api/auth/logout", {});
}

/** 子一覧。未ログイン(401)は null を返す（呼び出し側で /login へ）。 */
export async function fetchChildren(): Promise<Child[] | null> {
  const res = await fetch("/api/children", { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) return [];
  const j = await res.json();
  return (j.children ?? []) as Child[];
}

export async function createChild(name: string, stage: string): Promise<{ id?: string; error?: string }> {
  const res = await postJson("/api/children", { name, stage });
  const j = await res.json().catch(() => ({}));
  if (res.ok) return { id: j.id };
  return { error: j.error ?? "作成に失敗しました。" };
}

/** 引き継ぎ。fromChildId=この端末の匿名id、toChildId=新プロフィールid。※実ルートの引数名に合わせること。 */
export async function claim(fromChildId: string, toChildId: string): Promise<boolean> {
  const res = await postJson("/api/children/claim", { fromChildId, toChildId });
  return res.ok;
}

/** 進捗系。401 は null（→ /login 誘導）。 */
async function getProgress<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function fetchToday(childId: string) {
  return getProgress<TodayResponse>(`/api/progress/today?childId=${encodeURIComponent(childId)}`);
}
export function fetchOverall(childId: string) {
  return getProgress<OverallResponse>(`/api/progress/overall?childId=${encodeURIComponent(childId)}`);
}
export function fetchSubject(childId: string, subject: string) {
  return getProgress<SubjectResponse>(
    `/api/progress/subject?childId=${encodeURIComponent(childId)}&subject=${encodeURIComponent(subject)}`,
  );
}
```

- [ ] **Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/lib/account-client.ts src/lib/progress-client-types.ts
git commit -m "feat(account-client): 認証/子/進捗のfetchクライアント＋レスポンス型"
```

---

## Task 5: /signup ・ /login ページ

**Files:**
- Create: `src/app/signup/page.tsx`
- Create: `src/app/login/page.tsx`

いずれも `"use client"`。メール＋パスワードのフォーム、送信中は disabled、失敗はエラー文表示。成功で `useRouter().push("/family")`。**パスワード入力は利用者本人が行う**（自動入力しない）。意味トークンでカード風に。ヘッダは簡易（ロゴ＋「もどる」→`/`）。相互リンク（ログイン↔新規登録）を置く。

- [ ] **Step 1: /signup を書く**

受け入れ内容（実装はこの契約を満たすこと）:
- state: `email`, `password`, `busy`, `error`。
- 送信で `signup(email,password)`（`@/lib/account-client`）。`ok` なら `router.push("/family")`、失敗は `error` 表示。
- パスワードは `type="password"`、`autoComplete="new-password"`、最小長ヒント（8文字以上）を表示。
- 「すでにアカウントがある方は ログイン」リンク→`/login`。

```tsx
// src/app/signup/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/account-client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await signup(email, password);
    setBusy(false);
    if (r.ok) router.push("/family");
    else setError(r.error ?? "登録に失敗しました。");
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
      </header>
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="font-serif text-2xl text-ink">アカウントを作る</h1>
        <p className="mt-1 text-sm text-ink-soft">おうちの方のメールとパスワードで登録します。</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-line bg-white/70 p-5 shadow-card">
          <label className="block">
            <span className="text-sm text-ink-soft">メールアドレス</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">パスワード（8文字以上）</span>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />
          </label>
          {error && <p className="text-sm text-terra">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-lg bg-sky px-4 py-2 font-medium text-white disabled:opacity-60">
            {busy ? "作成中…" : "アカウントを作る"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          すでにアカウントがある方は <Link href="/login" className="text-sky underline">ログイン</Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: /login を書く**

`/signup` と同型で、`login()` を呼び、成功で `/family` へ。失敗は「メールかパスワードが違います。」。相互リンクは「はじめての方は 新規登録」→`/signup`。`autoComplete="current-password"`。（コードは signup を土台に、見出し「ログイン」・関数 `login`・リンク先 `/signup` に置換して作成。）

- [ ] **Step 3: 型チェック＆ビルド**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "/signup|/login|error|Error" | head`
Expected: `/signup`・`/login` が出力され、エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/app/signup/page.tsx src/app/login/page.tsx
git commit -m "feat(auth-ui): /signup ・ /login 画面（フォーム→API→/family）"
```

---

## Task 6: /family 子プロフィールハブ

**Files:**
- Create: `src/app/family/page.tsx`

`"use client"`。ログイン後の入口。`fetchChildren()` が `null`（401）なら `router.replace("/login")`。子一覧を表示し、選ぶと `setActiveChild(id)`＋`setStage(child.stage)` して `router.push("/")`（その子として学習）。プロフィール追加フォーム（名前＋学齢セレクト）→`createChild`→（任意チェック「この端末のこれまでの記録を引き継ぐ」がオンなら、作成直後に `claim(getChildId()前の匿名id, 新id)`）。ログアウトボタン→`logout()`→`clearActiveChild()`→`router.replace("/login")`。「がんばりを見る」導線（`/today`・`/progress`）も置く。SSR ガード（`mounted`）遵守。

引き継ぎの注意: `getChildId()` はアクティブ子未設定時に匿名UUIDを返す。追加前に匿名idを控え、作成後に引き継ぐ。引き継いだらその子をアクティブにする。

- [ ] **Step 1: 実装を書く**（下記を作成）

```tsx
// src/app/family/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchChildren, createChild, claim, logout } from "@/lib/account-client";
import type { Child } from "@/lib/progress-client-types";
import { setActiveChild, clearActiveChild, getActiveChild } from "@/lib/progress";
import { setStage } from "@/lib/stage";
import { STAGES } from "@/lib/stage";

export default function FamilyPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState("");
  const [stage, setStageSel] = useState("elementary");
  const [inherit, setInherit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = mounted ? getActiveChild() : "";

  async function load() {
    const list = await fetchChildren();
    if (list === null) {
      router.replace("/login");
      return;
    }
    setChildren(list);
  }

  useEffect(() => {
    setMounted(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(c: Child) {
    setActiveChild(c.id);
    if (c.stage === "elementary" || c.stage === "junior" || c.stage === "senior") {
      setStage(c.stage);
    }
    router.push("/");
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // 引き継ぎ用に、現在の（アクティブ未設定なら匿名）childId を控える。
    const prevAnon = getActiveChild() ? "" : localStorageAnonId();
    const r = await createChild(name.trim(), stage);
    if (r.error || !r.id) {
      setBusy(false);
      setError(r.error ?? "作成に失敗しました。");
      return;
    }
    if (inherit && prevAnon) {
      await claim(prevAnon, r.id);
    }
    setActiveChild(r.id);
    setBusy(false);
    setName("");
    setInherit(false);
    await load();
  }

  async function onLogout() {
    await logout();
    clearActiveChild();
    router.replace("/login");
  }

  if (!mounted) return <div className="min-h-[40vh]" />;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        <button onClick={onLogout} className="text-sm text-ink-soft underline">ログアウト</button>
      </header>
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="font-serif text-2xl text-ink">おうちの人のページ</h1>
        <p className="mt-1 text-sm text-ink-soft">お子さんを選んで学習、またはがんばりを見られます。</p>

        <section className="mt-6 space-y-3">
          {children.length === 0 && <p className="text-sm text-faint">まだプロフィールがありません。下から追加してください。</p>}
          {children.map((c) => (
            <div key={c.id} className={`flex items-center justify-between rounded-2xl border p-4 shadow-card ${active === c.id ? "border-sky bg-white" : "border-line bg-white/70"}`}>
              <div>
                <div className="font-serif text-lg text-ink">{c.name}</div>
                <div className="text-xs text-faint">{stageLabel(c.stage)}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => choose(c)} className="rounded-lg bg-sky px-3 py-1.5 text-sm text-white">この子で学習</button>
                <Link href="/today" onClick={() => setActiveChild(c.id)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink">今日</Link>
                <Link href="/progress" onClick={() => setActiveChild(c.id)} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink">全体</Link>
              </div>
            </div>
          ))}
        </section>

        <form onSubmit={onAdd} className="mt-8 space-y-3 rounded-2xl border border-line bg-white/70 p-5 shadow-card">
          <h2 className="font-serif text-lg text-ink">プロフィールを追加</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="なまえ（20文字まで）"
            required maxLength={20} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />
          <select value={stage} onChange={(e) => setStageSel(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink">
            {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}（{s.range}）</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={inherit} onChange={(e) => setInherit(e.target.checked)} />
            この端末のこれまでの記録を引き継ぐ
          </label>
          {error && <p className="text-sm text-terra">{error}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-sky px-4 py-2 text-white disabled:opacity-60">
            {busy ? "追加中…" : "追加する"}
          </button>
        </form>
      </div>
    </main>
  );
}

function stageLabel(stage: string): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}
/** progress.ts の匿名 childId キーを直接読む（アクティブ未設定時の引き継ぎ元）。 */
function localStorageAnonId(): string {
  try {
    return window.localStorage.getItem("ai-sensei-child-id-v1") ?? "";
  } catch {
    return "";
  }
}
```

（実装メモ: `claim` の引数名は Task 4 Step 2 で確認した実ルート仕様に合わせること。匿名idキー名 `ai-sensei-child-id-v1` は `src/lib/progress.ts` の `CHILD_ID_KEY` と一致。）

- [ ] **Step 2: 型チェック＆ビルド**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "/family|error|Error" | head`
Expected: `/family` 出力・エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/app/family/page.tsx
git commit -m "feat(family): 子プロフィール選択/追加/引き継ぎ/ログアウトのハブ"
```

---

## Task 7: /today 今日の頑張りページ

**Files:**
- Create: `src/app/today/page.tsx`

`"use client"`。`getChildId()` を得て `fetchToday(childId)`。`null`（401）→ `router.replace("/login")`。layout A の順: ①一言ほめ（rate や total から出し分け。例: total===0「きょうも いつでも どうぞ」／rate≥0.8「すごい！よくできてるね」／else「いいちょうし！つづけよう」）②今日の問題数・正答率（大きく）③今日の教科別バー（`groupSubjects` は overall 用なので、today は `bySubject` を素の教科ラベルで表示: `displaySubjectMeta` を使わず、`SUBJECTS`＋算数ラベルで簡易表示可）④テスト回数（`testCount`＞0 のとき「今日は テストを N回」＋点数 `tests` を小さく）。子と一緒に見るトーン。上に「おうちの人のページへ」`/family`。SSR ガード。

受け入れ:
- childId 空（SSR/未生成）ガード。
- 401 で `/login`。
- データ取得中はスケルトン（`min-h` プレースホルダ）。
- 今日ゼロでも壊れない（total0/rate0）。

- [ ] **Step 1: 実装（契約に沿って作成。既存 HomeHub の `Bar` 相当のバーを用いる）**

要点コード（骨子・これを満たすこと）:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchToday } from "@/lib/account-client";
import type { TodayResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";

export default function TodayPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TodayResponse | null | "loading">("loading");

  useEffect(() => {
    setMounted(true);
    const id = getChildId();
    if (!id) { setData(null); return; }
    fetchToday(id).then((d) => {
      if (d === null) { router.replace("/login"); return; }
      setData(d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || data === "loading") return <div className="min-h-[50vh]" />;
  if (data === null) return <div className="min-h-[50vh]" />;

  const praise = data.total === 0 ? "きょうも いつでも どうぞ"
    : data.rate >= 0.8 ? "すごい！よくできてるね"
    : "いいちょうし！つづけよう";
  const pct = data.total > 0 ? Math.round(data.rate * 100) : 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        <Link href="/family" className="text-sm text-ink-soft underline">おうちの人のページ</Link>
      </header>
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="font-serif text-2xl text-terra">{praise}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
            <div className="font-serif text-sky" style={{ fontSize: 40 }}>{data.total}</div>
            <div className="text-xs text-faint">きょう といた もんだい</div>
          </div>
          <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
            <div className="font-serif text-sky" style={{ fontSize: 40 }}>{pct}<span className="text-lg">%</span></div>
            <div className="text-xs text-faint">せいかい率</div>
          </div>
        </div>
        {/* 教科別バー */}
        <section className="mt-6 space-y-2">
          {Object.entries(data.bySubject).map(([subj, v]) => (
            <div key={subj} className="rounded-xl border border-line bg-white/60 p-3">
              <div className="flex justify-between text-sm text-ink">
                <span>{subj}</span><span>{v.correct}/{v.attempts}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper2">
                <div className="h-full rounded-full bg-sky"
                  style={{ width: `${v.attempts ? Math.round((v.correct / v.attempts) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </section>
        {data.testCount > 0 && (
          <p className="mt-6 text-sm text-ink-soft">きょうは テストを {data.testCount}回。
            {data.tests.map((t, i) => <span key={i} className="ml-2 text-terra">{t.score}/{t.total}</span>)}
          </p>
        )}
      </div>
    </main>
  );
}
```

（教科別バーの `{subj}` は英語キーのまま。日本語ラベルにしたい場合は `displaySubjectMeta` ではなく素の教科→ラベル対応を小さく持つ。今日は簡易表示で可。）

- [ ] **Step 2: 型チェック＆ビルド**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "/today|error|Error" | head`
Expected: `/today` 出力・エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/app/today/page.tsx
git commit -m "feat(today): 今日の頑張りページ（一言ほめ→問題数/正答率→教科別→テスト）"
```

---

## Task 8: /progress 全体の進捗ダッシュボード

**Files:**
- Create: `src/app/progress/page.tsx`

`"use client"`。`fetchOverall(getChildId())`。401→`/login`。構成（設計 §5）: ①大きな全体%ドーナツ（`Donut percent={data.overall.percent}` sublabel=`${overall.masteredUnits}/${overall.targetUnits}単元`）②`groupSubjects(data.bySubject)` の5教科ドーナツ（各 `Link href={/progress/${g.key}}`。ただし social の遷移先は履歴/地理を含むので中学は要注意→v1は `social` を教科ページへ渡し、教科ページ側で「社会（歴史・地理）」をまとめ表示 or 代表表示。**簡易化: 5ドーナツはタップで `/progress/[key]` へ。key は math/science/social/japanese/english。**）③のべ問題数・レベル（`StatTile` value=`Lv${level.level}` と `totalAttempts`＋「次のLvまであと`level.toNext`」）④継続（`StatTile`×3: 連続`streak.current`日／今月`streak.thisMonth`日／のべ`streak.totalDays`日）。上に `/family` と `/today` 導線。SSR ガード。

- [ ] **Step 1: 実装（Donut/StatTile/groupSubjects を使用）**

骨子（満たすこと）:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchOverall } from "@/lib/account-client";
import type { OverallResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { groupSubjects } from "@/lib/progress-view";
import { Donut } from "@/components/charts/Donut";
import { StatTile } from "@/components/charts/StatTile";

export default function ProgressPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<OverallResponse | null | "loading">("loading");

  useEffect(() => {
    setMounted(true);
    const id = getChildId();
    if (!id) { setData(null); return; }
    fetchOverall(id).then((d) => {
      if (d === null) { router.replace("/login"); return; }
      setData(d);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || data === "loading" || data === null) return <div className="min-h-[50vh]" />;
  const groups = groupSubjects(data.bySubject);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        <div className="flex gap-4 text-sm text-ink-soft">
          <Link href="/today" className="underline">今日</Link>
          <Link href="/family" className="underline">おうちの人</Link>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-serif text-2xl text-ink">全体の進捗</h1>
        <div className="mt-6 flex justify-center">
          <Donut percent={data.overall.percent} size={180} stroke={20}
            sublabel={`${data.overall.masteredUnits}/${data.overall.targetUnits} 単元 制覇`} />
        </div>
        <div className="mt-8 grid grid-cols-5 gap-2">
          {groups.map((g) => (
            <Link key={g.key} href={`/progress/${g.key}`} className="flex flex-col items-center">
              <Donut percent={g.percent} size={64} stroke={8} />
              <span className="mt-1 text-xs text-ink">{g.emoji}{g.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <StatTile value={data.totalAttempts} unit="問" label="のべ 問題数" />
          <StatTile value={`Lv${data.level.level}`} label={`次のLvまであとJ{data.level.toNext}問`} accent />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatTile value={data.streak.current} unit="日" label="連続" accent />
          <StatTile value={data.streak.thisMonth} unit="日" label="今月の学習日" />
          <StatTile value={data.streak.totalDays} unit="日" label="のべ学習日" />
        </div>
      </div>
    </main>
  );
}
```

（実装時の注意: 上記 `label={`次のLvまであとJ{...}`}` はプレースホルダの誤記防止のため、実装では `` `次のLvまであと${data.level.toNext}問` `` と正しいテンプレートリテラルで書くこと。）

- [ ] **Step 2: 型チェック＆ビルド**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "/progress|error|Error" | head`
Expected: `/progress` 出力・エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/app/progress/page.tsx
git commit -m "feat(progress): 全体の進捗ダッシュボード（全体ドーナツ＋5教科＋のべ/Lv＋継続）"
```

---

## Task 9: /progress/[subject] 教科の進捗ページ

**Files:**
- Create: `src/app/progress/[subject]/page.tsx`

`"use client"`。`useParams()` で `subject` を取得。**表示教科キー（math/science/social/japanese/english）を API 教科へ展開**: social は API 上 `social`/`history`/`geography` の3系統に分かれるため、v1 では該当する API 教科を `fetchSubject` で個別取得して単元行を結合する（`displaySubjectMeta(subject).sources` を使う）。各 source の `SubjectResponse.units` を連結し、教科ドーナツは合算（masteredUnits/targetUnits を合算し % 再計算）。各単元行: 単元名（後述）・累計正答率バー・`Sparkline series={unit.trend.spark}`・`mastered` なら「制覇」バッジ（`text-terra`）。401→`/login`。不正な subject（`displaySubjectMeta` が既定に落ちる、または sources が空取得）→「データがありません」。

単元名: `unitId` を人が読める名前にしたい。math は `getUnit(id)?.title`、quiz は `getQuizUnit(id)?.title` だが**サーバ専用の可能性**。クライアントで使えなければ v1 は `unitId` をそのまま表示し、名称整備は follow-up とする（計画では unitId 表示で可）。

- [ ] **Step 1: 実装（sources 展開・結合・ドーナツ合算・Sparkline）**

骨子（満たすこと）:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSubject } from "@/lib/account-client";
import type { SubjectResponse, UnitProgressResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { displaySubjectMeta } from "@/lib/progress-view";
import { Donut } from "@/components/charts/Donut";
import { Sparkline } from "@/components/charts/Sparkline";

export default function SubjectProgressPage() {
  const router = useRouter();
  const params = useParams<{ subject: string }>();
  const meta = displaySubjectMeta(params.subject);
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<UnitProgressResponse[]>([]);
  const [mastered, setMastered] = useState(0);
  const [target, setTarget] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = getChildId();
    if (!id) { setReady(true); return; }
    Promise.all(meta.sources.map((s) => fetchSubject(id, s))).then((results) => {
      if (results.some((r) => r === null)) { router.replace("/login"); return; }
      const ok = results.filter((r): r is SubjectResponse => !!r);
      setUnits(ok.flatMap((r) => r.units));
      setMastered(ok.reduce((n, r) => n + r.masteredUnits, 0));
      setTarget(ok.reduce((n, r) => n + r.targetUnits, 0));
      setReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || !ready) return <div className="min-h-[50vh]" />;
  const pct = target > 0 ? Math.round((mastered / target) * 100) : 0;
  const arrow = (d: string) => (d === "up" ? "↑" : d === "down" ? "↓" : "→");

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/progress" className="text-sm text-ink-soft underline">← 全体の進捗</Link>
        <Link href="/family" className="text-sm text-ink-soft underline">おうちの人</Link>
      </header>
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-serif text-2xl text-ink">{meta.emoji}{meta.label}の進捗</h1>
        <div className="mt-6 flex justify-center">
          <Donut percent={pct} size={140} stroke={16}
            sublabel={`${mastered}/${target} 単元 制覇`} />
        </div>
        <ul className="mt-8 space-y-2">
          {units.length === 0 && <li className="text-sm text-faint">まだ記録がありません。</li>}
          {units.map((u) => (
            <li key={u.unitId} className="rounded-xl border border-line bg-white/70 p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink">{u.unitId}</span>
                <span className="flex items-center gap-2">
                  {u.mastered && <span className="rounded bg-terra/15 px-1.5 py-0.5 text-xs text-terra">制覇</span>}
                  <span className="text-sm text-ink-soft">{Math.round(u.rate * 100)}% {arrow(u.trend.direction)}</span>
                  <Sparkline series={u.trend.spark} />
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper2">
                <div className="h-full rounded-full bg-sky" style={{ width: `${Math.round(u.rate * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 型チェック＆ビルド**

Run: `npx tsc --noEmit && npm run build 2>&1 | grep -E "progress/\[subject\]|error|Error" | head`
Expected: `/progress/[subject]` 出力・エラーなし

- [ ] **Step 3: コミット**

```bash
git add "src/app/progress/[subject]/page.tsx"
git commit -m "feat(progress): 教科の進捗ページ（ドーナツ＋単元別正答率＋推移スパークライン）"
```

---

## Task 10: 旧 /guardian 撤去＋各ページ nav 差し替え

**Files:**
- Delete: `src/app/guardian/` （`page.tsx` と配下コンポーネント一式）
- Delete: `src/app/api/guardian/route.ts` ・ `src/app/api/guardian/passcode/route.ts`
- Delete: `src/lib/guardian-auth.ts`
- Delete: 上記だけが使う Guardian専用コンポーネント（`GuardianView`/`GuardianGate` 等。場所は実装時に確認）
- Modify: `src/app/page.tsx` / `src/app/HomeHub.tsx` / `src/app/explore/page.tsx` / `src/app/math/page.tsx` / `src/app/for-parents/page.tsx`（`/guardian` 導線→新導線）

- [ ] **Step 1: 依存の確認（削除の安全性）**

Run: `grep -rn "guardian" src/ --include=*.ts --include=*.tsx`
Expected: 参照箇所を列挙。`guardian-auth` / `GuardianView` / `GuardianGate` / `/api/guardian` / `href="/guardian"` の全出現を把握する。`getConfig`/`setConfig`（Store）は他用途がないか確認（無ければ Store メソッドは残置で無害）。

- [ ] **Step 2: nav 差し替え**

各ページのヘッダ/フッタの `href="/guardian"`（表示「みまもり」「見守りダッシュボード」等）を **`href="/family"` 表示「おうちの人」**（子向けヘッダ）に変更。`src/app/for-parents/page.tsx` の 4 箇所は文面を「アカウントでログインしてお子さんのがんばりを見る」に更新し、CTA を `/login`（未ログイン想定）へ。具体差し替え:
- `src/app/page.tsx`：ヘッダ nav 「みまもり→おうちの人」`/family`。
- `src/app/HomeHub.tsx`：フッタ「見守りダッシュボード→おうちの人のページ」`/family`。
- `src/app/explore/page.tsx` / `src/app/math/page.tsx`：ヘッダ nav を `/family`「おうちの人」。
- `src/app/for-parents/page.tsx`：本文の見守り説明をアカウント制に更新、CTA→`/login`。

- [ ] **Step 3: 削除**

Guardian ページ・API・`guardian-auth.ts`・Guardian専用コンポーネントを削除。削除後に残参照が無いことを再確認:

Run: `grep -rn "guardian\|Guardian" src/ --include=*.ts --include=*.tsx`
Expected: `/api/guardian` や `guardian-auth`・`GuardianView` 等への参照が **0 件**（テスト含む。guardian のテストがあれば併せて削除）。

- [ ] **Step 4: 型チェック＆ビルド＆テスト**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -4 && npm run build 2>&1 | grep -E "guardian|error|Error|Compiled" | head`
Expected: tsc クリーン／テスト緑（guardian 関連テストを削除済み）／build 成功で `/guardian` ルートが**消えている**。

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "refactor: 旧パスコード式/guardian一式を撤去しアカウント制導線へ差し替え"
```

---

## Task 11: 全体検証・実機スモーク

- [ ] **Step 1: 型・テスト・ビルド**

Run: `npx tsc --noEmit && npx vitest run 2>&1 | tail -4 && npm run build 2>&1 | tail -30`
Expected: tsc クリーン／全テスト緑／build 成功。新ルート `/signup /login /family /today /progress /progress/[subject]` が出力、`/guardian` は無い。

- [ ] **Step 2: 実機スモーク（ローカル）**

`npm run dev` を起動し、以下を手動確認（DB は SQLite ローカル）:
- `/signup` で新規作成→`/family` に遷移。
- `/family` でプロフィール追加（引き継ぎ ON で 1 件）→「この子で学習」→`/`。
- `/math` などで数問解く→`/today` に今日の数字が出る／`/progress` に全体%・5教科・のべ・継続が出る／教科ドーナツから `/progress/[subject]` で単元行＋スパークライン。
- ログアウト→保護された `/progress` 直アクセスで `/login` へ誘導。
- 他アカウントの子 id を `?childId=` で叩くと 403（API 直）。

- [ ] **Step 3: 差分確認**

Run: `git status && git log --oneline -15`
Expected: 未コミットの変更なし。

---

## Self-Review（計画作成者による確認・記録）

- **Spec §5 カバレッジ:** signup/login=Task5、子選択/追加/引き継ぎ/ログアウト=Task6、今日の頑張り(layoutA)=Task7、全体の進捗(全体%ドーナツ→5教科→のべ/Lv→継続)=Task8、教科の進捗/推移=Task9、旧guardian撤去=Task10。ログイン必須・自分の子だけ=各ダッシュボードが401→/loginで担保＋API側ownsChild(A3)。
- **Spec §6 API 利用:** 記録系は既存（childId=アクティブ子）。進捗系=Task7-9 が fetch。認証/children=Task5-6。
- **A3申し送り反映:** 7→5教科集約=Task1（social=social+history+geography）。overall/subject/today のレスポンス型=Task4。
- **型整合:** クライアントは `progress-client-types.ts` の JSON 型を使用（server-only を import しない）。`GroupedShare`/`groupSubjects`（Task1）と `OverallResponse.bySubject`（Task4）が整合。`Donut`/`Sparkline` は Task2 の幾何を使用。
- **プレースホルダ注意:** Task8 骨子中の `あとJ{...}` は誤記防止の注記つき（実装は正しいテンプレートリテラル）。Donut の `fill-ink` は効かなければ inline style に切替（注記済み）。`claim` 引数名は実ルート確認後に確定（Task4/6 に明記）。
- **非スコープ/フォローアップ:** 単元名の人間可読表示（現状 unitId 表示）。social 教科ページの「歴史/地理」内訳の見せ方（v1は結合表示）。middleware による集中ゲートは未使用（各ページ401→/loginで代替）。子ごとPIN・パスワード再設定は元々非スコープ。

## Notes（実装者への申し送り）

- **サーバ専用の落とし穴:** `@/lib/progress-stats` や `@/lib/db` はクライアントから import しない（`server-only`）。クライアント画面は `progress-client-types.ts` の型と `account-client.ts` の fetch だけを使う。
- **アクティブ子の一貫性:** ダッシュボードは `getChildId()`（アクティブ子 id 優先・未設定は匿名UUID）を使う。ログアウト時は `clearActiveChild()`。
- **既存の見た目に合わせる:** カード/トークン/フォントは `HomeHub.tsx` を手本に。stage テーマは自動追従（意味トークンを使うだけ）。
- **`claim` 実装確認:** `/api/children/claim` の実引数（fromChildId/toChildId か別名か）を Task4 Step2 で必ず確認し、`account-client.ts` と `/family` を合わせる。
