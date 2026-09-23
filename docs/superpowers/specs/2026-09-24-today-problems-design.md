# 今日やった問題（親が見られる）設計書

- 日付: 2026-09-24
- 対象: AI先生（`Y:\AI先生`）
- 概要: 親が「今日やった問題」を見られるように、`/today` に **今日の単元別内訳** と **今日まちがえた問題（問題文つき）** を追加する。親は `/family` の各子「今日」から到達（既存導線）。**AIは使わない**（既存の attempts / mistakes から集計）。

## 1. 目的・方針
- 親が「今日なにをやったか／どこでつまずいたか」を把握し、一緒に見直せるようにする。
- 解いた問題の**問題文は保存していない**（attempts は 単元/正誤/日時のみ）→ 内訳は**単元粒度**で見せる。
- **まちがえた問題は問題文つきで残っている**（mistakes）→ 今日分を問題文で見せる（答えは出さない）。

## 2. データ層
### 2-1. mistakes に epoch ms 正規化を追加（Store 3実装）
- `MistakeRow` に `createdAtMs: number` を追加（既存 `createdAt: string` は残す）。
- `listMistakes` の SELECT で正規化: Postgres=`(EXTRACT(EPOCH FROM created_at)*1000)::bigint`、SQLite=`CAST(strftime('%s', created_at) AS INTEGER)*1000`、Noop=空配列のまま。
- 目的: JST 今日の抽出を `toJstDateKey(createdAtMs)` で行い、バックエンド別の日時文字列パースを避ける（attempts と同方針）。

### 2-2. 今日の単元別内訳（純関数）
- `todayStats`（`progress-stats/today.ts`）の戻り値に `byUnit: { subject: string; unitId: string; attempts: number; correct: number }[]` を追加。
  - 今日(JST)の attempts を `(subject, unitId)` で集計。並びは attempts 降順（多い順）、同数は unitId 昇順で安定化。
  - 既存フィールド（total/correct/rate/bySubject/testCount/tests）は不変。

## 3. API（`/api/progress/today` を拡張・認可は不変）
- 既存: `account`→401 / `childId`必須→400 / `ownsChild`→403。
- 追加処理:
  - `byUnit` の各要素に**単元タイトル**を付与: `subject==="math"` は `getUnit(unitId)?.title`、それ以外は `getQuizUnit(unitId)?.title`（見つからなければ unitId をそのまま）。返り値 `byUnit: { subject, unitId, title, attempts, correct }[]`。
  - `listMistakes(childId, 1000)` を取得し、`toJstDateKey(createdAtMs) === todayKey` で今日分を抽出。`review/list` と同じ方式で問題文プレビューを解決（quiz=`getQuizUnit` の item.question、math=`problem` JSON の prompt）→ `todayMistakes: { id, subject, unitId, kind, preview }[]`。**答え/answerIndex は返さない。**
- レスポンスに `byUnit` と `todayMistakes` を追加（既存キーは不変）。

## 4. クライアント型・表示
- `TodayResponse`（`progress-client-types.ts`）に `byUnit` と `todayMistakes` を追加。
- `/today` ページに 2 セクション追加（既存の数値/教科バーの下）:
  - **今日やった単元**: `title` ＋ `correct/attempts`（例「わり算 6/8」）。教科絵文字は既存 `groupTodayBySubject` の割当と揃える（無ければ単元名のみ）。0件なら非表示。
  - **今日まちがえた問題**: `preview`（問題文）を控えめな赤系カードで列挙。0件なら「今日のまちがいはありません」。学齢別コピーは既存 `TODAY_COPY` に最小追加（solvedUnits/todayMistakes 見出し）。
- 学習者本人にも同じ `/today` で見える（親専用にはしない）。

## 5. エラー処理
- 既存踏襲: 401→/login、403→/family、通信失敗→従来の空表示。追加セクションはデータが無ければ出さない。

## 6. 品質・非スコープ
- **AI不使用**。tsc/build/Vitest 緑を維持。テスト: `todayStats.byUnit`（純ロジック）／mistakes `createdAtMs`（Store 3実装のうち SQLite で検証）／today ルート（byUnit・todayMistakes・答え非露出）。
- 非スコープ（将来）: 正解した問題の問題文保存・表示、日付指定（過去日）閲覧、教科アイコンの厳密一致、まちがいのその場再挑戦（/review に既存）。

## 7. 検証観点
- 今日 attempts があると単元別内訳が出る（タイトル解決・多い順）。
- 今日の mistakes が問題文つきで出る（答えは出ない）。昨日以前のまちがいは出ない。
- 未ログインは /login、他人の子は 403。既存の今日数値/教科バー/テスト点は不変。
