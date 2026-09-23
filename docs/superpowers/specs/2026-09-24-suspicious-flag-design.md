# 「怪しい」ボタン（正解でも復習に回す）設計書

- 日付: 2026-09-24
- 対象: AI先生（`Y:\AI先生`）
- 概要: 4択クイズの採点後、**正解のとき**に「怪しい」ボタンを出す。選択肢の消去法で当たった/自信がない問題を、正解でも**まちがいノート**に入れて後で解き直せるようにする。**AIは使わない**。

## 1. 目的・方針
- 4択は消去法で当てられることが多く、正解＝理解とは限らない。「怪しい」で偽の自信を拾い、復習に回す。
- 既存の「わからない」（回答前）を補完（回答後・正解時の自己申告）。
- 既存のまちがいノート基盤（`mistakes`・重複防止・`/review`）を流用。新テーブル不要。

## 2. 振る舞い
- クイズ採点後、`result.correct === true` のときだけ「怪しい」ボタンを表示（不正解は採点時に既にノート追加済みなので出さない）。
- 押すと、その問題をまちがいノートに追加。押下後は「✓ 怪しいに入れた」に変わり無効化（問題ごとに1回）。次の問題に進むとリセット。
- 消える条件は既存どおり（解き直しで自力正解／「もう覚えた」）。答えには一切触れない。

## 3. API（新規 `/api/review/flag`）
- `POST { token, childId }` → `decodeQuizToken(token)` で `{unitId, itemId}` を取り出し、`addMistakeNow({childId, subject, unitId, kind:"quiz", itemId, problem:null})`。
- `subject` は `getQuizUnit(unitId)?.subject ?? "quiz"`。
- 重複はStore側で防止（同一 child/unit/item は二重追加なし）。
- 認可は review 系と同じく **childId ベース**（未ログインでも動く）。`token`/`childId` 欠如・不正トークンは 400。**answerIndex 等は受け取らない・返さない**。
- `addMistakeNow`（`src/lib/db/log.ts` に追加、`removeMistakeNow` と対）: 即 await でStoreにaddMistake（ユーザー操作なので確実に保存）。

## 4. クライアント（`QuizPractice`）
- state `flagged`（問題ごと・`fetchQuestion` でリセット）。
- ハンドラ `flagSuspicious`: `question.token` と `getChildId()` を `/api/review/flag` に送信。楽観的に `flagged=true`、失敗時は戻す。
- 採点後の操作列（正解時）に「怪しい」ボタンを追加（terra 系の控えめ配色）。

## 5. 品質・非スコープ
- **AI不使用**。tsc/build/Vitest 緑。テスト: flag ルート（正常＝ノート追加／二重押しは重複なし／token・childId欠如400／不正トークン400・増えない）。既存採点・答え非露出は不変。
- 非スコープ（将来）: 算数/テストの「怪しい」、制覇（マスター）判定からの除外、怪しい回数の可視化。

## 6. 検証観点
- 正解後に「怪しい」を押すと `/review` に1件増える。二重押しで増えない。次の問題でボタンが戻る。
- 不正解時は「怪しい」を出さない（既に追加済み）。未ログインの子でも動く。答えは出さない。
