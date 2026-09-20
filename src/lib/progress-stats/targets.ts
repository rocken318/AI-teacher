// src/lib/progress-stats/targets.ts
import type { Stage } from "@/lib/stage";
import { STAGE_GRADES } from "@/lib/stage";
import { TEST_SUBJECTS, subjectPool } from "@/lib/test/pool";

/** 学齢の対象単元集合（教科別 id 配列と総数）。 */
export interface TargetUnits {
  bySubject: Record<string, string[]>;
  total: number;
}

/**
 * その学齢で「対象となる全単元」を教科別に列挙する。
 * 各教科について STAGE_GRADES[stage] の全学年の subjectPool を集めて重複除去。
 * subjectPool は出題可能（1問以上）な単元のみを返すため、空単元は自動的に除外される。
 */
export function stageTargetUnits(stage: Stage): TargetUnits {
  const bySubject: Record<string, string[]> = {};
  let total = 0;
  const grades = STAGE_GRADES[stage] ?? [];
  for (const subject of TEST_SUBJECTS) {
    const set = new Set<string>();
    for (const grade of grades) {
      for (const unitId of subjectPool(subject, grade)) set.add(unitId);
    }
    bySubject[subject] = [...set];
    total += set.size;
  }
  return { bySubject, total };
}
