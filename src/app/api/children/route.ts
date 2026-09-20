import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, listChildren, addChild } from "@/lib/auth/accounts";

export const runtime = "nodejs";

const STAGES = ["elementary", "junior", "senior"];

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const children = await listChildren(accountId);
  return NextResponse.json({ children });
}

export async function POST(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { name?: string; stage?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const name = (body.name ?? "").trim();
  const stage = (body.stage ?? "").trim();
  if (!name || name.length > 20) return NextResponse.json({ error: "なまえは1〜20文字で。" }, { status: 400 });
  if (!STAGES.includes(stage)) return NextResponse.json({ error: "学齢が不正です。" }, { status: 400 });
  const id = await addChild(accountId, name, stage);
  return NextResponse.json({ id });
}
