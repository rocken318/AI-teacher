// 知識クイズ基盤の公開API（集約エンジン）。
// UI（ハブ）とAPIはこのファイルの export だけに依存する。
//
// 出題・採点・解説はすべてバンクの authored（確定）データから行い、生成AIは使わない。

import type {
  Subject,
  QuizGrade,
  QuizItem,
  QuizUnit,
  SubjectMeta,
} from "./types";

// 各教科の問題バンク（別チームが作成）。
import { SCIENCE_UNITS } from "./science";
import { SCIENCE_UNITS_B } from "./science_b";
import { SOCIAL_UNITS } from "./social";
import { SOCIAL_UNITS_B } from "./social_b";
import { SOCIAL_UNITS_C } from "./social_c";
import { JAPANESE_UNITS } from "./japanese";
import { ENGLISH_UNITS } from "./english";

export type {
  Subject,
  QuizGrade,
  QuizItem,
  QuizUnit,
  SubjectMeta,
} from "./types";

/** 全単元（4教科のバンク＋増設分を結合）。 */
export const QUIZ_UNITS: QuizUnit[] = [
  ...SCIENCE_UNITS,
  ...SCIENCE_UNITS_B,
  ...SOCIAL_UNITS,
  ...SOCIAL_UNITS_B,
  ...SOCIAL_UNITS_C,
  ...JAPANESE_UNITS,
  ...ENGLISH_UNITS,
];

/** 対象学年の一覧。 */
export const QUIZ_GRADES: QuizGrade[] = ["小4", "小5", "小6"];

/**
 * 教科メタ情報（UI表示用）。
 * accent は Tailwind の色トークン名。
 */
export const SUBJECTS: SubjectMeta[] = [
  { key: "science", label: "理科", emoji: "🔬", accent: "emerald" },
  { key: "social", label: "社会", emoji: "🗺️", accent: "amber" },
  { key: "japanese", label: "国語", emoji: "✍️", accent: "rose" },
  { key: "english", label: "英語", emoji: "🔤", accent: "sky" },
];

/** 内部検索用マップ。 */
const UNIT_MAP = new Map<string, QuizUnit>(QUIZ_UNITS.map((u) => [u.id, u]));

/** 教科キーから教科メタを取得。 */
export function getSubjectMeta(key: Subject): SubjectMeta | undefined {
  return SUBJECTS.find((s) => s.key === key);
}

/** 指定教科の単元一覧。 */
export function subjectUnits(subject: Subject): QuizUnit[] {
  return QUIZ_UNITS.filter((u) => u.subject === subject);
}

/** 指定教科・学年の単元一覧。 */
export function unitsFor(subject: Subject, grade: QuizGrade): QuizUnit[] {
  return QUIZ_UNITS.filter((u) => u.subject === subject && u.grade === grade);
}

/** IDから単元を取得。 */
export function getQuizUnit(id: string): QuizUnit | undefined {
  return UNIT_MAP.get(id);
}

/**
 * 単元からランダムに1問を選ぶ。
 * answerIndex / explanation はここでは返さない（カンニング防止）。
 * 未知の unitId・問題なしの場合は null。
 */
export function pickQuestion(
  unitId: string,
): { itemId: string; question: string; choices: string[] } | null {
  const unit = UNIT_MAP.get(unitId);
  if (!unit || unit.items.length === 0) return null;
  const item = unit.items[Math.floor(Math.random() * unit.items.length)];
  return {
    itemId: item.id,
    question: item.question,
    choices: item.choices,
  };
}

/**
 * 採点する。unit → item を引き、choiceIndex と authored の answerIndex を比較。
 * explanation はバンクの authored 文言をそのまま返す（AIは使わない）。
 * 未知の unitId / itemId は null。
 */
export function gradeQuiz(
  unitId: string,
  itemId: string,
  choiceIndex: number,
): {
  correct: boolean;
  answerIndex: number;
  explanation: string;
  hint: string | null;
} | null {
  const unit = UNIT_MAP.get(unitId);
  if (!unit) return null;
  const item = unit.items.find((it: QuizItem) => it.id === itemId);
  if (!item) return null;
  return {
    correct: choiceIndex === item.answerIndex,
    answerIndex: item.answerIndex,
    explanation: item.explanation,
    // 選んだ選択肢へのヒント。正解時や未設定は null（explanation にフォールバック）。
    hint: item.choiceHints?.[choiceIndex] ?? null,
  };
}
