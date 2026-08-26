import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 一時的な診断エンドポイント（値は絶対に出さない）。
 * ランタイムが OPENAI_API_KEY を見えているか／名前の綴り違いが無いかを確認するためだけのもの。
 * 確認が済んだら削除する。
 */
export async function GET() {
  const key = process.env.OPENAI_API_KEY;
  // 名前に OPENAI / OPENAPI を含む env の「名前だけ」（値は出さない）
  const openaiLikeNames = Object.keys(process.env).filter((n) =>
    /OPENAI|OPENAPI/i.test(n),
  );
  return NextResponse.json({
    openai_present: Boolean(key && key.trim()),
    openai_len: key ? key.trim().length : 0,
    openai_like_env_names: openaiLikeNames, // 例: 綴り違いを検出
    vercel: Boolean(process.env.VERCEL),
    vercel_env: process.env.VERCEL_ENV ?? null, // production / preview / development
    node_env: process.env.NODE_ENV ?? null,
  });
}
