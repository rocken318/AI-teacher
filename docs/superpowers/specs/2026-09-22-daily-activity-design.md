# 日々のがんばり（直近30日の軌跡）設計書

- 日付: 2026-09-22
- 対象: AI先生（`Y:\AI先生`）
- 概要: 「一日どれくらいやったか」「毎日続けているか」を親子で見えるようにする。直近30日の**日別問題数（努力量）の棒グラフ**＋連続日数を、子の`/progress`上部と親の`/family`の各子に表示する。**AIは使わない**（既存 attempts から集計）。

## 1. 目的・方針
- 親が知りたいのは「日々努力しているか」。その軌跡（毎日の学習量）を可視化する。
- 既存の `attempts`（childId＋`createdAtMs`）と `progress-stats` の日付ロジックを再利用（新テーブル不要・YAGNI）。
- 濃淡/高さ＝**その日に解いた問題数**（努力量）。連続日数も併記。

## 2. データ（純関数・テスト対象）
`src/lib/progress-stats/daily.ts`（新規）:
- `dailyActivity(records: AttemptRecord[], todayKey: string, days = 30): DailyActivity`
- 返り値 `DailyActivity = { days: { date: string; count: number }[]; activeDays: number; maxCount: number }`
  - `days`: todayKey から遡って `days` 日ぶん、**時系列昇順**（古い→今日）。各日の `count` = その日(JST)の attempts 件数。0問の日も `count:0` で含める（抜けない）。
  - `activeDays`: 期間内で count>0 の日数。
  - `maxCount`: 期間内の最大 count（棒の高さ正規化用。全0なら0）。
- 実装は既存 `toJstDateKey`（集計）と `addDaysKey`（窓の日付列生成）を再利用。`Date.now()` は使わない（todayKey は呼び出し側＝ルートが渡す）。
- 連続日数は既存 `currentStreak` / 今月学習日数は `daysInMonth` を流用（新規実装しない）。

## 3. API
`src/app/api/progress/daily/route.ts`（新規・`/today`と同じ認可）:
- `GET /api/progress/daily?childId=&days=30`
- 認可順: `currentAccountId`→無ければ401 / `childId`必須→400 / `ownsChild`→403。
- 処理: `listAttempts(childId)` → `todayKey = toJstDateKey(Date.now())` → `dailyActivity(attempts, todayKey, days)`。連続日数用に日付キー集合から `currentStreak`/`daysInMonth` も算出。
- 返り値: `{ days, activeDays, maxCount, streak: { current: number; thisMonth: number } }`。
- `days` はクランプ（7〜60、既定30）。

## 4. 表示コンポーネント
`src/components/charts/DailyBars.tsx`（新規・SSR安全＝データ無しなら何も描かない）:
- props: `{ days: {date,count}[]; maxCount: number; compact?: boolean }`。
- 直近30日の日別棒グラフ。棒の高さ ∝ `count / maxCount`（maxCount=0 は全て最小の薄いベースライン）。今日（配列末尾）を強調色。0問の日は薄いベースライン。
- 色は既存トークン: 学習ありは sky 系、今日は terra 強調。数値は最小限（軸は「30日前 / 今日」程度）。
- `compact` で高さ・余白を縮めた小型版（/family 一覧用）。

## 5. 置き場所（クライアント配線）
- **子の `/progress` 上部**（タイトル「全体の進捗」直下・ドーナツの上）: 「日々のがんばり（直近30日）」セクション＝大きめ `DailyBars` ＋ 「連続◯日 / 今月◯日」。`/progress` は既にログイン前提（401→/login）なので、マウント後 `getChildId()` で `/api/progress/daily` を取得。overall とは別 fetch（並行）。
- **親の `/family`** の各子カード: リスト取得後、子ごとに `/api/progress/daily?childId=…&days=30` を取得し、**小型 `DailyBars` ＋「連続◯日」バッジ**をカード内に表示。取得は best-effort（失敗時は非表示）。`Promise` で各子並行。

## 6. エラー処理
- 401→`/login`（/progress の既存踏襲）、403→スキップ、通信失敗→黙って非表示。/family は子ごと best-effort（1件失敗が他を壊さない）。

## 7. 品質・非スコープ
- **AI不使用**。tsc/build/Vitest 緑を維持。`dailyActivity` の純ロジックはユニットテスト（空/単日/複数日/JST境界/30日窓/全0）。ルートは既存 `api/progress/__tests__` 踏襲で認可（401/400/403）と正常系。
- 非スコープ（将来）: カレンダー型ヒートマップ、週/月粒度切替、教科別の日次内訳、目標（1日◯問）設定、通知。

## 8. 検証観点
- 直近30日の各日の問題数が棒で出る（0問の日も並ぶ）。今日が強調される。
- 連続日数・今月の学習日数が併記される。
- 親の /family で各子の軌跡＋連続日数がひと目で分かる。
- 未ログインは /progress→/login。他人の子は 403 で見えない。5教科の制覇%等の既存表示は不変。
