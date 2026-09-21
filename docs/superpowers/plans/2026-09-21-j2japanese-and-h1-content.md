# 中2国語 増量＋高1（歴史総合・数A）新規コンテンツ 計画

> **For agentic workers:** 量産は superpowers:dispatching-parallel-agents（1エージェント=1新ファイル）＋監督（統合）＋独立事実/整合監査。数A（コード生成）は自己検証テスト必須。段階ごとに tsc/vitest/build 緑を確認。

**Goal:** ①中2国語を各単元15問へ増量、②高1「歴史総合」を新規（選択式・各単元25問以上・事実監査）、③高1「数A」〈場合の数と確率／整数の性質〉を算数エンジンの数値生成単元として新規、④高校(高1)コンテンツをUIに露出（データ駆動で自動）。**AI不使用**（出題・採点・監査は全てコード/人手）。

**方式（既存の実績パターン）:**
- クイズ増量＝**merge-by-id**（同一 unit id・item id は `<unitId>-mN`）を別ファイルに書き、`quiz/index.ts` で spread。
- 高1歴史＝新規 `QuizUnit`（subject `"history"`, grade `"高1"`）。
- 高1数A＝新規 `UnitDef`（grade `"高1"`）を `math/index.ts` の `ALL_DEFS` に追加。UNITS/pool/UI/進捗は自動追従。
- 監査＝**独立エージェントが事実/整合をBlockerゼロまで**（歴史＝史実、国語＝表記・別解つぶし、数A＝計算の二重検算）。

**品質制約（content-audit テスト＝必ず緑に保つ）:**
- unit id はグローバル一意／item id は単元内一意／`answerIndex ∈ [0, choices.length)`／`choices.length≥2`・空/重複なし／`choiceHints` があれば `length===choices.length` かつ `choiceHints[answerIndex]===null`／`explanation` 非空。

---

## Phase 1: 中2国語を各単元15問へ増量

**対象（既存17単元・現在124問 → 各15問）:**
- `japanese_j2.ts`（6単元・各6問→各15＝+9問/単元）: `j2j-kanji` / `j2j-vocab` / `j2j-grammar-yougen` / `j2j-grammar-jodoushi` / `j2j-keigo` / `j2j-classic`
- `japanese_j2d.ts`（11単元・各8問→各15＝+7問/単元）: `j2dj2-kanji-yomi` / `j2dj2-kanji-kaki` / `j2dj2-vocab-kanyou` / `j2dj2-yoji` / `j2dj2-taigi-ruigi` / `j2dj2-yougen` / `j2dj2-jodoushi-joshi` / `j2dj2-keigo` / `j2dj2-kobun` / `j2dj2-kanbun` / `j2dj2-tanka-haiku`

**新規ファイル（merge-by-id・同一id・item id `<unitId>-m1..`）:**
- `src/lib/quiz/japanese_j2_more.ts` → `export const JAPANESE_J2_MORE: QuizUnit[]`（6単元 ×+9問）
- `src/lib/quiz/japanese_j2d_more_a.ts` → `JAPANESE_J2D_MORE_A`（j2dj2 の前半6単元 ×+7問）
- `src/lib/quiz/japanese_j2d_more_b.ts` → `JAPANESE_J2D_MORE_B`（j2dj2 の後半5単元 ×+7問）

各 `QuizUnit` は既存と同じ `id/subject:"japanese"/grade:"中2"/title/lesson` を再掲（merge時に破棄されるが型のため必要）。`items` は追加分のみ。全 item に `choiceHints`（誤答の理由・別解つぶし）を付ける。

**タスク:**
- [ ] **1-1 authoring（並列3エージェント, Sonnet）**: 上記3ファイルを各自が自己完結で作成。各 item: `question`（中2レベル・国語）/ `choices`（4択・重複なし）/ `answerIndex` / `explanation` / `choiceHints`（`answerIndex` は null、他は誤答理由）。**国語の要点＝別解つぶし**（漢字/文法/古文で「複数正解に見える選択肢」を作らない）。**index.ts は触らない**（統合は監督）。
- [ ] **1-2 統合（監督＝あなた）**: `quiz/index.ts` の import に3ファイルを追加し、`QUIZ_UNITS` の `...JAPANESE_UNITS_J2` の直後に `...JAPANESE_J2_MORE`、`...JAPANESE_UNITS_J2D` の直後に `...JAPANESE_J2D_MORE_A, ...JAPANESE_J2D_MORE_B` を spread。
- [ ] **1-3 監査（並列2エージェント, Sonnet）**: 国語の事実・表記・別解成立を精査。Blocker（誤字/誤答/別解成立/choiceHints不整合）ゼロまで修正。
- [ ] **1-4 検証**: `npx vitest run`（content-audit 含む緑）／`npx tsc --noEmit`／各単元が15問になっていることを確認。
- [ ] **1-5 コミット**: `feat(content): 中2国語を各単元15問へ増量（+約130問）`

