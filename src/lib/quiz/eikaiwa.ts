// 英会話（TOEIC語彙）トラックの単元。
//
// 学齢（小中高）に依存しない独立トラック。レベルは学年ではなく TOEIC バンド。
// 単元は語彙パックから決定的に生成する（生成AIは使わない）。新しいバンドは
// パックを足して buildBand を1行呼ぶだけで増やせる。

import type { QuizGrade, QuizUnit } from "./types";
import type { VocabEntry, VocabUnitMeta } from "./vocab/types";
import { buildVocabUnits } from "./vocab/build";
import { TOEIC500_UNITS, TOEIC500_VOCAB } from "./vocab/pack_toeic500";
import { TOEIC500_B_UNITS, TOEIC500_B_VOCAB } from "./vocab/pack_toeic500_b";
import { TOEIC500_C_UNITS, TOEIC500_C_VOCAB } from "./vocab/pack_toeic500_c";
import { TOEIC500_D_UNITS, TOEIC500_D_VOCAB } from "./vocab/pack_toeic500_d";
import { TOEIC600_UNITS, TOEIC600_VOCAB } from "./vocab/pack_toeic600";
import { TOEIC730_UNITS, TOEIC730_VOCAB } from "./vocab/pack_toeic730";

/**
 * 1バンドを「英→日（認識）」＋「日→英（産出）」の両方向で生成する。
 * - 誤答はバンド全体（全語）から選ぶため vocab をまとめて渡す。
 * - 逆方向はデータ流用（追加0）。単元 id は接頭辞に "r" を足して衝突を避ける。
 * - 逆方向のタイトルは順方向を流用し「英語で言う：…（日→英・…）」に変換。
 */
function buildBand(
  grade: QuizGrade,
  idPrefix: string,
  bandTag: string,
  units: VocabUnitMeta[],
  vocab: VocabEntry[],
): QuizUnit[] {
  const forward = buildVocabUnits({
    subject: "eikaiwa",
    grade,
    idPrefix,
    units,
    vocab,
  });
  const reverseMeta: VocabUnitMeta[] = units.map((m) => ({
    unit: m.unit,
    title: `英語で言う：${m.title.replace(`（${bandTag}`, "（日→英")}`,
    lesson:
      "日本語を見て英語を選ぶ練習。意味をおぼえたら、今度は自分で英語にできるか試そう。",
  }));
  const reverse = buildVocabUnits({
    subject: "eikaiwa",
    grade,
    idPrefix: `${idPrefix}r`,
    units: reverseMeta,
    vocab,
    direction: "ja2en",
  });
  return [...forward, ...reverse];
}

// TOEIC500: 手作り(1〜3)＋ejdict中級(4〜6)＋並列キュレーションの頻出基礎語(7〜16, 17〜27)。
const TOEIC500_BAND = buildBand(
  "TOEIC500",
  "eikaiwa-500",
  "TOEIC500",
  [...TOEIC500_UNITS, ...TOEIC500_B_UNITS, ...TOEIC500_C_UNITS, ...TOEIC500_D_UNITS],
  [...TOEIC500_VOCAB, ...TOEIC500_B_VOCAB, ...TOEIC500_C_VOCAB, ...TOEIC500_D_VOCAB],
);

// TOEIC600: 中級100語（ejdict取込→キュレーション）。
const TOEIC600_BAND = buildBand(
  "TOEIC600",
  "eikaiwa-600",
  "TOEIC600",
  TOEIC600_UNITS,
  TOEIC600_VOCAB,
);

// TOEIC730: 上級100語（基礎850の外側リングから選定→キュレーション）。
const TOEIC730_BAND = buildBand(
  "TOEIC730",
  "eikaiwa-730",
  "TOEIC730",
  TOEIC730_UNITS,
  TOEIC730_VOCAB,
);

export const EIKAIWA_UNITS: QuizUnit[] = [
  ...TOEIC500_BAND,
  ...TOEIC600_BAND,
  ...TOEIC730_BAND,
];
