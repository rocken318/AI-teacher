import { NextRequest, NextResponse } from "next/server";
import { currentAccountId, findAccountById } from "@/lib/auth/accounts";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const accountId = currentAccountId(req);
  if (!accountId) return NextResponse.json({ loggedIn: false, email: null });
  const account = await findAccountById(accountId);
  if (!account) return NextResponse.json({ loggedIn: false, email: null });
  return NextResponse.json({ loggedIn: true, email: account.email });
}
