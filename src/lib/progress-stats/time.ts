// src/lib/progress-stats/time.ts
/**
 * JST（UTC+9）で日付を判定する純ヘルパー。
 * 入力は「UTC エポックミリ秒」に正規化済みの number（Store 側で変換）。
 * これにより SQLite / Postgres の日時文字列フォーマット差を純関数に持ち込まない。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** UTC エポックms → "YYYY-MM-DD"（JST の暦日）。 */
export function toJstDateKey(ms: number): string {
  return keyFromUtcMs(ms + JST_OFFSET_MS);
}

/** UTC エポックms → "YYYY-MM"（JST の暦月）。 */
export function jstMonthKey(ms: number): string {
  return toJstDateKey(ms).slice(0, 7);
}

/** 日付キー "YYYY-MM-DD" に delta 日を足した日付キー。 */
export function addDaysKey(key: string, delta: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return keyFromUtcMs(Date.UTC(y, m - 1, d) + delta * 86_400_000);
}

/**
 * 日付キーが「妥当な過去日（today 以前）」かを判定する。
 * - 形式 "YYYY-MM-DD"、実在日（2月30日等は不可）、かつ todayKey 以前（未来は不可）。
 * - 文字列比較で日付順が保てる形式なので `key <= todayKey` で未来判定できる。
 */
export function isValidPastDateKey(key: string, todayKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return false;
  }
  return key <= todayKey;
}

/** UTC の暦日で "YYYY-MM-DD" を作る（JST シフトはしない内部関数）。 */
function keyFromUtcMs(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
