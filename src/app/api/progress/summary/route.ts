import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild } from "@/lib/auth/accounts";
import { getChildProgress } from "@/lib/db/read";

export const runtime = "nodejs";

/**
 * ホーム用の教科別集計（attempts/correct＋合計）をサーバーから返す。
 * ログイン中はホーム画面がこれを読むことで、別端末でも進捗が同期する。
 * 認可: session 必須 → childId 必須 → 自分の子のみ（ownsChild=403）。
 */
export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const childId = req.nextUrl.searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "childId required" }, { status: 400 });
  }
  if (!(await ownsChild(accountId, childId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json(await getChildProgress(childId));
}
