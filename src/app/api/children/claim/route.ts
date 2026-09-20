import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, ownsChild, getChild } from "@/lib/auth/accounts";
import { reassignChildData } from "@/lib/db/log";

export const runtime = "nodejs";

/**
 * POST { fromChildId, toChildId } → 匿名端末の記録(from)を自分の子(to)へ引き継ぐ。
 * session＋所有チェック必須。
 */
export async function POST(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { fromChildId?: string; toChildId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const fromChildId = (body.fromChildId ?? "").trim();
  const toChildId = (body.toChildId ?? "").trim();
  if (!fromChildId || !toChildId) {
    return NextResponse.json({ error: "fromChildId and toChildId required" }, { status: 400 });
  }
  // to は必ず自分の子プロフィール。
  if (!(await ownsChild(accountId, toChildId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // from が他アカウントの子プロフィールなら奪取を防ぐ（匿名UUIDは children に無いのでOK）。
  if (fromChildId !== toChildId) {
    const fromChild = await getChild(fromChildId);
    if (fromChild && fromChild.accountId !== accountId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }
  await reassignChildData(fromChildId, toChildId);
  return NextResponse.json({ ok: true });
}
