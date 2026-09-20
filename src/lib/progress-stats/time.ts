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

/** UTC の暦日で "YYYY-MM-DD" を作る（JST シフトはしない内部関数）。 */
function keyFromUtcMs(ms: number): string {
  const dt = new Date(ms);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
