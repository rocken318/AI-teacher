// src/lib/progress-stats/subject.ts
import type { Stage } from "@/lib/stage";
import type { AttemptRecord } from "./types";
import { isMastered } from "./stats";
import { stageTargetUnits } from "./targets";

/** 単元別の推移（スパークライン）。 */
export interface UnitTrend {
  spark: number[]; // 各区間の正答率 0..1（最大5点）
  direction: "up" | "flat" | "down";
}

/** 教科ページの単元1行。 */
export interface UnitProgress {
  unitId: string;
  attempts: number;
  correct: number;
  rate: number; // 累計正答率 0..1
  mastered: boolean;
  trend: UnitTrend;
}

/** 教科の進捗一式。 */
export interface SubjectStats {
  subject: string;
  masteredUnits: number;
  targetUnits: number;
  percent: number; // 0..100 の整数
  units: UnitProgress[];
}

const MAX_BUCKETS = 5;

/**
 * 単元の時系列 attempts を最大5区間に等分し、各区間の正答率を出す。
 * direction は「後半の平均 − 前半の平均」で ↑→↓ を判定（差 > 0.1 で有意）。
 */
export function unitTrend(records: AttemptRecord[]): UnitTrend {
  const sorted = [...records].sort((a, b) => a.createdAtMs - b.createdAtMs);
  const n = sorted.length;
  if (n === 0) return { spark: [], direction: "flat" };

  const buckets = Math.min(MAX_BUCKETS, n);
  const spark: number[] = [];
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor((b * n) / buckets);
    const end = Math.floor(((b + 1) * n) / buckets);
    const slice = sorted.slice(start, end);
    const rate = slice.length
      ? slice.filter((r) => r.correct).length / slice.length
      : 0;
    spark.push(rate);
  }

  const half = Math.floor(spark.length / 2);
  const early = spark.slice(0, half);
  const late = spark.slice(spark.length - half);
  const avg = (xs: number[]) =>
    xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
  const delta = half > 0 ? avg(late) - avg(early) : 0;
  const direction = delta > 0.1 ? "up" : delta < -0.1 ? "down" : "flat";
  return { spark, direction };
}

/**
 * 教科の進捗。対象単元（学齢の subjectPool）をすべて行にし、
 * 触っていない単元も 0 試行で含める（一覧の抜けを防ぐ）。
 */
export function subjectStats(
  records: AttemptRecord[],
  subject: string,
  stage: Stage,
): SubjectStats {
  const target = stageTargetUnits(stage);
  const targetIds = target.bySubject[subject] ?? [];
  const forSubject = records.filter((r) => r.subject === subject);
  const byUnit = new Map<string, AttemptRecord[]>();
  for (const r of forSubject) {
    const arr = byUnit.get(r.unitId) ?? [];
    arr.push(r);
    byUnit.set(r.unitId, arr);
  }

  let mastered = 0;
  const units: UnitProgress[] = targetIds.map((unitId) => {
    const rs = byUnit.get(unitId) ?? [];
    const attempts = rs.length;
    const correct = rs.filter((r) => r.correct).length;
    const isM = isMastered({ subject, unitId, attempts, correct });
    if (isM) mastered += 1;
    return {
      unitId,
      attempts,
      correct,
      rate: attempts > 0 ? correct / attempts : 0,
      mastered: isM,
      trend: unitTrend(rs),
    };
  });

  return {
    subject,
    masteredUnits: mastered,
    targetUnits: targetIds.length,
    percent: targetIds.length > 0 ? Math.round((mastered / targetIds.length) * 100) : 0,
    units,
  };
}
