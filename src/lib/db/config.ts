import "server-only";
import { getStore } from "./index";

/**
 * 設定（key/value）の読み書きヘルパー。
 * 見守りパスコードのハッシュ保存など、少量の永続設定に使う。
 *
 * 読み取りは失敗しても null を返す（ベストエフォート）。
 * 書き込みは呼び出し側で結果を扱いたいので、例外はそのまま投げる
 * （保存先が無い NoopStore は "no-store" を投げる）。
 */

/** 設定値を読む。無ければ／失敗時は null。 */
export async function getConfigValue(key: string): Promise<string | null> {
  try {
    return await getStore().getConfig(key);
  } catch (err) {
    console.error("[db:config] getConfigValue failed:", err);
    return null;
  }
}

/** 設定値を書く（保存先が無ければ例外）。 */
export async function setConfigValue(key: string, value: string): Promise<void> {
  await getStore().setConfig(key, value);
}
