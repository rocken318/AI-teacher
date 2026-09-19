# アカウント＋がんばり見える化 設計書

- 日付: 2026-09-20
- 対象: AI先生（`Y:\AI先生`）
- 概要: 家族アカウントでログインし、子ごとの「今日の頑張り」と「全体の進捗」を、別端末からでも見られるようにする。今のパスコード式見守り（/guardian）はアカウント制に置き換える。**AIは使わない。**

## 1. 目的

- **アカウントを作って管理**したい。**同じ（家族）アカウントでログイン**して、別端末からでも子の頑張りをチェックしたい。
- 見える化: ①**今日の頑張り**（日次）②**全体の進捗**（累積・円グラフ）③**教科の進捗ページ**（単元別の正答率と推移）。

## 2. アカウント方式（自前・軽量／Neon）

- **1つの家族アカウント**＝メール＋パスワード。パスワードは既存 `guardian-auth.ts` の scrypt 方式を一般化してハッシュ保存（平文保存しない）。
- **子プロフィール**を家族アカウントの下に複数作成できる（表示名・学齢）。子はメール不要。
- ログイン後、**その子として練習する**プロフィールを選ぶ（v1は PIN なしの選択。任意 PIN は将来）。学習記録はそのプロフィール id で保存。
- **セッション**: 署名付き httpOnly Cookie（HMAC-SHA256 で `{accountId, exp}` を署名。秘密鍵は環境変数 `AUTH_SECRET`、未設定時は開発用既定）。ステートレスで Vercel 対応。
- ログアウト時は従来どおり匿名 `childId`（localStorage UUID）で動作（後方互換）。
- **セキュリティ**: メール一意、パスワード最小長（8文字）、scrypt、Cookie は Secure/SameSite=Lax/httpOnly、ログインは基本的なレート配慮（同一IP連続失敗のスロットルは将来）。**登録・パスワード入力は利用者本人がブラウザで行う**（実装者/AIは代行しない）。

## 3. データモデル（Neon/Postgres＋SQLite＋Noop、既存 Store 抽象を拡張）

新規テーブル:
- `accounts`（id TEXT PK, email TEXT UNIQUE, password_hash TEXT, created_at）
- `children`（id TEXT PK, account_id TEXT, name TEXT, stage TEXT, created_at）※stage=elementary/junior/senior 等

既存テーブル（変更なし・継続利用）:
- `attempts`（child_id, subject, unit_id, correct, source, created_at）
- `test_results`（child_id, subject, unit_ids, test_key, total, score, taken_at）
- `child_id` には**子プロフィール id**（ログイン時）または匿名UUID（ログアウト時）が入る。既存データはそのまま。

**引き継ぎ（任意）**: プロフィール作成時、「この端末のこれまでの記録を引き継ぐ」で、現在の匿名 childId の attempts/test_results の child_id を新プロフィール id に付け替える（本人操作で明示的に）。

すべての集計指標（下記）は attempts / test_results から導出（新規の集計テーブルは作らない）。日付境界は **JST** で判定。

## 4. 見える化ロジック（定義）

- **制覇（mastered）**: ある単元で `累計正答率 ≥ 70%` かつ `累計 ≥ 5問`（1/1=100% の過大評価を防ぐ最低回数）。
- **全体の進捗%**: `制覇単元数 / 対象全単元数`。対象＝その子の**学齢に対応する全単元**（小/中/高で出題される単元集合。算数＋クイズ5教科）。
- **教科の進捗%**: `教科の制覇単元数 / 教科の対象単元数`。
- **のべ問題数**: その子の attempts 件数（練習＋テスト）。
- **レベル**: のべ問題数から算出（例 `Lv = floor(sqrt(total/10)) + 1`、次のLvまでの残りも表示）。単純・単調増加。
- **継続（数値）**: 
  - 連続日数＝直近から途切れずに「1問以上解いた日」が続く数、
  - 今月の学習日数＝今月で学習した日数、
  - のべ学習日数＝学習した日のユニーク数。attempts.created_at の JST 日付集合から算出。
