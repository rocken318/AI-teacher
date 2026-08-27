import { NextResponse } from "next/server";
import { getDbBackend, listSessions } from "@/lib/db/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 一時的な確認エンドポイント（秘密は出さない）。
 * backend（postgres/sqlite/none）と、保存済みセッション件数だけを返す。
 * DATABASE_URL 接続と書き込みの確認のためだけのもの。確認後に削除する。
 */
export async function GET() {
  let sessionCount = -1;
  try {
    sessionCount = (await listSessions(100)).length;
  } catch {
    sessionCount = -1;
  }
  return NextResponse.json({ backend: getDbBackend(), sessionCount });
}
