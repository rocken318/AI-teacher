// src/lib/progress-stats/stats.ts
import type { AttemptRecord, UnitAgg, LevelInfo } from "./types";
import { toJstDateKey, addDaysKey } from "./time";

/** 制覇しきい値（設計書 §4）。 */
export const MASTERY_RATE = 0.7;
export const MASTERY_MIN_ATTEMPTS = 5;

/** attempts を単元ごとに集約。 */
export function aggregateByUnit(records: AttemptRecord[]): UnitAgg[] {
  const map = new Map<string, UnitAgg>();
  for (const r of records) {
    const cur =
      map.get(r.unitId) ??
      { subject: r.subject, unitId: r.unitId, attempts: 0, correct: 0 };
    cur.attempts += 1;
    if (r.correct) cur.correct += 1;
    map.set(r.unitId, cur);
  }
  return [...map.values()];
}

/** 制覇判定: 累計正答率 ≥ 0.7 かつ 累計 ≥ 5 問。 */
export function isMastered(a: UnitAgg): boolean {
  return (
    a.attempts >= MASTERY_MIN_ATTEMPTS &&
    a.correct / a.attempts >= MASTERY_RATE
  );
}

/** のべ問題数 → レベル。Lv = floor(sqrt(total/10)) + 1。 */
export function levelForTotal(total: number): LevelInfo {
  const level = Math.floor(Math.sqrt(total / 10)) + 1;
  const base = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { level, current: total - base, span: next - base, toNext: next - total };
}

/** attempts の JST 日付キー（昇順・ユニーク）。 */
export function dateKeysOf(records: AttemptRecord[]): string[] {
  const set = new Set(records.map((r) => toJstDateKey(r.createdAtMs)));
  return [...set].sort();
}

/** のべ学習日数。 */
export function totalLearningDays(keys: string[]): number {
  return new Set(keys).size;
}

/** 今月（monthKey="YYYY-MM"）の学習日数。 */
export function daysInMonth(keys: string[], monthKey: string): number {
  return new Set(keys.filter((k) => k.startsWith(monthKey + "-"))).size;
}

/**
 * 連続日数。今日（todayKey）または前日をアンカーに遡って連続する日数。
 * 今日未学習でも前日まで続いていれば継続扱い（1日の猶予）。2日以上空けば 0。
 */
export function currentStreak(keys: string[], todayKey: string): number {
  const set = new Set(keys);
  let anchor = todayKey;
  if (!set.has(anchor)) {
    anchor = addDaysKey(todayKey, -1);
    if (!set.has(anchor)) return 0;
  }
  let count = 0;
  let cur = anchor;
  while (set.has(cur)) {
    count += 1;
    cur = addDaysKey(cur, -1);
  }
  return count;
}
