# 単元選択でマスター度を表示 設計書

- 日付: 2026-09-21
- 対象: AI先生（`Y:\AI先生`）
- 概要: 教科クイズ／算数の**単元選択画面**で、各単元を「どれだけマスターしたか（制覇度）」が分かるようにする。制覇の定義は全体ダッシュボードと同じ（正答率≥0.7かつ≥5問）。**AIは使わない**。

## 1. 目的・方針
- 単元カードに「制覇バッジ＋正答率＋のべ問題数」を出し、現在地と達成感を可視化する。
- 制覇しきい値は既存 `progress-stats/stats`（`MASTERY_RATE=0.7`／`MASTERY_MIN_ATTEMPTS=5`）を**再利用して一本化**。
- データは**ローカル中心＋ログイン時サーバー同期**（HomeHubと同じ思想）。未ログインの子でも動く。

## 2. データ
- `recordAttempt(subject, unitId, correct)` を拡張し、教科別（従来）に加え**単元別**もローカルに積む（新キー `ai-sensei-unit-progress-v1`）。`__random__` のダミー単元は単元別に積まない。
- `getUnitProgress(): Record<unitId, {attempts, correct}>` を追加。
- ログイン中（アクティブ子あり）は `/api/progress/subject?childId&subject` の `units[]` を単元別集計として取得し、**その単元はサーバー優先**で表示（端末間で正確）。非テスト教科（eikaiwa 等）は 400 になるので静かにローカルのみ。

## 3. 純ロジック（`src/lib/unit-mastery.ts`・テスト対象）
- `masteryView(stat)` → `{attempts, correct, rate, percent, mastered}`。
- `masteryHint(view)` → 未挑戦/制覇は ""、問題数不足は「あとN問で制覇はんてい」、正答率不足は「制覇まで正答率70%」。
- `pickUnitStat(unitId, local, server)` → サーバー優先→ローカル→空。
- `bumpUnit(map, unitId, correct)` → 楽観更新（不変）。

## 4. 表示（`src/components/UnitMastery.tsx`）
- `stat=null`（マウント前）は何も出さない＝SSRとハイドレーション一致。
- 未挑戦: 「まだ挑戦していないよ」。挑戦あり: 制覇バッジ（制覇時 ✅）＋「正答率 X%・N問」＋細いバー（制覇=青／未制覇=テラコッタ）＋補足文。
- QuizPractice / MathPractice の単元カードに差し込む。

## 5. 更新タイミング
- マウント時にローカル読込＋（ログイン時）サーバー取得。
- 回答（正解／不正解／わからない）ごとに **local と server の両方を楽観更新**（表示はサーバー優先のため両方更新しないと即反映されない）。単元選択に戻ると最新が見える。

## 6. 品質・非スコープ
- **AI不使用**。tsc/build/Vitest 緑。純ロジックはユニットテスト。localStorage 保存もテスト（MemStorage）。
- 非スコープ（将来）: 語単位の習得数、推移スパークラインの単元カード表示、サーバー集計の完全同期（現状は best-effort 上書き）。
