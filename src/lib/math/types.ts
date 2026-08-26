// 算数計算エンジンの型定義。
// 生成AIは計算・採点に使わず、すべてコードで問題・答え・採点を確定させる。

/** 対象学年。 */
export type Grade = "小4" | "小5" | "小6";

/**
 * 答えの型。
 * - integer: 整数（例 "12"）
 * - decimal: 小数（例 "3.5"）
 * - fraction: 分数（例 "3/4"、既約）
 * - text:    上記以外（例 比 "3:2"）
 */
export type AnswerType = "integer" | "decimal" | "fraction" | "text";

/**
 * 1問の問題。
 * answer は正規化済みの正解文字列。
 * - integer: "12"
 * - decimal: "3.5"（末尾ゼロなし）
 * - fraction: "3/4"（既約、分母は正）
 * - text(比): "3:2"（既約）
 */
export interface Problem {
  unitId: string;
  prompt: string;
  answer: string;
  answerType: AnswerType;
  /** 選択肢（現状は未使用だが契約として保持）。 */
  choices?: string[];
}

/** 単元（問題ジェネレータのメタ情報）。 */
export interface Unit {
  id: string;
  grade: Grade;
  title: string;
  /** 教科書的な短い説明（2〜4文、やさしい日本語）。 */
  lesson: string;
  answerType: AnswerType;
}

/** 採点結果。 */
export interface GradeResult {
  correct: boolean;
  /** 正規化済みの正解（problem.answer と同じ）。 */
  expected: string;
  /** 正規化済みのユーザー入力。 */
  normalizedUser: string;
}

/** 単元定義（ジェネレータ本体を内部で保持）。 */
export interface UnitDef extends Unit {
  /** 数値ランダムな新問題を1つ生成する。答えは計算で確定。 */
  generate: () => Problem;
}
