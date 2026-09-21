// 英会話（TOEIC語彙）トラックの単元。
//
// 学齢（小中高）に依存しない独立トラック。レベルは学年ではなく TOEIC バンド。
// 単元は語彙パックから決定的に生成する（生成AIは使わない）。将来 TOEIC600 等は
// 別パックを buildVocabUnits して spread するだけで増やせる。

import type { QuizUnit } from "./types";
import { buildVocabUnits } from "./vocab/build";
import { TOEIC500_UNITS, TOEIC500_VOCAB } from "./vocab/pack_toeic500";

export const EIKAIWA_UNITS: QuizUnit[] = buildVocabUnits({
  subject: "eikaiwa",
  grade: "TOEIC500",
  idPrefix: "eikaiwa-500",
  units: TOEIC500_UNITS,
  vocab: TOEIC500_VOCAB,
});
