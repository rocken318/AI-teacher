// src/lib/progress-stats/overall.ts
import type { Stage } from "@/lib/stage";
import type { AttemptRecord, LevelInfo, StreakInfo } from "./types";
import {
  aggregateByUnit,
  isMastered,
  levelForTotal,
  dateKeysOf,
  totalLearningDays,
  daysInMonth,
  currentStreak,
} from "./stats";
import { stageTargetUnits } from "./targets";
import { toJstDateKey, jstMonthKey } from "./time";

/** 単一スコープ（全体 or 教科）の制覇割合。 */
export interface MasteryShare {
  masteredUnits: number;
  targetUnits: number;
  percent: number; // 0..100 の整数
}

/** 全体の進捗ページに必要な集計一式。 */
export interface OverallStats {
  stage: Stage;
  overall: MasteryShare;
  bySubject: Record<string, MasteryShare>;
  totalAttempts: number;
  totalCorrect: number;
  level: LevelInfo;
  streak: StreakInfo;
}

function share(mastered: number, target: number): MasteryShare {
  return {
    masteredUnits: mastered,
    targetUnits: target,
    percent: target > 0 ? Math.round((mastered / target) * 100) : 0,
  };
}

/**
 * 全体の進捗を合成する。
 * @param records その子の全 attempts（UTC エポックms 正規化済み）
 * @param stage   その子の学齢
 * @param nowMs   「今月/連続日数」の基準時刻（既定 Date.now()）。テストで固定可。
 */
export function overallStats(
  records: AttemptRecord[],
  stage: Stage,
  nowMs: number = Date.now(),
): OverallStats {
  const target = stageTargetUnits(stage);

  const bySubject: Record<string, MasteryShare> = {};
  let overallMastered = 0;
  for (const [subject, unitIds] of Object.entries(target.bySubject)) {
    // その教科の記録だけを集約する。単元 id が教科をまたいで衝突しても
    // 集約が混ざらない（教科横断で unitId 単独キーにしない）。
    const agg = aggregateByUnit(records.filter((r) => r.subject === subject));
    const masteredIds = new Set(agg.filter(isMastered).map((a) => a.unitId));
    const m = unitIds.filter((id) => masteredIds.has(id)).length; // 対象単元のみ数える
    bySubject[subject] = share(m, unitIds.length);
    overallMastered += m;
  }

  const totalAttempts = records.length;
  const totalCorrect = records.reduce((n, r) => n + (r.correct ? 1 : 0), 0);
  const keys = dateKeysOf(records);

  return {
    stage,
    overall: share(overallMastered, target.total),
    bySubject,
    totalAttempts,
    totalCorrect,
    level: levelForTotal(totalAttempts),
    streak: {
      current: currentStreak(keys, toJstDateKey(nowMs)),
      thisMonth: daysInMonth(keys, jstMonthKey(nowMs)),
      totalDays: totalLearningDays(keys),
    },
  };
}
