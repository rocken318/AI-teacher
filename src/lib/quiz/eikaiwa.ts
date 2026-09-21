// 英会話（TOEIC語彙）トラックの単元。
//
// 学齢（小中高）に依存しない独立トラック。レベルは学年ではなく TOEIC バンド。
// 単元は語彙パックから決定的に生成する（生成AIは使わない）。将来 TOEIC600 等は
// 別パックを buildVocabUnits して spread するだけで増やせる。

import type { QuizUnit } from "./types";
import type { VocabUnitMeta } from "./vocab/types";
import { buildVocabUnits } from "./vocab/build";
import { TOEIC500_UNITS, TOEIC500_VOCAB } from "./vocab/pack_toeic500";
import { TOEIC500_B_UNITS, TOEIC500_B_VOCAB } from "./vocab/pack_toeic500_b";

// 手作りパック(1〜3)＋ ejdict取込→キュレーション済みパック(4〜6) を1バンドに統合。
// 誤答はバンド全体（全語）から選ぶため、両パックの vocab を合わせて渡す。
const TOEIC500_ALL_UNITS = [...TOEIC500_UNITS, ...TOEIC500_B_UNITS];
const TOEIC500_ALL_VOCAB = [...TOEIC500_VOCAB, ...TOEIC500_B_VOCAB];

// 英→日（意味を知る＝認識）。まずはこちらで意味をおぼえる。
const FORWARD_UNITS: QuizUnit[] = buildVocabUnits({
  subject: "eikaiwa",
  grade: "TOEIC500",
  idPrefix: "eikaiwa-500",
  units: TOEIC500_ALL_UNITS,
  vocab: TOEIC500_ALL_VOCAB,
});

// 日→英（自分で英語にする＝産出）。同じ語を逆向きに出題し、想起で定着させる。
// データは同じパックを流用（追加0）。単元 id は接頭辞を変えて衝突を避ける。
const REVERSE_META: VocabUnitMeta[] = TOEIC500_ALL_UNITS.map((m) => ({
  unit: m.unit,
  title: `英語で言う：${m.title.replace("（TOEIC500・", "（日→英・")}`,
  lesson:
    "日本語を見て英語を選ぶ練習。意味をおぼえたら、今度は自分で英語にできるか試そう。",
}));
const REVERSE_UNITS: QuizUnit[] = buildVocabUnits({
  subject: "eikaiwa",
  grade: "TOEIC500",
  idPrefix: "eikaiwa-500r",
  units: REVERSE_META,
  vocab: TOEIC500_ALL_VOCAB,
  direction: "ja2en",
});

export const EIKAIWA_UNITS: QuizUnit[] = [...FORWARD_UNITS, ...REVERSE_UNITS];
