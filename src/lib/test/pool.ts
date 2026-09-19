/**
 * テスト出題プールのヘルパー（教科分岐・生成AI不使用）。
 * - TEST_SUBJECTS: テストが扱う全教科。
 * - subjectKind: 教科を "math"（算数エンジン）/ "quiz"（選択式クイズ）に振り分ける。
 * - subjectPool: その教科・学年の全単元id（「全単元からランダム」出題のプール）。
 * - isValidUnit: unitId がその教科の実在単元か（testKey / 履歴バケット汚染を防ぐ）。
 *
 * これらは純ロジックで、答え・answerIndex を一切露出しない。
 */

import { UNITS, getUnit } from "@/lib/math";
import type { Grade } from "@/lib/math";
import { unitsFor, getQuizUnit } from "@/lib/quiz";
import type { Subject } from "@/lib/quiz";

/** テストが扱う教科。math は算数エンジン、それ以外は選択式クイズ。 */
export const TEST_SUBJECTS = [
  "math",
  "science",
  "history",
  "geography",
  "japanese",
  "english",
] as const;

export type TestSubject = (typeof TEST_SUBJECTS)[number];

/** 教科がテスト対象か。 */
export function isTestSubject(subject: string): subject is TestSubject {
  return (TEST_SUBJECTS as readonly string[]).includes(subject);
}

/** 教科の採点系統。math→算数エンジン、他→選択式クイズ。 */
export function subjectKind(subject: string): "math" | "quiz" {
  return subject === "math" ? "math" : "quiz";
}

/**
 * その教科・学年の全単元id。
 * math は UNITS を学年で絞り、quiz は unitsFor(教科, 学年) を使う。
 * 該当が無ければ空配列（呼び出し側で 400 にできる）。
 */
export function subjectPool(subject: string, grade: string): string[] {
  if (subjectKind(subject) === "math") {
    return UNITS.filter((u) => u.grade === (grade as Grade)).map((u) => u.id);
  }
  return unitsFor(subject as Subject, grade as never).map((u) => u.id);
}

/**
 * unitId がその教科の実在単元か。
 * math は getUnit、quiz は getQuizUnit で引き、
 * さらに quiz は「その単元の subject が引数の subject と一致」まで確認する
 * （他教科の単元を混ぜて testKey を汚すのを防ぐ）。
 */
export function isValidUnit(subject: string, unitId: string): boolean {
  if (subjectKind(subject) === "math") {
    return !!getUnit(unitId);
  }
  const unit = getQuizUnit(unitId);
  return !!unit && unit.subject === (subject as Subject);
}
