# まちがいノート（間違えた問題をためて再挑戦）設計書

- 日付: 2026-09-21
- 対象: AI先生（`Y:\AI先生`）
- 概要: 子が **間違えた問題そのもの** をためて、まとめて解き直せる「まちがいノート」。自力で正解すれば消え、「もう覚えた」で手動削除も可。回答画面に「わからない」ボタンを置き、当てずっぽうの偶然正解でノートから消えるのを防ぐ。**AIは使わない**（出題・採点は既存エンジン、追加は authored データの参照）。

## 1. 目的・方針
- 「自分が間違えた問題だけ」を解き直せる復習体験。減っていく達成感でやる気を支える。
- 既存のクイズ／算数エンジンを**流用**（新規エンジンは作らない・YAGNI）。
- 子ごとに **サーバー保存**（`childId` 単位）＝ログイン中は**別端末でも同期**、未ログインは匿名IDに保存（既存の attempts と同じ思想）。

## 2. データモデル（Store 抽象を拡張）
新規テーブル `mistakes`:
- 共通列: `id TEXT PK, child_id TEXT, subject TEXT, unit_id TEXT, kind TEXT('quiz'|'math'), created_at`
- クイズ: `item_id TEXT`（固定問題を再出題）
- 算数: `problem TEXT`（JSON: `{prompt, answer, answerType, meta}` を保存し、同じ数値の問題を再構成）
- **重複防止**: 同一 `child_id` について、クイズは `(unit_id, item_id)`、算数は `(unit_id, problem のハッシュ)` が既にあれば追加しない。
- インデックス: `mistakes_child_idx (child_id)`。
- 3実装（Postgres/SQLite/Noop）に追加。Noop は空・no-op。

Store メソッド（案）:
- `addMistake(input)` … 重複チェックの上で挿入
- `listMistakes(childId, limit)` … 新しい順／教科フィルタ可
- `countMistakes(childId)` … カード表示用
- `removeMistake(childId, mistakeId)` … 「もう覚えた」／自力正解で削除
- `hasMistake(childId, kind, unitId, key)` … 重複判定

## 3. 記録（まちがいが入る条件）
通常の練習（`MathPractice`/`QuizPractice`）とテスト（`TestRunner`）の採点時:
- **不正解** → `addMistake`（そのときの itemId または生成問題を保存）
- **「わからない」ボタン押下** → 正解扱いにせず、正解＋解説を表示し `addMistake`（＝正直な自己申告を拾う／偶然正解を防ぐ）

既存の採点 API（`/api/math/grade`・`/api/quiz/grade`・`/api/test/grade`）に:
- リクエストに `unknown?: boolean`（「わからない」）を受ける。true のとき `correct=false` 相当で採点し、正解・解説は返す（token/authored から）。
- `childId` があれば `addMistake` を実行（既存の attempts 記録と同じ箇所で）。
- 算数の生成問題は `answerToken` の payload（prompt/answer/answerType/meta）からサーバーで再構成して保存（クライアント申告を信用しない）。

## 4. 消える条件（削除）
- **まちがいノートの解き直し**で、その問題に**自力で正解**（「わからない」はノーカウント）→ `removeMistake`。
- **「もう覚えた」ボタン** → `removeMistake`（手動）。

## 5. 画面・導線
- **ホーム**に「**まちがいノート（◯問）**」カード（`countMistakes`）。0問なら控えめ表示。
- 専用ページ `/review`（まちがいノート）:
  - 一覧（教科アイコン＋問題プレビュー、各問に「もう覚えた」）
  - 「**まとめてやり直す**」ボタン → まちがいを順に出題（クイズ=itemId再出題、算数=保存problem再構成）。回答画面に「わからない」も表示。自力正解で即ノートから消える（残数が減る）。
  - 教科での簡易フィルタ（任意）。
- 出題・採点は既存 API を流用。まちがいノート専用の再出題APIを1本足す（`/api/review/next`＝childIdの次のまちがいを返す・答え非露出）／採点は既存 grade を使い、正解時に `removeMistake`。

## 6. 「わからない」ボタン（回答UI）
- `MathAnswerInput`/`QuizChoiceInput`/TestRunner の回答UIに「わからない」を追加。
- 押下時: `grade` API に `unknown:true` を送る → 不正解相当＋正解/解説表示＋まちがい追加。連続で当てずっぽうしないための正直ボタン。

## 7. 進捗（v1）
- カードに「まちがい ◯問」と、任意で「今日消した数」。5教科の制覇ダッシュボードとは別枠（まちがいノートは"復習キュー"であって到達度ではない）。

## 8. 品質・非スコープ
- **AI不使用**。既存 Vitest／content-audit／tsc／build 緑を維持。Store 追加は 3系統で壊れない。純ロジック（重複判定・削除条件）はテスト。
- 非スコープ（将来）: 間隔反復（忘れる頃に再提示）、2回正解で消す設定、まちがい傾向の分析、実用英語トラック（別テーマ・別仕様）。

## 9. 検証観点
- 不正解／「わからない」で mistakes に入り、重複しない。自力正解／「もう覚えた」で消える。
- 算数は"その数値の問題"が再現される（保存 problem から）。クイズは同じ item が再出題。
- ログイン中は別端末で同じまちがいノートが見える（サーバー保存）。未ログインは匿名IDで動く。
- 3系統DB（Postgres/SQLite/Noop）で壊れない。採点の答え非露出・改ざん耐性は維持。
