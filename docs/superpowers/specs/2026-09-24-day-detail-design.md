# 過去の日の詳細（日別ドリルダウン）設計書

- 日付: 2026-09-24
- 対象: AI先生（`Y:\AI先生`）
- 概要: `/progress` の直近30日グラフ（`DailyBars`）の棒をタップすると、その日の詳細（問数・教科別・単元別内訳＋その日のまちがい）を見られるようにする。表示内容は `/today`（今日）と同じ。**AIは使わない**。

## 1. 目的・方針
- 「あとからその日、何問・どの教科・どの単元をやったか」を親子で確認できるようにする。
- 既存資産を最大限再利用（YAGNI・DRY）: `todayStats` は任意 dateKey で動く／`/today` の内訳描画を共有化／30日グラフをそのまま導線に。

## 2. API（既存 `/api/progress/today` を一般化・後方互換）
- クエリ `?date=YYYY-MM-DD` を追加。
  - 妥当（`^\d{4}-\d{2}-\d{2}$`＋実在日＋JST今日以前）なら、その日を `dateKey` として集計。
  - 未指定・不正・未来日は **今日にフォールバック**（`toJstDateKey(Date.now())`）。
- それ以外は現状のまま: `account`→401 / `childId`→400 / `ownsChild`→403。
- 集計は `todayStats(attempts, tests, dateKey)`＋単元タイトル付与＋その日(dateKey)の mistakes を preview つきで返す（**答え非露出**）。レスポンス形は不変。
- 日付妥当性判定は純関数 `isValidPastDateKey(key, todayKey)` を `progress-stats/time` 付近に追加（形式・実在日・未来でない）。テスト対象。

## 3. 表示の共有化（DRY）
- `/today` の本文（2タイル〈問数・正答率〉＋教科別バー＋テスト行＋今日やった単元＋今日まちがえた問題）を共有コンポーネント `src/components/DayBreakdown.tsx` に抽出。
  - props: `{ data: TodayResponse; copy: DayCopy }`（`copy` は既存 `TODAY_COPY` の項目＝solved/accuracy/testPrefix/unitsTitle/mistakesTitle/noMistakes）。
  - `/today` はこの共有コンポーネントを使う（praise とヘッダはページ側に残す）。挙動・見た目は不変。

## 4. 新ページ `/progress/day/[date]`
- クライアントページ。`params.date`（`YYYY-MM-DD`）を読み、`getChildId()` で `/api/progress/today?childId=&date=…` を取得し `DayBreakdown` で表示。
- 見出し: 「M月D日のがんばり」（`YYYY-MM-DD`→和名の小ヘルパー）。`← もどる`（`/progress`）。学齢別コピーは `getStage()` から（`/today` と同じ `TODAY_COPY`）。
- 認可失敗: 401→/login、403→/family（`/today`踏襲）。その日 total0 は「この日は学習していません」（byUnit/mistakes セクションは出さない）。

## 5. 導線（`DailyBars` を任意タップ可能に）
- `DailyBars` に任意 prop `onSelectDate?: (date: string) => void` を追加。
  - 指定時: 各棒を `<button>`（または透明オーバーレイ）にして `onSelectDate(day.date)` を呼ぶ。`cursor-pointer`・アクセシブルなラベル（`aria-label="M月D日"`）。
  - 未指定時: 現状どおり非インタラクティブな SVG。
- `/progress` の大きい `DailyBars` に `onSelectDate={(d) => router.push(\`/progress/day/${d}\`)}` を渡す。
- `/family` の小型（compact）`DailyBars` は v1 では非タップ（親は各子「全体」→`/progress` から）。

## 6. 品質・非スコープ
- **AI不使用**。tsc/build/Vitest 緑。テスト: `isValidPastDateKey`（純）／today ルートの `date` 指定（過去日=0・未来/不正→今日）／既存 byUnit・答え非露出の維持。
- 非スコープ（将来）: カレンダー/任意日ピッカー（30日より前）、`/family` 小型グラフからの直タップ、日別の推移比較、正解問題の問題文保存。

## 7. 検証観点
- `/progress` の棒をタップ→その日の詳細（問数・教科・単元・その日のまちがい）が出る。
- 未来日・不正日付は今日にフォールバック。範囲外/0問の日は「この日は学習していません」。
- 未ログイン→/login、他人の子→403。`/today` の見た目・挙動は不変（共有化後も）。答えは出さない。
