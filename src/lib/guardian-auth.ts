import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { getConfigValue } from "@/lib/db/config";

/**
 * 見守りダッシュボードのアクセスゲート（ページ／API 共通）。
 *
 * 方針（シンプル・アプリ内完結）:
 *  - 保護者パスコードが **未設定** なら、誰でも開ける（＝ロックなし）。
 *  - アプリ内でパスコードを **設定** すると、以降は入力を要求する。
 *  - パスコードは DB に scrypt ハッシュで保存（平文は保存しない）。
 *  - 環境変数には依存しない（Vercel をいじらずに ON/OFF できる）。
 *
 * パスコード未設定のあいだは会話ログが誰でも見られる点に注意
 * （UI 側で「設定してください」と案内する）。
 */

export const GUARDIAN_COOKIE = "guardian_code";

/** DB 設定のキー（保護者パスコードのハッシュ）。 */
export const GUARDIAN_PASSCODE_KEY = "guardian_passcode";

export type GuardianAccess =
  | { allowed: true; code: string | null; reason: "open" | "passcode-ok" }
  | {
      allowed: false;
      reason: "need-passcode" | "wrong-passcode";
    };

/** パスコードを salt 付き scrypt でハッシュ化する（保存用文字列）。 */
export function hashPasscode(code: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(code, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** 生パスコードを保存ハッシュと照合する（定数時間比較）。 */
export function verifyPasscode(code: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(code, salt, expected.length);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

/** パスコードの設定状態（UI の出し分け用）。 */
export async function getPasscodeState(): Promise<{ configured: boolean }> {
  const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);
  return { configured: Boolean(stored) };
}

/** 生パスコードが正しいか（保存ハッシュと照合）。未設定時は false。 */
export async function checkPasscode(code: string): Promise<boolean> {
  const raw = code.trim();
  if (!raw) return false;
  const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);
  return stored ? verifyPasscode(raw, stored) : false;
}

/**
 * アクセス可否を解決する（ページ／API 共通のゲート）。
 * パスコード未設定なら誰でも許可。設定済みなら provided/cookie の一致を要求。
 */
export async function resolveGuardianAccess(input: {
  providedCode?: string | null;
  cookieCode?: string | null;
}): Promise<GuardianAccess> {
  const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);

  // 未設定 → ロックなし（誰でも開ける）。
  if (!stored) {
    return { allowed: true, code: null, reason: "open" };
  }

  const provided = (input.providedCode ?? "").trim();
  const cookie = (input.cookieCode ?? "").trim();

  if (provided && verifyPasscode(provided, stored))
    return { allowed: true, code: provided, reason: "passcode-ok" };
  if (cookie && verifyPasscode(cookie, stored))
    return { allowed: true, code: cookie, reason: "passcode-ok" };

  return {
    allowed: false,
    reason: provided ? "wrong-passcode" : "need-passcode",
  };
}
