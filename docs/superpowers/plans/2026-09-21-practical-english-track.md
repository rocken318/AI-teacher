# 実用英語トラック 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development。**作業は隔離ワークツリー `Y:\ai-sensei-eikaiwa`（branch `feature/practical-english`）で行う。** `Y:\AI先生`（別セッション使用中）は触らない。すべてのコマンド/編集は `Y:\ai-sensei-eikaiwa` 内の絶対パスで（Bashは各回 `cd "Y:\ai-sensei-eikaiwa" &&`）。

**Goal:** 学齢ピッカーの「高校」の隣に「実用英語」を独立トラックとして置き、選ぶとホームが"実用英語モード"（TOEICバンド/単元＋実用英語専用の進捗）になる。進捗は5教科と混ぜない。

**Architecture:** 「実用英語」は学校の学齢(Stage)とは別の"モード"。新しい localStorage キー `ai-sensei-track-v1` で記憶。HomeHub の描画分岐に「track=eikaiwa なら実用英語モード」を追加。中身は既存の eikaiwa 教科（subject=eikaiwa, grade=TOEIC500）と `/learn/eikaiwa` を流用。進捗は既存の `progress.bySubject["eikaiwa"]` を使う（5教科の制覇%には元々入らない）。**AI不使用・新テーブルなし。**

**Tech Stack:** Next.js App Router / TS / 既存 HomeHub・stage.ts・progress・quiz(eikaiwa) / Vitest。

**Spec:** `docs/superpowers/specs/2026-09-21-practical-english-track-design.md`

## ファイル構成
- Create `src/lib/track.ts`: 実用英語モードの記憶（getTrack/setTrack/clearTrack）＋テスト
- Modify `src/app/HomeHub.tsx`: track 状態・StagePicker に「実用英語」ボタン・実用英語モードの描画・トグル

---

## Task 1: track.ts（実用英語モードの記憶）

**Files:** Create `src/lib/track.ts` / Test `src/lib/__tests__/track.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```ts
// src/lib/__tests__/track.test.ts
import { afterEach, expect, test } from "vitest";
import { getTrack, setTrack, clearTrack } from "@/lib/track";

afterEach(() => {
  try { window.localStorage.clear(); } catch { /* noop */ }
});

test("setTrack/getTrack/clearTrack が往復する", () => {
  expect(getTrack()).toBeNull();
  setTrack("eikaiwa");
  expect(getTrack()).toBe("eikaiwa");
  clearTrack();
  expect(getTrack()).toBeNull();
});

test("不正な値は null 扱い", () => {
  try { window.localStorage.setItem("ai-sensei-track-v1", "bogus"); } catch { /* noop */ }
  expect(getTrack()).toBeNull();
});
```

- [ ] **Step 2: 失敗を確認**

Run: `cd "Y:\ai-sensei-eikaiwa" && npx vitest run src/lib/__tests__/track.test.ts`
Expected: FAIL（module 未実装）

- [ ] **Step 3: 実装を書く**

```ts
// src/lib/track.ts
/**
 * 学校の学齢(Stage)とは別の「トラック」モード。
 * 現状は "eikaiwa"（実用英語）のみ。localStorage に記憶する（SSR安全）。
 */
export type Track = "eikaiwa";

const KEY = "ai-sensei-track-v1";

/** 記憶したトラックを返す。未設定/不正は null。 */
export function getTrack(): Track | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY) === "eikaiwa" ? "eikaiwa" : null;
  } catch {
    return null;
  }
}

/** トラックを保存する。 */
export function setTrack(track: Track): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, track);
  } catch {
    /* noop */
  }
}

