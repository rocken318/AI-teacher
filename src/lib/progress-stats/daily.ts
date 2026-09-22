// src/lib/progress-stats/daily.ts
import type { AttemptRecord } from "./types";
import { toJstDateKey, addDaysKey } from "./time";

/** 直近 N 日の日別 activity（努力量＝その日の問題数）。 */
export interface DailyActivity {
  /** 古い→今日 の時系列。0問の日も含める（窓を埋める）。 */
  days: { date: string; count: number }[];
  /** 窓の中で 1問以上やった日数。 */
  activeDays: number;
  /** 窓の中の最大 count（棒の高さ正規化用。全0なら0）。 */
  maxCount: number;
}

/**
 * todayKey から遡って days 日ぶんの、日別問題数を返す。
 * - JST の暦日で集計（toJstDateKey）。
 * - 窓（start..today）を addDaysKey で列挙し、記録の無い日も count:0 で埋める。
 * - todayKey は呼び出し側（ルート）が toJstDateKey(Date.now()) で渡す（純関数に時刻を持ち込まない）。
 */
export function dailyActivity(
  records: AttemptRecord[],
  todayKey: string,
  days = 30,
): DailyActivity {
  const span = Math.max(1, Math.floor(days));

  // 日付キー → 件数
  const counts = new Map<string, number>();
  for (const r of records) {
    const k = toJstDateKey(r.createdAtMs);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  // 窓の先頭（span-1 日前）から今日まで、時系列昇順で埋める。
  const out: { date: string; count: number }[] = [];
  let cur = addDaysKey(todayKey, -(span - 1));
  for (let i = 0; i < span; i++) {
    out.push({ date: cur, count: counts.get(cur) ?? 0 });
    cur = addDaysKey(cur, 1);
  }

  const activeDays = out.filter((d) => d.count > 0).length;
  const maxCount = out.reduce((m, d) => Math.max(m, d.count), 0);
  return { days: out, activeDays, maxCount };
}
