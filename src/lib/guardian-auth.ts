import "server-only";
import { getDbBackend } from "@/lib/db/read";

/**
 * 見守りダッシュボードのアクセスゲート（ページ／API 共通）。
 *
 * 方針:
 *  - GUARDIAN_PASSCODE が設定されていれば、一致（クエリ/ヘッダ or Cookie）を要求。
 *  - 未設定のとき、本番(Vercel)でデータが存在しうる(backend!="none")なら**フェイルクローズ**
 *    （子どもの会話ログを未保護で公開しない）。ローカル or データ無しは開発閲覧を許可。
 *
 * 本格的な認証・RLS は Supabase 接続後に置き換える（今回はプレビューの安全側デフォルト）。
 */

export const GUARDIAN_COOKIE = "guardian_code";

export type GuardianAccess =
  | { allowed: true; code: string | null; reason: "passcode-ok" | "open-dev" }
  | { allowed: false; reason: "need-passcode" | "wrong-passcode" | "locked-production" };

/** 長さが一致する場合は定数時間寄りで比較（タイミング差を抑える）。 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function evaluateGuardianAccess(input: {
  providedCode?: string | null;
  cookieCode?: string | null;
}): GuardianAccess {
  const passcode = process.env.GUARDIAN_PASSCODE?.trim();
  const provided = (input.providedCode ?? "").trim();
  const cookie = (input.cookieCode ?? "").trim();

  if (passcode) {
    if (
      (provided.length > 0 && safeEqual(provided, passcode)) ||
      (cookie.length > 0 && safeEqual(cookie, passcode))
    ) {
      return { allowed: true, code: passcode, reason: "passcode-ok" };
    }
    return { allowed: false, reason: provided.length > 0 ? "wrong-passcode" : "need-passcode" };
  }

  // パスコード未設定
  const isProd = Boolean(process.env.VERCEL);
  const backend = getDbBackend();
  if (isProd && backend !== "none") {
    // 本番でデータが存在しうるのに未保護 → 表示しない
    return { allowed: false, reason: "locked-production" };
  }
  // ローカル開発 or データ無し(none) は中身確認のため許可
  return { allowed: true, code: null, reason: "open-dev" };
}
