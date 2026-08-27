import { NextResponse } from "next/server";
import { getDbBackend } from "@/lib/db/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 一時的な確認エンドポイント（秘密は出さない）。
 * DBがどのバックエンドで動いているか（postgres / sqlite / none）だけを返す。
 * DATABASE_URL 接続確認のためだけのもの。確認後に削除する。
 */
export async function GET() {
  return NextResponse.json({ backend: getDbBackend() });
}