/** トラックを消す（学校モードに戻る）。 */
export function clearTrack(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
```

- [ ] **Step 4: テスト**

Run: `cd "Y:\ai-sensei-eikaiwa" && npx vitest run src/lib/__tests__/track.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
cd "Y:\ai-sensei-eikaiwa" && git add src/lib/track.ts src/lib/__tests__/track.test.ts && git commit -m "feat(track): 実用英語モードの記憶（getTrack/setTrack/clearTrack）"
```

---

## Task 2: HomeHub に実用英語モードを組み込む

**Files:** Modify `src/app/HomeHub.tsx`

まず `src/app/HomeHub.tsx` を読み、以下の既存構造を把握する:
- `StagePicker`（学齢ピッカー・`STAGES` を並べる）
- 主コンポーネントの state（mounted/stage/grade/progress/…）と mount useEffect（getStage/getGrade/getActiveChild/fetchSummary）
- 描画分岐（`if (!mounted)`→skeleton、`if (stage===null)`→StagePicker、`if (grade===null)`→GradePicker、else→hub）
- 既存の eikaiwa カード（`href="/learn/eikaiwa"`、`COPY.*.eikaiwaLabel`/`taglineEikaiwa`）と `progress.bySubject["eikaiwa"]`

### 変更点（受け入れ基準）

**(a) track 状態と読み込み**
- import: `import { getTrack, setTrack, clearTrack } from "@/lib/track";`
- state: `const [track, setTrackState] = useState<"eikaiwa" | null>(null);`
- mount useEffect の中で `setTrackState(getTrack());` を追加（既存の getStage/getGrade と並べて）。

**(b) StagePicker に「実用英語」ボタン**
- `StagePicker` の props に `onPickTrack: () => void` を追加。
- `STAGES` の3ボタンの後（同じ grid 内）に4つ目のボタン「実用英語」（絵文字 🗣️・ラベル「実用英語」・range「TOEIC」・tagline「TOEIC語彙を4択で」）を追加。押すと `onPickTrack()`。既存3ボタンの見た目に合わせる。grid は `sm:grid-cols-3` → 4つ入るよう `sm:grid-cols-2` などに調整可（見た目が崩れない範囲で）。
- 主コンポーネントに `const pickTrack = () => { setTrack("eikaiwa"); setTrackState("eikaiwa"); };` を追加し、`<StagePicker onPick={pickStage} onPickTrack={pickTrack} />` で渡す。

**(c) 実用英語モードの描画**
- 描画分岐の先頭（`if (!mounted)` の直後、`if (stage===null)` の前）に:
  ```tsx
  if (track === "eikaiwa") {
    return <EikaiwaHome
      progress={progress}
      onBackToSchool={() => { clearTrack(); setTrackState(null); }}
    />;
  }
  ```
- `EikaiwaHome`（同ファイル内の関数コンポーネント）を実装:
  - ヘッダ/ヒーロー: 「実用英語」🗣️、コピー「TOEIC語彙を4択でおぼえる」。
  - 「← 学校の学習にもどる」ボタン（`onBackToSchool`・`type="button"`）。
  - **実用英語の進捗カード**（5教科と別建て）: `progress?.bySubject["eikaiwa"]`（attempts/correct）から **のべ問題数・正答率** を表示（`pct()` 相当）。0問なら「まだ挑戦していません」。
  - **TOEICバンド/単元への導線**: 「TOEIC500 の語彙を練習する →」ボタンで `/learn/eikaiwa?grade=TOEIC500` へ（`router.push` か `<Link>`）。将来バンドが増えたらここに並べる。
  - 意味トークン（bg-paper/text-ink/text-sky/border-line/shadow-card）で既存の見た目に合わせる。5教科カードは出さない。
  - ※進捗の「バンド別」内訳は現状バンド1つ(TOEIC500)なので、v1は総合表示でよい（spec §5: v1はバンド単位、語単位は将来）。

**(d) 混ざらない確認**
- 実用英語モードでは5教科カード・学齢ヒーローを出さない。学校モード（stage/grade）では実用英語モードのUIを出さない。既存の学校モードの見た目・挙動は不変。実用英語の記録(subject=eikaiwa)は既存どおり5教科の制覇%(`/progress`)には入らない（STAGE_GRADES外）。

- [ ] **Step 1: 上記(a)〜(d)を実装**
- [ ] **Step 2: 型チェック＆ビルド**

Run: `cd "Y:\ai-sensei-eikaiwa" && npx tsc --noEmit && npm run build 2>&1 | grep -E "Compiled|error|Error" | head`
Expected: クリーン・成功

- [ ] **Step 3: 全テスト**

Run: `cd "Y:\ai-sensei-eikaiwa" && npx vitest run 2>&1 | tail -3`
Expected: 全緑（既存＋track）

- [ ] **Step 4: コミット**

```bash
cd "Y:\ai-sensei-eikaiwa" && git add src/app/HomeHub.tsx && git commit -m "feat(home): 実用英語トラック（学齢ピッカーに実用英語＋専用モード＋別進捗）"
```

---

## Task 3: 実機スモーク・全体検証

- [ ] `cd "Y:\ai-sensei-eikaiwa" && npx tsc --noEmit`（クリーン）
- [ ] `npx vitest run`（全緑）
- [ ] `npm run build`（成功）
- [ ] `npm run dev` で確認（任意）: 学齢ピッカーに「実用英語」が出る／選ぶと実用英語モード（TOEIC語彙導線＋実用英語進捗）／「学校の学習にもどる」で戻れる／学校モードは不変／実用英語の記録が5教科 `/progress` に出ない。

---

## Self-Review（作成者記録）
- **Spec §3 ピッカー**=Task2(b)。**§2 モード記憶**=Task1＋Task2(a)。**§4 実用英語ホーム**=Task2(c)。**§5 別進捗（5教科と混ぜない）**=Task2(c)(d)（eikaiwaのみ表示・制覇%はSTAGE_GRADES外で自動除外）。全項目に対応。
- **型整合**: `getTrack(): "eikaiwa"|null`（Task1）を HomeHub の track 状態（Task2）で一貫使用。
- **非プレースホルダ**: track.ts は完全コード＋TDD。HomeHub は既存の大ファイルのため「まず読む→踏襲」＋受け入れ基準を明示（既存 StagePicker/描画分岐/eikaiwaカード/progress を手本）。
- **非スコープ**: 語単位の習得数、バンド追加(600+)、実用英語の学齢別テーマ、専用進捗ページ `/progress/eikaiwa`（v1はホーム内カード）。
