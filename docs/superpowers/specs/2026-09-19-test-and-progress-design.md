# AI先生 テスト＆成績アップ機能 — 設計書

- 日付: 2026-09-19
- 対象アプリ: AI先生（Next.js 15 App Router / TS / Tailwind、作業ディレクトリ `Y:\AI先生`）
- 状態: ブレスト合意済み。実装計画（writing-plans）へ渡す前の確定仕様。

## 1. 目的

単元ごと・複数単元・全単元を選んで「テスト」を受けられるようにし、その点数の推移を前回と比較して**勉強の成果が目に見える**ようにする。あわせて、成績アップに直結する「仕掛け」を乗せる。

## 2. 前提・方針（既存資産）

- **AIは使わない**（プロジェクト方針）。出題・採点・診断・弱点抽出・復習提案はすべてコード／ルールベース。
- 出題・採点は既存エンジンをそのまま流用する:
  - 算数: `src/lib/math/index.ts` — `UNITS` / `unitsForGrade` / `generateProblem(unitId)` / `gradeAnswer` / `diagnose` / `getHint`
  - クイズ（理社国英）: `src/lib/quiz/index.ts` — `QUIZ_UNITS` / `subjectUnits` / `unitsFor` / `pickQuestion(unitId)` / `gradeQuiz`
- 採点はサーバー側・答え非露出・AES-GCM暗号トークン方式を踏襲（`src/lib/math/token.ts` / `src/lib/quiz/token.ts`）。
- 永続化は既存の Store 抽象（`src/lib/db/index.ts`）を拡張: Postgres(Neon)本番 / ローカルSQLite / Vercel未設定時 Noop。DBが無い環境では localStorage フォールバック（`src/lib/progress.ts` と同じ方針）。
- 学習者の識別は既存の `childId`（localStorage、`getChildId()`）。
- 学齢モード（小/中/高）とコピー出し分けの既存方針を踏襲する。

## 3. テストの流れ（ハイブリッド型）

採点の正確さ（本番型）と、既存の誤答診断による学びの深さを両取りする。

1. **入口**: HomeHub と各教科ページに「テストにちょうせん」ボタンを追加。
2. **単元選択**:
   - 1つ / 複数（チェックボックス）/ 全部（その教科の学齢相当の全単元）。
   - 「弱点だけ」ボタン（→ §5-①で自動生成）。
   - 学齢モードに応じて、選べる単元を現在の学年帯に絞る（既存 `unitsForGrade` / `unitsFor` を利用）。
3. **問題数**: 既定10問。5 / 10 / 20 から選択可。選んだ単元へ**均等配分**（端数は先頭単元から1問ずつ）。単元内の問題は既存の `generateProblem`（算数=毎回生成）／`pickQuestion`（クイズ=バンクから抽選、同一テスト内は重複回避）で用意。
4. **出題（本番パート）**: 1問ずつ提示。**途中はヒント・○×・診断を出さない**。答えて次へ、を最後まで。中断・再開は当面非対応（1回で解ききる）。
5. **採点**: サーバーで一括採点し点数を確定（例 8/10 = 80点）。結果画面に
   - 大きな点数表示、**前回との差**（同一「テスト種別キー」§4.3 の直近と比較）、**自己ベスト更新**のお祝い演出（既存マイクロアニメ `popIn` 等）。
6. **復習パート（採点後）**: **まちがえた問題だけ**、既存の `diagnose`（算数）／`gradeQuiz` の `explanation`・`choiceHints`（クイズ）で「なぜ？」を提示し、解き直しできる。まちがいノート（§5-④）に自動追加。点数は最初の一発で確定済み（解き直しは点数に影響しない）。

## 4. データモデル

既存 Store 抽象（`Store` インターフェース + Postgres/SQLite/Noop 実装）に、以下を追加する。localStorage フォールバックは §4.4。

### 4.1 既存テーブル（継続利用）
- `attempts (id, child_id, subject, unit_id, correct, created_at)` — 練習・テスト両方の1解答。**単元別の到達度・推移の素**。テスト由来かを区別するため `source` 列を追加（`'practice' | 'test'`、既定 `'practice'`）。

### 4.2 追加テーブル `test_results`
| 列 | 型 | 説明 |
|---|---|---|
| id | TEXT PK | UUID |
| child_id | TEXT | 学習者 |
| subject | TEXT | 教科（`math`/`science`/…）|
| unit_ids | TEXT | 出題した単元IDのCSV（順不同、ソートして保持）|
| test_key | TEXT | 比較用キー（§4.3）|
| total | INTEGER | 問題数 |
| score | INTEGER | 正解数 |
| taken_at | TIMESTAMPTZ / TEXT | 受験日時 |

インデックス: `(child_id, test_key, taken_at)`。

### 4.3 「前回との比較」キー `test_key`
- テストは任意の単元組み合わせで受けられるため、比較は **`subject` ＋ 選択単元集合** を正規化したキーで行う。
  - 例: `math|div-basic,dec-mul` のように単元IDをソートして連結。
  - 「全部」テストは `subject|__ALL__`、「弱点だけ」は当日の実単元集合で通常キー。
- **推移グラフ**: 同一 `test_key` の `test_results` を時系列で結ぶ（点数の折れ線）。
- **前回差・自己ベスト**: 同一 `test_key` の直近／最高スコアと比較。
- 単元別の到達度（§6 下段）は `test_key` に依らず `attempts` を `unit_id` で集計する（どのテストで解いても1単元の力に合算）。

