import "server-only";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { getConfigValue } from "@/lib/db/config";

/**
 * 見守りダッシュボードのアクセスゲート（ページ／API 共通）。
 *
 * パスコードの決まり方（優先順）:
 *  1. 環境変数 GUARDIAN_PASSCODE があればそれを使う（従来どおり・env 管理）。
 *  2. 無ければ、DB に保存された保護者パスコード（ハッシュ）と照合する。
 *     → アプリ内（見守りページ）から設定・変更できる。
 *  3. どちらも未設定:
 *     - 本番(Vercel)では「未設定」を返し、まずパスコード設定を促す（データは見せない）。
 *     - ローカル開発では中身確認のため閲覧を許可する。
 *
 * Cookie / クエリ / ヘッダで渡された「生パスコード」を、env 値 or 保存ハッシュと照合する。
 */

export const GUARDIAN_COOKIE = "guardian_code";

/** DB 設定のキー（保護者パスコードのハッシュ）。 */
export const GUARDIAN_PASSCODE_KEY = "guardian_passcode";

export type GuardianAccess =
  | { allowed: true; code: string | null; reason: "passcode-ok" | "open-dev" }
  | {
      allowed: false;
      reason: "need-passcode" | "wrong-passcode" | "unconfigured";
      configured: boolean;
      managedByEnv: boolean;
    };

/** 長さが一致する場合は定数時間寄りで比較（タイミング差を抑える）。 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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

/** env のパスコード（trim 済み。未設定なら undefined）。 */
function envPasscode(): string | undefined {
  const v = process.env.GUARDIAN_PASSCODE?.trim();
  return v ? v : undefined;
}

/** パスコードの設定状態（設定UIの出し分け用）。 */
export async function getPasscodeState(): Promise<{
  configured: boolean;
  managedByEnv: boolean;
}> {
  if (envPasscode()) return { configured: true, managedByEnv: true };
  const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);
  return { configured: Boolean(stored), managedByEnv: false };
}

/** 生パスコードが正しいかを、env or 保存ハッシュで判定する。 */
export async function checkPasscode(code: string): Promise<boolean> {
  const raw = code.trim();
  if (!raw) return false;
  const env = envPasscode();
  if (env) return safeEqual(raw, env);
  const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);
  return stored ? verifyPasscode(raw, stored) : false;
}

/**
 * アクセス可否を解決する（ページ／API 共通のゲート）。
 * providedCode（?code= or ヘッダ）と cookieCode のどちらかが通れば許可。
 */
export async function resolveGuardianAccess(input: {
  providedCode?: string | null;
  cookieCode?: string | null;
}): Promise<GuardianAccess> {
  const provided = (input.providedCode ?? "").trim();
  const cookie = (input.cookieCode ?? "").trim();
  const env = envPasscode();

  if (env) {
    if (provided && safeEqual(provided, env))
      return { allowed: true, code: provided, reason: "passcode-ok" };
    if (cookie && safeEqual(cookie, env))
      return { allowed: true, code: cookie, reason: "passcode-ok" };
    return {
      allowed: false,
      reason: provided ? "wrong-passcode" : "need-passcode",
      configured: true,
      managedByEnv: true,
    };
  }

  // env 未設定 → DB 保存のパスコード
  const stored = await getConfigValue(GUARDIAN_PASSCODE_KEY);
  if (stored) {
    if (provided && verifyPasscode(provided, stored))
      return { allowed: true, code: provided, reason: "passcode-ok" };
    if (cookie && verifyPasscode(cookie, stored))
      return { allowed: true, code: cookie, reason: "passcode-ok" };
    return {
      allowed: false,
      reason: provided ? "wrong-passcode" : "need-passcode",
      configured: true,
      managedByEnv: false,
    };
  }

  // どこにも未設定。ローカル開発は閲覧許可、本番は設定を促す。
  const isProd = Boolean(process.env.VERCEL);
  if (!isProd) {
    return { allowed: true, code: null, reason: "open-dev" };
  }
  return {
    allowed: false,
    reason: "unconfigured",
    configured: false,
    managedByEnv: false,
  };
}