---

## Phase 2: 高1「歴史総合」新規（選択式・各単元25問以上）

**科目:** `subject: "history"`, `grade: "高1"`（現行課程の高1必修）。近現代の世界と日本を横断。
**単元（6単元 × 25問以上・各単元1ファイル）:**
1. `h1his-kindaika`（近代化への問い）: 産業革命・市民革命・アメリカ独立・フランス革命・国民国家形成 → `src/lib/quiz/history_h1_1.ts`
2. `h1his-kaikoku`（結びつく世界と日本の開国）: アヘン戦争・ペリー来航・不平等条約・幕末・明治維新 → `history_h1_2.ts`
3. `h1his-kokuminkokka`（明治の国民国家）: 大日本帝国憲法・殖産興業・自由民権・日清日露戦争 → `history_h1_3.ts`
4. `h1his-teikoku`（帝国主義と第一次世界大戦）: 帝国主義・第一次大戦・ロシア革命・ヴェルサイユ体制・国際連盟 → `history_h1_4.ts`
5. `h1his-taishuka`（大衆化と第二次世界大戦）: 大正デモクラシー・世界恐慌・ファシズム・満州事変〜太平洋戦争 → `history_h1_5.ts`
6. `h1his-sengo`（戦後の国際秩序とグローバル化）: 冷戦・戦後日本（占領/高度成長）・脱植民地化・冷戦終結・現代 → `history_h1_6.ts`

各ファイル `export const HISTORY_H1_N: QuizUnit[]`（1単元）。item id `<unitId>-1..25+`。全 item に `choiceHints`。

**タスク:**
- [ ] **2-1 authoring（並列6エージェント, Sonnet・1エージェント=1単元ファイル）**: 各25問以上。史実の年号・人物・因果を正確に。難易度は高1（用語の意味・時系列・因果を問う）。**史実監査に耐える書き方**（曖昧・俗説を避ける）。index.ts は触らない。
- [ ] **2-2 統合（監督）**: `quiz/index.ts` に6ファイルを import し `QUIZ_UNITS` に spread（歴史群の近く）。
- [ ] **2-3 事実監査（並列3エージェント, Sonnet）**: 史実誤り・年号・因果・選択肢の妥当性・別解成立を精査。Blockerゼロまで。造語ダミー禁止（実在語で誤答肢を作る）。
- [ ] **2-4 検証**: vitest（content-audit緑）／tsc／各単元25問以上を確認。`subjectGrades("history")` に `高1` が入り `/learn/history?grade=高1` に出ることを確認。
- [ ] **2-5 コミット**: `feat(content): 高1 歴史総合 6単元×25問以上を新規追加`

---

## Phase 3: 高1「数A」数値生成単元（場合の数と確率・整数の性質）

**新規ファイル:** `src/lib/math/units_h1.ts` → `export const UNIT_DEFS_H1: DiagUnitDef[]`。`grade: "高1"`。**すべて `generate()` で問題・正解をコード確定**（AI不使用）。`math/index.ts` の `ALL_DEFS` に `...UNIT_DEFS_H1` を追加。

**単元（7単元）:**

*場合の数と確率:*
1. `h1a-perm`（順列 nPr）: n∈[4,8], r∈[2,min(4,n)]。`answer = String(P)`（P=n!/(n-r)!）, `answerType:"integer"`, meta{n,r,P}。diagnose: nCr値と一致なら「順番を区別するのが順列（P）。それは組合せC」。
2. `h1a-comb`（組合せ nCr）: 同 n,r。`answer = String(C)`（C=P/r!）, integer, meta{n,r,C,P}。diagnose: nPr値と一致なら「並び順を区別しないのが組合せ。それは順列P」。
3. `h1a-prob-dice`（確率・基本）: 2個のさいころで「和が k」または「目の条件」等、標本空間36の基本事象。`answer` は既約分数 `answerType:"fraction"`, meta{favorable, total:36}。diagnose: 約分忘れ/分母取り違え。
4. `h1a-expectation`（期待値）: 単純な離散（例: 1〜6のさいころの得点、当たり本数の期待値）。`answer` は既約分数 or 整数、`answerType:"fraction"`。meta。diagnose: 確率の和と混同等。

