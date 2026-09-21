// 語彙パック（英会話・TOEIC語彙）の型定義。
//
// 方針: 8000語規模を1問ずつ手作りするのではなく、「語彙表（word→意味）」を
// データとして持ち、そこから4択問題を純ロジックで生成する（生成AIは使わない）。
// 誤答はパック内の他の実在語の意味から決定的に抽出する（造語ダミーが出ない）。

import type { QuizGrade, Subject } from "@/lib/quiz/types";

/** 語彙1語。ja は「1義に絞ったきれいな日本語」を入れる（別解成立を避ける肝）。 */
export interface VocabEntry {
  /** 英単語（見出し語）。例 "achieve"。 */
  word: string;
  /** 品詞ラベル（表示用）。例 "動" "名" "形"。 */
  pos: string;
  /** 日本語の意味（1義）。これが正解の選択肢になる。例 "達成する"。 */
  ja: string;
  /** 短い例文・コロケーション（任意）。例 "achieve a goal（目標を達成する）"。 */
  example?: string;
  /** 所属ユニット番号（1,2,3…）。同一バンド内の学習まとまり。 */
  unit: number;
}

/** ユニットのメタ（タイトル・説明）。 */
export interface VocabUnitMeta {
  unit: number;
  title: string;
  lesson: string;
}

/** buildVocabUnits の入力。 */
export interface VocabPack {
  subject: Subject;
  grade: QuizGrade;
  /** 単元 id の接頭辞。例 "eikaiwa-500" → 単元 id は "eikaiwa-500-1"。 */
  idPrefix: string;
  units: VocabUnitMeta[];
  vocab: VocabEntry[];
}