- **今日**: JST 今日の attempts から 問題数／正答率／教科別内訳、test_results から テスト回数・点数。
- **単元別 正答率の推移**: 単元ごとに、直近の attempts を時系列で区切った正答率（例: 直近を数区間に分けた移動正答率）＋現在値と↑→↓。教科の進捗ページに表示。

## 5. 画面構成

- `/signup`（家族アカウント作成：メール＋パスワード）／`/login`／ログアウト。
- ログイン後の**ホーム**: 子プロフィール選択（＝その子で練習）／「がんばりを見る」導線／プロフィール追加。
- **今日の頑張り** ページ（layout A・独立して残す）: 上に一言ほめ→今日の問題数・正答率・連続→教科別バー→直近7日の棒。子とも一緒に見られるトーン。
- **全体の進捗** ページ: 
  1. 大きな**全体の進捗% ドーナツ**（例47%＝141/300単元制覇）
  2. その下に**5教科ドーナツ**（算/理/社/英/国。タップで各教科の進捗ページへ）
  3. **のべ問題数・レベル**
  4. **継続（数値）**: 連続日数／今月の学習日／のべ学習日
- **教科の進捗ページ** `/progress/[subject]`: 教科ドーナツ＋**単元別の正答率（推移スパークライン付き）**の一覧（制覇済みは色/印）。
- 上記の親向けダッシュボードは**ログイン必須**（自分の子だけ閲覧＝所有チェック）。旧 `/guardian`（パスコード式）は撤去し、これらに置換。

## 6. API（追加・変更）

- `POST /api/auth/signup` `{email,password}` → セッションCookie発行。
- `POST /api/auth/login` `{email,password}` → 照合しCookie発行（失敗は401、原因は曖昧に）。
- `POST /api/auth/logout` → Cookie失効。
- `GET /api/children` / `POST /api/children` `{name,stage}` / （任意）引き継ぎ。すべてセッション必須・自分の account のみ。
- `GET /api/progress/today?childId=` → 今日の集計（所有チェック）。
- `GET /api/progress/overall?childId=` → 全体%・教科別%・のべ・レベル・継続。
- `GET /api/progress/subject?childId=&subject=` → 教科の単元別 正答率・推移・制覇。
- 記録系（既存 `/api/math/grade`・`/api/quiz/grade`・`/api/test/grade`）: `childId` に**アクティブ子プロフィール id**を送る（ログイン時）。`progress.ts` の `getChildId()` を「ログイン中はアクティブプロフィール id、未ログインは匿名UUID」に拡張。

## 7. 段階（実装単位）

- **A1 認証コア**: `accounts`/`children` テーブル＋Store methods、`src/lib/auth/`（パスワードhash・セッションCookie署名/検証）、`/api/auth/{signup,login,logout}`、`/api/children`。TDD。
- **A2 アクティブプロフィール＋記録**: プロフィール選択UI、`getChildId()` 拡張、記録が選択プロフィールに入る。引き継ぎ（任意）。
- **A3 見える化**: 集計ロジック `src/lib/progress-stats/`（制覇/全体%/レベル/継続/今日/単元推移、純関数＋テスト）＋ `/api/progress/*`。
- **A4 画面**: 今日の頑張り／全体の進捗／教科の進捗ページ。旧 /guardian 撤去。

## 8. 品質・非スコープ

- **AI不使用**。既存 Vitest／content-audit／tsc／build 緑を維持。集計は純関数でテスト。
- 非スコープ（将来）: 子ごとのPIN、メール確認・パスワード再設定メール、レート制限の強化、複数保護者、通知、SNSログイン。

## 9. 検証観点

- 認証: signup→login→logout、誤パスワード401、セッションCookieの署名検証、他人の子にアクセスで403。
- 集計: 制覇しきい値（70%×5問）・全体%・連続日数（JST境界）・レベルを純関数テストで検証。
- 3系統DB（Postgres/SQLite/Noop）で壊れない。ログアウト時の匿名動作が従来どおり。