*整数の性質:*
5. `h1a-gcd`（最大公約数・互除法）: a,b∈[12,200]。`answer=String(gcd(a,b))`, integer, meta{a,b,g}。diagnose: lcmと一致なら「それは最小公倍数」。
6. `h1a-lcm`（最小公倍数）: 同。`answer=String(lcm)`, integer。diagnose: gcdと一致なら「それは最大公約数」。
7. `h1a-divisor-count`（約数の個数）: n を素因数分解し個数 = Π(e_i+1)。n は 2〜3個の素因数の積（例 2^a·3^b·5^c, 指数1〜3）。`answer=String(count)`, integer, meta{n, count}。diagnose: 約数の総和と混同/n自身の数え間違い。

（**n進法は今回スコープ外**：`gradeAnswer` の text 分岐が `a:b` 比専用のため。将来 text 拡張時に追加。）

**タスク:**
- [ ] **3-1 実装（1エージェント, Sonnet・慎重に）**: `units_h1.ts` を作成。各単元の `generate`/`diagnose`/`hint`/`lesson`/`title` を実装。ヘルパ（`fact`, `gcd`, `lcm`, `nPr`, `nCr`, `reduceFraction`）はファイル内に純関数で用意。`answer` は必ず `generate` 内で数式から確定（別途独立式で二重計算して一致を assert する自己検証を実装内コメントで担保）。
- [ ] **3-2 統合（監督）**: `math/index.ts` の `ALL_DEFS` に `...UNIT_DEFS_H1` を追加（import 追加）。
- [ ] **3-3 自己検証テスト**: `src/lib/math/__tests__/math.test.ts` の「自己整合」ループが全単元 ×30問で `gradeAnswer(id,p,p.answer).correct===true` を確認（新単元は自動対象）。**加えて** `src/lib/math/__tests__/h1a.test.ts` を新規作成し、各単元を 2000 ケース生成して **独立実装で answer を再計算し一致**を検証（nPr/nCr/gcd/lcm/約数個数/確率の分子分母）。fraction は既約形一致。
- [ ] **3-4 数学監査（1エージェント, Sonnet）**: 生成範囲・境界（r=n, gcd互いに素, 素因数指数最大）・分数の既約・期待値の定義が正しいかを精査。Blockerゼロまで。
- [ ] **3-5 検証**: `npx vitest run`（math自己整合＋h1a独立再計算＋content-audit緑）／tsc／`/math?grade=高1` と `subjectPool("math","高1")` に単元が出ることを確認。
- [ ] **3-6 コミット**: `feat(math): 高1 数A（順列/組合せ/確率/期待値/GCD/LCM/約数の個数）を数値生成で追加`

---

## Phase 4: 統合検証・高校露出スモーク・PR・デプロイ

- [ ] **4-1 全体検証**: `npx tsc --noEmit`／`npx vitest run`（全緑・件数増）／`npm run build`（成功）。
- [ ] **4-2 露出スモーク**: dev で 高校→高1 を選び、HomeHub で 数A/歴史 カードが「準備中」でなく出る／`/math?grade=高1`・`/learn/history?grade=高1` に単元が出る／`/test?subject=math|history` の高1、`/progress` の対象単元に高1が含まれることを確認（コード変更不要のはずだが実挙動で確認）。
- [ ] **4-3 コミット済みを push → PR(base=main) → マージ → Vercel READY 確認**（`AUTH_SECRET` 等は設定済み）。

---

## Self-Review / Notes
- **UI露出はコード変更不要**（データ駆動）を Explore で確認済み。もし高校カードが出なければ HomeHub の `hasContent(grade)` 判定を確認（grade が `mathGrades`/`subjectGrades` に含まれるか）。
- 中2国語の増量数＝各15問（他中2教科と同基準）。高1歴史＝各25問以上（ユーザー指定「しっかり目」）。数A（数値生成）＝実質無制限生成のため単元カバレッジで担保。
- 監査は**史実（歴史）／表記・別解（国語）／二重検算（数A）**を独立エージェントで。エージェントに index 編集をさせない（統合は監督が確定）。
- fraction 採点は既約一致（`6/8`==`3/4`）。確率・期待値は既約で出す。
- 段階順序: Phase1→2→3→4（ユーザー指定: 中2国語の後に高1）。各Phase完了時にコミット。
