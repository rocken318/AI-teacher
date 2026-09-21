import { NextResponse } from "next/server";

// 一時診断: DB のホスト名（＝provider/region 判定用）だけを返す。
// パスワードやユーザー名など認証情報は一切返さない（new URL().host は host:port のみ）。
// リージョン最適化の確認が済んだら削除する。
export const runtime = "nodejs";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ host: null, hasDb: false });
  try {
    const u = new URL(url);
    return NextResponse.json({ host: u.host, hasDb: true });
  } catch {
    return NextResponse.json({ host: "parse-error", hasDb: true });
  }
}
