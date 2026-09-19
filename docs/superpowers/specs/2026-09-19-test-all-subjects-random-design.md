# テスト全教科対応＋全単元ランダム（Phase B）設計書

- 日付: 2026-09-19
- 対象: AI先生（`Y:\AI先生`）／ブランチ `feature/test-all-subjects`
- 位置づけ: 大目標の **Phase B**。Phase A（中2網羅）は main にマージ済み。次は **Phase C（中1網羅）**。

## 1. 目的

1. **テストモードを全教科対応**にする（現状は算数のみ）。理科・歴史・地理・国語・英語は選択式でテストできるようにする。
2. **「全単元からランダム」出題**を、練習・テストの両方に足す（範囲＝その教科・その学年の全単元）。

## 2. 前提（既存の採点契約・踏襲）

- **算数**: `generateProblem`/`gradeAnswer`/`diagnose`＋`encodeToken`/`decodeToken`（`AnswerTokenPayload{unitId,answer,prompt,meta}`）。テキスト入力・数値採点。
- **クイズ（理社国英）**: `pickQuestion(unitId)→{itemId,question,choices}`／`gradeQuiz(unitId,itemId,choiceIndex)→{correct,answerIndex,explanation,hint}`＋`encodeQuizToken`/`decodeQuizToken`（`QuizTokenPayload{unitId,itemId,answerIndex}`）。選択式・index採点。答えは常にトークンに封入（非露出・改ざん不可）。
- 既存の `/api/test/{start,grade}`・`/app/test/TestRunner.tsx`・`src/lib/test/session.ts`（`buildTestKey`/`distributeCount`）・`test_results`/`attempts` は Phase A（T1）で構築済み＝算数専用。これを**教科非依存に一般化**する。
- 教科メタ: `quiz/index.ts` の `SUBJECTS`/`subjectUnits`/`unitsFor`/`subjectGrades`、`math` は `UNITS`/`unitsForGrade`。

## 3. B-1: テストの全教科対応

### 3.1 出題形式の切替（kind）
- `kind: "math"` … テキスト入力・数値採点（既存）。
- `kind: "quiz"` … 選択肢ボタン・index採点（新規）。
- subject → kind: `math`→math、それ以外（science/history/geography/japanese/english）→quiz。

### 3.2 API `/api/test/start`（subject 分岐に一般化）
- リクエスト: `{ subject, unitIds?: string[], grade?, random?: boolean, count }`。
- 検証: subject は許可6種、count ∈ {5,10,20}。random でなければ unitIds 必須・各単元が当該 subject に実在。
- 出題スロットは `distributeCount(unitIds, count)`（random は §4）。各スロットで:
  - math: `generateProblem`→`encodeToken`。item = `{index, unitId, prompt, answerType, answerToken}`。
  - quiz: `pickQuestion(unitId)`→`encodeQuizToken({unitId,itemId,answerIndex})`。item = `{index, unitId, itemId, question, choices, token}`。**同一テスト内で同一 item の重複を避ける**（単元内の出題可能数を超える要求は可能な範囲で重複回避）。
- レスポンス: `{ testKey, total, kind, items }`。

### 3.3 API `/api/test/grade`（subject 分岐）
- リクエスト: `{ subject, unitIds?|random+grade, childId?, answers }`。
  - math answers: `{ unitId, answerToken, userInput, prompt }`（既存）。
  - quiz answers: `{ unitId, itemId, token, choiceIndex }`。
- 採点:
  - math: 既存（decodeToken→gradeAnswer→diagnose）。
  - quiz: `decodeQuizToken(token)`→`gradeQuiz(unitId,itemId,choiceIndex)`。トークン不正/不一致は当該 item を不正解扱い（スコアを偽れない）。
