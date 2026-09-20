// src/lib/progress-stats/types.ts
/** attempts 1 件（Store が UTC エポックms に正規化して返す）。 */
export interface AttemptRecord {
  subject: string;
  unitId: string;
  correct: boolean;
  createdAtMs: number;
}

/** test_results 1 件（takenAtMs は UTC エポックms）。 */
export interface TestRecord {
  subject: string;
  testKey: string;
  total: number;
  score: number;
  takenAtMs: number;
}

/** 単元ごとの累計集約。 */
export interface UnitAgg {
  subject: string;
  unitId: string;
  attempts: number;
  correct: number;
}

/** レベル情報。 */
export interface LevelInfo {
  level: number;
  current: number; // 現レベル開始点からの到達数
  span: number; // 現→次レベルに必要な数
  toNext: number; // 次レベルまでの残り
}

/** 継続情報。 */
export interface StreakInfo {
  current: number; // 連続日数
  thisMonth: number; // 今月の学習日数
  totalDays: number; // のべ学習日数
}
