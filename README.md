# AI先生 — Phase 1 + Vercel 対応

> 小1〜高3を対象に、**答えを直接教えず、問い返しで子ども自身に考えさせる**（ソクラテス型）
> 安全な生成AI探究チューター。
> 全対話が**安全パイプライン**（入力モデレーション→対話生成→出力モデレーション→ログ）を必ず通り、
> 学年ごとの違いは `GradeProfile` として**データで注入**（学年プロファイル）します。

設計の全体像は [`全体像.md`](./全体像.md) を参照。

---

## プロダクト概要

- **ソクラテス型**：答えを直答せず、子どもの発話に問い返して自分で考えさせる対話エンジン。
- **安全パイプライン**：すべての対話が「入力モデレーション → 対話生成 → 出力モデレーション → ログ保存」を通過。
  各段は独立関数で差し替え可能（`src/lib/safety/`, `src/app/api/chat/route.ts`）。
- **学年プロファイル**：対話エンジンは学年非依存。学年ごとの違いは `GradeProfile`
  （`src/lib/grade/gradeProfiles.ts`）としてデータ注入。学年追加は「プロファイルを足す」だけ。

---

## 使用スタック

- **Next.js 15（App Router）+ TypeScript + Tailwind CSS**
- **LLM：OpenAI**（Anthropic から移行済み）
  - 対話生成モデル … `OPENAI_MODEL`（既定 `gpt-4o`）
  - モデレーションモデル … `OPENAI_MODERATION_MODEL`（既定 `gpt-4o-mini`）
- **DB**：`DATABASE_URL` があれば **Postgres**（Supabase/Neon 等）、
  無ければ **ローカル SQLite** にフォールバック。
  Vercel 等のサーバーレスで `DATABASE_URL` 未設定の場合は **noop（ログ無し）** で動作。

---

## ローカル起動手順

前提：Node.js 20+（開発は v22 で確認）、npm。

```bash
cp .env.example .env.local     # 環境変数ファイルを用意
# .env.local を開いて OPENAI_API_KEY を設定
npm install
npm run dev
# http://localhost:3000 を開く
```

`OPENAI_API_KEY` が未設定でもクラッシュせず、決まった問い返しで動く**「練習モード」**で起動し、
画面にその旨を表示します。`npm run build` / `npm run start` で本番ビルドも動きます。

---

## Vercel デプロイ手順

1. GitHub にリポジトリを push し、Vercel で **Import Project**（GitHub 連携）。
2. **Framework Preset は自動で Next.js**（`vercel.json` で `"framework": "nextjs"` に固定済み）。
3. **Environment Variables** を設定：
   - `OPENAI_API_KEY`（**必須**）… OpenAI の APIキー。
   - `DATABASE_URL`（任意）… 永続ログを残す場合に Postgres 接続URL（Supabase/Neon 等）。
     未設定なら Vercel 上はログ無し（noop）で動作。
   - 必要に応じて `OPENAI_MODEL` / `OPENAI_MODERATION_MODEL`（既定値あり）。
4. **Deploy**。

> 直下の静的HTMLは `public/` へ移動済みなので、フレームワーク自動検出が Next.js に確定します。

---

## 静的ページ（`public/` 配信）

デプロイ後、以下でアクセスできます。

| パス | 内容 |
|---|---|
| `/lp.html` | ランディングページ（LP） |
| `/report.html` | 競合調査レポート |
| `/blueprint.html` | 設計思想と特長の図解 |

---

## 安全パイプライン（全対話が必ず通る）

```
子どもの発話
   ↓
[入力モデレーション]  危険/不適切/個人情報を判定。NGなら対話に進まず定型文で切り返す
   ↓
[対話生成]           ソクラテス型システムプロンプト（答えを直答しない）で応答
   ↓
[出力モデレーション]  「答えを直答していないか/不適切か」を判定。直答なら問い返しに変換
   ↓
[ログ保存]           DB … Postgres / ローカルSQLite / なければ noop
   ↓
子どもへ返答
```

---

## 今回作った範囲（Phase 1 + Vercel 対応）

- Next.js 15 + TypeScript + Tailwind の骨格、OpenAI への移行。
- 安全パイプライン（入力モデ→対話→出力モデ→ログ）の実装。
- `GradeProfile` の型・データ（学年プロファイルによるデータ注入。エンジンは学年非依存）。
- 会話ログの永続化（Postgres / SQLite フォールバック / noop）。
- APIキー未設定でもクラッシュしない「練習モード」。
- 静的ページ（LP / 競合調査 / 設計思想）を `public/` から配信。
- Vercel デプロイ対応（`vercel.json` でプリセット固定、`.vercelignore`、`.env.example`）。

## 今回作っていない範囲（Phase 3 以降）

- 保護者ダッシュボード（会話ログ・つまずきの可視化）。
- 認証・保護者アカウント。
- 音声（音声入出力）。