- スコア・`test_results` 保存・`attempts(source="test")`・前回/自己ベスト算出は既存ロジックを流用（教科非依存）。データ整合性検証（answers 件数 ∈ {5,10,20}、単元が subject/pool 内）は既存の考え方を踏襲。
- レスポンス items:
  - math: `{ unitId, prompt, userInput, correct, expected, diagnosis }`（既存）。
  - quiz: `{ unitId, question, choiceIndex, correct, answerIndex, explanation }`（正解肢テキストはクライアントが choices から表示）。

### 3.4 UI `/test?subject=<s>`（教科パラメータ化）
- 教科セレクタ（算数/理科/歴史/地理/国語/英語）＋学年タブ（subject 実在学年）＋単元マルチ選択＋問題数。
- TestRunner を kind で分岐: math=入力欄（既存）、quiz=選択肢ボタン（1問1択、途中フィードバックなし）。
- 結果画面: 共通の「点数・前回差・自己ベスト」＋まちがい一覧（math=正解値＋診断／quiz=正解肢＋解説）。
- 導線: `/math`（→`/test?subject=math`、既存リンク流用）と各 `/learn/[subject]` に「テストにちょうせん」→`/test?subject=<s>`。`/test` 上でも教科切替可。

## 4. B-2: 全単元からランダム

- 範囲＝**その教科・その学年の全単元プール**。
- **テスト**: setup に「🎲 全単元からランダム」ボタン。start を `random:true, subject, grade, count` で呼ぶ。各スロットで**プールから無作為に単元を選び**、その単元から1問。
  - `test_key = ${subject}|${grade}|__ALL__`（`buildRandomTestKey(subject, grade)`）。学年別に独立した推移として記録。保存 `unit_ids = "__ALL__"`。
  - grade 側は `random+subject+grade` から同じ testKey を再計算（answers の単元がプール内であることは検証するが、testKey はプールキー固定）。
- **練習**: `MathPractice`／`QuizPractice` に「ランダム（全単元）」開始を追加。固定単元の代わりに**毎問ランダムな単元**を選んで出題（`recordAttempt` は実際に出た unitId で記録）。既存の per-unit フローは不変。

## 5. ファイル構成（変更/新規）

- `src/lib/test/session.ts`: `buildRandomTestKey(subject,grade)` 追加。`distributeCount` は流用。プール抽選ヘルパー `pickRandomSlots(pool, count)` 追加（各スロットにランダム unitId）。
- `src/app/api/test/start/route.ts` / `grade/route.ts`: subject 分岐・quiz 経路・random 対応に一般化（大きくなるなら subject アダプタを小関数に分離）。
- `src/app/test/page.tsx`: subject を searchParams から受け、全教科の単元メタを渡す。
- `src/app/test/TestRunner.tsx`: 教科セレクタ・kind 分岐（入力/選択）・全単元ランダムボタン。肥大化する場合は `MathItem`/`QuizItem` の入力UIを小コンポーネントに分離。
- `src/app/math/MathPractice.tsx` / `src/app/quiz/QuizPractice.tsx`: 「ランダム（全単元）」開始を追加。
- 導線: `src/app/learn/[subject]/page.tsx`（または `QuizPractice`）に「テストにちょうせん」リンク。

## 6. 品質・非スコープ

- **AI不使用**・答え非露出・改ざん耐性（既存トークン方式）を厳守。
- ルート単体テスト（quiz 経路: 改ざんトークン→不正解、childなし→非保存、件数不正→400、random の testKey 固定）を追加。既存 Vitest・content-audit・build・tsc 緑を維持。
- 非スコープ: せいせきページ（点数折れ線＋単元別マップ）／まちがいノート／弱点リターンマッチ・間隔反復・ストリーク（別途）／教科をまたいだミックス出題。

## 7. 段階（実装単位）

- **B1a**: session.ts 拡張（buildRandomTestKey / pickRandomSlots）＋テスト。
- **B1b**: start/grade API を subject 分岐・quiz 経路対応（＋quiz ルートテスト）。
- **B1c**: TestRunner・/test を教科パラメータ化（kind 分岐UI）＋導線。
- **B2**: 全単元ランダム（テストのボタン＋ start/grade の random 経路＋練習モードのランダム開始）。
