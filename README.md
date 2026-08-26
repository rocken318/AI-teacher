# AI先生 — Phase 0（環境ブートストラップ / walking skeleton）

> 小1〜高3を対象に、**答えを直接教えず、問い返しで子ども自身に考えさせる**（ソクラテス型）
> 安全な生成AI探究チューター。
> このリポジトリは **Phase 0**：最適スタックで骨格を立ち上げ、**1本だけ**の探究対話を
> 安全パイプライン込みで端から端まで通す（walking skeleton）。全機能は作っていません。

設計の全体像は [`全体像.md`](./全体像.md)、Phase 0 の指示書は
[`一発目のプロンプト.md`](./一発目のプロンプト.md) を参照。

---

## セットアップ

前提：Node.js 20+（開発は v22 で確認）、npm。

```bash
npm install
cp .env.local.example .env.local   # 環境変数ファイルを用意
# .env.local を開いて ANTHROPIC_API_KEY を設定（未設定でも起動します）
```

## 起動

```bash
npm run dev
# http://localhost:3000 を開く
```

`npm run build` / `npm run start` で本番ビルドも動きます。

## 環境変数

| 変数 | 必須 | 説明 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 任意 | Anthropic APIキー。**サーバー側だけで使用し、クライアントには露出しません。** 未設定でもクラッシュせず「練習モード」（決まった問い返し）で動作し、画面にその旨を表示します。 |
| `SQLITE_PATH` | 任意 | SQLite の保存先（省略時 `./data/ai-sensei.db`）。 |
| `DATABASE_URL` | 任意 | Phase 1 以降で Supabase/Postgres に移行する際に使用（今回は未使用）。 |

---

## 使用スタック

- **TypeScript + Next.js 15（App Router）**
- **LLM：Claude**（Anthropic SDK）
  - `claude-haiku-4-5` … 入力/出力モデレーション（安く速く）
  - `claude-sonnet-4-6` … ソクラテス型の対話生成（主力）
- **DB：Drizzle ORM**。本命は Supabase(PostgreSQL) だが、**接続情報が無くても動くよう
  ローカル SQLite にフォールバック**（会話ログが残ることが目的）。
- **Tailwind CSS**

## 安全パイプライン（全対話が必ず通る）

各段は **独立した関数**として実装しており、後から差し替え可能です
（`src/lib/safety/` と `src/app/api/chat/route.ts`）。

```
子どもの発話
   ↓
[入力モデレーション]  haiku … 危険/不適切/個人情報を {ok, reason} で判定。NGなら対話に進まず定型文で切り返す
   ↓
[対話生成]           sonnet … ソクラテス型システムプロンプト（答えを直答しない）で応答
   ↓
[出力モデレーション]  haiku … 「答えを直答していないか/不適切か」を判定。直答なら問い返しに変換
   ↓
[ログ保存]           DB … セッション・各メッセージ・各モデレーション結果を保存
   ↓
子どもへ返答
```

## 学年パラメータ化

対話エンジンは学年に依存しません。学年ごとの違いは `GradeProfile`
（`src/lib/grade/gradeProfiles.ts`）として**データで注入**します。
Phase 0 は「**小1-3**」固定。新しい学年の追加は「プロファイルを足す」だけで拡張できます。

---

## フォルダ構成

```
src/
  app/
    layout.tsx / globals.css
    page.tsx                       … 「なぜ空は青いの？」1テーマのチャット画面
    api/chat/route.ts              … 安全パイプラインのオーケストレーション
  components/Chat.tsx              … チャットUI（クライアント）
  lib/
    anthropic.ts                   … SDKクライアント + モデルID + キー未設定検知
    prompts.ts                     … ソクラテス型システムプロンプト等
    grade/gradeProfiles.ts         … GradeProfile 型 + 学年データ（小1-3固定）
    safety/moderateInput.ts        … [入力モデレーション]
    safety/generate.ts             … [対話生成]
    safety/moderateOutput.ts       … [出力モデレーション]
    db/schema.ts / index.ts / log.ts … sessions / messages / moderations と保存ヘルパー
data/                              … SQLite の実ファイル（gitignore 済み）
```

---

## 今回作った範囲（Phase 0）

- Next.js + TypeScript + Tailwind + Drizzle の骨格
- 安全パイプライン（入力モデ→対話→出力モデ→ログ）の**最小実装**を1本通した
- 1テーマ「なぜ空は青いの？」のチャットUI（画面下に Phase 0 walking skeleton と明記）
- `GradeProfile` の型・データ（小1-3固定で対話に注入。エンジンは学年非依存）
- 会話ログの永続化（SQLite フォールバック）
- APIキー未設定でもクラッシュしない「練習モード」

## 今回作っていない範囲（Phase 1 以降）

- 学年フル展開（小1〜高3）、複数テーマ、対話エンジンの本作り込み → Phase 1/2/4
- Supabase(PostgreSQL) + RLS 接続、認証、保護者アカウント → Phase 3
- 保護者ダッシュボード（会話ログ・つまずきの可視化） → Phase 3
- 音声、UIの年齢適応、コスト最適化（opus 出し分け）、エスカレーション導線 → Phase 5

---

## Phase 1 への申し送り

1. **対話エンジンの本作り込み**：`src/lib/safety/generate.ts` と `src/lib/prompts.ts` を中心に、
   足場（strictness）の出し分け・複数ターンの探究誘導・テーマ複数化を実装する。
2. **学年展開**：`GRADE_PROFILES` に他学年を実データで足し、`route.ts` の
   `DEFAULT_GRADE_PROFILE` 固定を、セッション作成時に学年を選ぶ形へ拡張する。
3. **DB を Supabase(Postgres) へ**：`src/lib/db/index.ts` を pg-core 実装へ差し替え、
   `全体像.md` 5章の User/Guardianship/Insight を追加。RLS で本人＋保護者に限定。
4. **出力モデレーションの強化**：ハルシネーション兆候の検知、直答変換の品質評価。
