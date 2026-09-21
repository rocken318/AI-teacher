// 学校英語（english科目）の「英単語」単元。
//
// 英会話トラック用に高品質キュレーション済みの語彙バンクを再利用し、学校英語の
// 学年別「英単語」ドリル（英語→日本語の4択）を生成する。生成AIは使わない。
//
// 学年対応（正直な注記）: 無料データに「中2で習う/高1で習う」の厳密な学年区分は
// 無いため、レベルで対応させている。
//   - 中2「英単語」= 頻度2000語ベースの基礎英単語（＝中学で出会う基礎語）。
//   - 高1「英単語」= 中級〜上級（TOEIC600/730相当）。
// 語(word)・意味(ja)はバンク側で一意に調整済みなので、各単元内で選択肢は重複しない。

import type { QuizUnit } from "./types";
import type { QuizGrade, Subject } from "./types";
import type { VocabEntry } from "./vocab/types";
import { buildVocabUnits } from "./vocab/build";
import { TOEIC500_VOCAB } from "./vocab/pack_toeic500";
import { TOEIC500_B_VOCAB } from "./vocab/pack_toeic500_b";
import { TOEIC500_C_VOCAB } from "./vocab/pack_toeic500_c";
import { TOEIC500_D_VOCAB } from "./vocab/pack_toeic500_d";
import { TOEIC500_E_VOCAB } from "./vocab/pack_toeic500_e";
import { TOEIC500_F_VOCAB } from "./vocab/pack_toeic500_f";
import { TOEIC500_G_VOCAB } from "./vocab/pack_toeic500_g";
import { TOEIC500_H_VOCAB } from "./vocab/pack_toeic500_h";
import { TOEIC600_VOCAB } from "./vocab/pack_toeic600";
import { TOEIC730_VOCAB } from "./vocab/pack_toeic730";

/** 語彙配列を1単元（英→日）として生成する。全語を同一単元にまとめる。 */
function oneVocabUnit(
  vocab: VocabEntry[],
  subject: Subject,
  grade: QuizGrade,
  idPrefix: string,
  title: string,
  lesson: string,
): QuizUnit[] {
  const remapped = vocab.map((e) => ({ ...e, unit: 1 }));
  return buildVocabUnits({
    subject,
    grade,
    idPrefix,
    units: [{ unit: 1, title, lesson }],
    vocab: remapped,
  });
}

// 中2「英単語」: 中学で出会う基礎英単語（頻度2000語ベース）。
const JUNIOR2_VOCAB: VocabEntry[] = [
  ...TOEIC500_VOCAB,
  ...TOEIC500_B_VOCAB,
  ...TOEIC500_C_VOCAB,
  ...TOEIC500_D_VOCAB,
  ...TOEIC500_E_VOCAB,
  ...TOEIC500_F_VOCAB,
  ...TOEIC500_G_VOCAB,
  ...TOEIC500_H_VOCAB,
];

// 高1「英単語」: 中級〜上級（TOEIC600/730相当）。
const HIGH1_VOCAB: VocabEntry[] = [...TOEIC600_VOCAB, ...TOEIC730_VOCAB];

export const ENGLISH_VOCAB_UNITS: QuizUnit[] = [
  ...oneVocabUnit(
    JUNIOR2_VOCAB,
    "english",
    "中2",
    "j2e-vocab",
    "英単語",
    "中学で習う基礎英単語。英語を見て意味を4択でおぼえよう。まちがえても解説とヒントが出るよ。",
  ),
  ...oneVocabUnit(
    HIGH1_VOCAB,
    "english",
    "高1",
    "h1e-vocab",
    "英単語",
    "高1レベルの中級〜上級英単語。英語を見て意味を4択でおぼえよう。",
  ),
];
