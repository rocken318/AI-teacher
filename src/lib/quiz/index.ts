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
import { SCIENCE_UNITS_J2 } from "./science_j2";
import { SOCIAL_UNITS } from "./social";
import { SOCIAL_UNITS_B } from "./social_b";
import { SOCIAL_UNITS_C } from "./social_c";
import { HISTORY_UNITS_J2 } from "./history_j2";
import { GEOGRAPHY_UNITS_J2 } from "./geography_j2";
import { JAPANESE_UNITS } from "./japanese";
import { JAPANESE_UNITS_J2 } from "./japanese_j2";
import { ENGLISH_UNITS } from "./english";
import { ENGLISH_UNITS_J2 } from "./english_j2";

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
  ...SCIENCE_UNITS_J2,
  ...SOCIAL_UNITS,
  ...SOCIAL_UNITS_B,
  ...SOCIAL_UNITS_C,
  ...HISTORY_UNITS_J2,
  ...GEOGRAPHY_UNITS_J2,
  ...JAPANESE_UNITS,
  ...JAPANESE_UNITS_J2,
  ...ENGLISH_UNITS,
  ...ENGLISH_UNITS_J2,
];

/** 学年の並び順（小→高）。UIのタブ順やソートに使う。 */
export const GRADE_ORDER: QuizGrade[] = [
  "小4",
  "小5",
  "小6",
  "中1",
  "中2",
  "中3",
  "高1",
  "高2",
  "高3",
];

/** 対象学年の一覧（後方互換）。 */
export const QUIZ_GRADES: QuizGrade[] = ["小4", "小5", "小6"];

/**
 * 教科メタ情報（UI表示用）。
 * accent は Tailwind の色トークン名。
 * 中学では社会を「歴史」「地理」に分ける。
 */
export const SUBJECTS: SubjectMeta[] = [
  { key: "science", label: "理科", emoji: "🔬", accent: "emerald" },
  { key: "social", label: "社会", emoji: "🗺️", accent: "amber" },
  { key: "history", label: "歴史", emoji: "📜", accent: "orange" },
  { key: "geography", label: "地理", emoji: "🌏", accent: "teal" },
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

/** その教科に実在する学年（小→高の順）。UIの学年タブ生成に使う。 */
export function subjectGrades(subject: Subject): QuizGrade[] {
  const present = new Set(
    QUIZ_UNITS.filter((u) => u.subject === subject).map((u) => u.grade),
  );
  return GRADE_ORDER.filter((g) => present.has(g));
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