### 4.4 追加テーブル `mistakes`（まちがいノート）
| 列 | 型 | 説明 |
|---|---|---|
| id | TEXT PK | UUID |
| child_id | TEXT | 学習者 |
| subject | TEXT | 教科 |
| unit_id | TEXT | 単元 |
| item_ref | TEXT | 復元用参照（クイズ=itemId、算数=問題を再現できる最小メタ or 表示用スナップショット）|
| label | TEXT | 一覧表示用の短い問題文 |
| created_at | TIMESTAMPTZ / TEXT | 記録日時 |
| resolved_at | TIMESTAMPTZ / TEXT NULL | 解き直して正解した日時（未解決は NULL）|

- 表示は `resolved_at IS NULL` の未解決分。解き直し正解で `resolved_at` を埋め、消し込む。
- 算数は問題が毎回生成のため、`item_ref` に単元IDのみ保持し「同じ単元をもう1問」で解き直す方式でも可（v1はこの簡易方式を許容）。

### 4.5 localStorage フォールバック
- DB無し環境（Vercel で `DATABASE_URL` 未設定）では、`test_results` 相当・`mistakes` 相当・ストリークを localStorage に保存する（`progress.ts` と同じ SSR 安全ガード、キーは `ai-sensei-tests-v1` / `ai-sensei-mistakes-v1` / `ai-sensei-streak-v1`）。
- 本番（Neon 接続済み）ではサーバー保存を優先。読み書きの入口は `test_results`/`mistakes` 用の read/log ヘルパー（`src/lib/db/log.ts` / `read.ts` を踏襲）に集約する。

### 4.6 自己ベスト・ストリーク
- 専用テーブルは作らない。
  - 自己ベスト = 同一 `test_key` の `test_results` の最大 `score/total`。
  - ストリーク = `attempts`（または test_results）の `created_at` の「日付」ユニーク集合から連続日数を算出。
  - 集計は read ヘルパー内で行う。

## 5. 仕掛け（v1）

すべてルールベース（AI不使用）。

1. **弱点リターンマッチ**: `attempts` を `unit_id` で集計し、正答率が低い／直近で誤答した単元・問題を自動収集して「弱点テスト」を1タップ生成。まちがいノート（§4.4）とも連動。
2. **間隔反復リマインド**: 単元ごとの「最終学習日」と正答率から復習おすすめ度を算出（例: 高正答率でも数日空いた単元を「そろそろ復習しよ」提示）。しきい値ベースの単純ルール。トップ／せいせきページにチップ表示。
3. **自己ベスト＆目標点**: テスト開始前に「今回の目標＝前回＋α（例 +1問）」を提示。§4.6 の自己ベストを更新したらお祝い。
4. **まちがいノート**: §4.4。誤答を自動蓄積し、まとめて解き直し・消し込み。
5. **ストリーク**: §4.6 の連続日数＋カレンダー花丸。**途切れても責めない**やさしい演出（reduced-motion 配慮）。

（v2 送り: バッジ／単元マスター称号、保護者向けがんばりレポートの拡張。）

## 6. 成績の可視化（せいせきページ）

- 新設ページ `/results`（仮）。子ども向け・学齢別コピー。
  - **上段（点数の推移）**: 教科ごとに、直近に受けた `test_key` の折れ線。今回／自己ベスト／前回差を併記。
  - **下段（単元別の到達度）**: `attempts` を `unit_id` で集計したバー（色分け）。各バーに前回比 ↑↓／−。
  - チップ: ストリーク、弱点テスト導線、復習リマインド。
- 描画は軽量な自前 SVG（外部チャートライブラリは入れない）。
- **見守り画面**（`/guardian`）: 同データの保護者向け要約を最小追加（テスト回数・平均点・弱点単元）。厚い保護者レポートは v2。

## 7. API（追加）

既存の `/api/math/*`・`/api/quiz/*` に揃える。

- `POST /api/test/start` — `{ subject, unitIds, count }` を受け、出題セット（問題＋暗号トークン）と `test_key` を返す。答えは非露出。
- `POST /api/test/grade` — 解答一式＋トークンをサーバー採点し、`score/total`・各問正誤・誤答診断・`test_results` 保存を行う。まちがいは `mistakes` に記録。
- `GET /api/results?childId=…` — 推移（test_results）・単元別集計（attempts）・自己ベスト・ストリーク・復習リマインドを返す。
- まちがいノートの解き直し完了は `grade` 側で `resolved_at` を更新。

（実装は「答えはトークンからサーバー復元、クライアント申告を信用しない」既存原則を厳守。）

## 8. フェーズ分け（実装単位）

- **T1**: テストモード（ハイブリッド）＋ `test_results`・`attempts.source` ＋結果画面（点数・前回差・自己ベスト）＋ start/grade API。
- **T2**: せいせきページ `/results`（推移＋単元別マップ）＋まちがいノート（`mistakes`・解き直し・消し込み）。
- **T3**: 弱点リターンマッチ＋間隔反復リマインド＋ストリーク。
- **v2**: バッジ／称号、保護者レポート拡張。

## 9. 非スコープ（YAGNI）

- テストの中断・再開、制限時間、ランキング・他者比較。
- バッジ／称号・保護者レポート拡張（v2）。
- 外部チャートライブラリ、新規の学習者アカウント基盤（既存 childId を継続）。

## 10. 検証観点

- `npm run build` 緑 / 既存 Vitest 緑を維持。
- テスト採点の正確さ（答え非露出・トークン改ざん耐性）をテストで担保。
- DB3系統（Postgres/SQLite/Noop＝localStorage フォールバック）で結果保存と推移表示が壊れないこと。
- 学齢別（小/中/高）で単元絞り込み・コピーが破綻しないこと。
