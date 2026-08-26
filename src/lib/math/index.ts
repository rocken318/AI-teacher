// 算数計算エンジンの公開API。
// UIチームはこのファイルのexportだけに依存する。

import type { Grade, Problem, Unit, GradeResult } from "./types";
import {
  UNIT_DEFS,
  reduceFraction,
  formatFraction,
  formatRatio,
} from "./units";

export type { Grade, AnswerType, Problem, Unit, GradeResult } from "./types";

/** 全単元（メタ情報のみ。ジェネレータは公開しない）。 */
export const UNITS: Unit[] = UNIT_DEFS.map(({ id, grade, title, lesson, answerType }) => ({
  id,
  grade,
  title,
  lesson,
  answerType,
}));

/** 内部検索用マップ。 */
const UNIT_MAP = new Map(UNIT_DEFS.map((u) => [u.id, u]));

/** 指定学年の単元一覧。 */
export function unitsForGrade(grade: Grade): Unit[] {
  return UNITS.filter((u) => u.grade === grade);
}

/** IDから単元を取得。 */
export function getUnit(id: string): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

/**
 * 新しい問題を生成する（呼ぶたびに数値ランダム）。答えは計算で確定済み。
 * 未知のunitIdはエラー。
 */
export function generateProblem(unitId: string): Problem {
  const def = UNIT_MAP.get(unitId);
  if (!def) throw new Error(`未知の単元です: ${unitId}`);
  return def.generate();
}

// ------------------------------------------------------------------
// 入力の正規化
// ------------------------------------------------------------------

/** 全角数字・記号を半角へ変換する。 */
function toHalfWidth(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[／]/g, "/")
    .replace(/[．。]/g, ".")
    .replace(/[：]/g, ":")
    .replace(/[－―ー−]/g, "-")
    .replace(/[　]/g, " ");
}

/**
 * ユーザー入力から数式に必要な文字だけを抽出しつつ正規化する。
 * 「こたえは」等の日本語や空白を除去し、数字・記号（/ . : -）を残す。
 */
function extractNumeric(raw: string): string {
  const half = toHalfWidth(raw);
  // 許可文字：数字, 小数点, 分数線, 比コロン, マイナス, 空白（後で除去）
  const filtered = half.replace(/[^0-9./:\- ]/g, "");
  return filtered.replace(/\s+/g, "").trim();
}

/** 文字列を数値化（分数 "a/b" も評価）。失敗時 null。 */
function parseNumeric(s: string): number | null {
  if (s === "") return null;
  const fracMatch = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (fracMatch) {
    const den = Number(fracMatch[2]);
    if (den === 0) return null;
    return Number(fracMatch[1]) / den;
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return null;
}

/** 分数文字列を既約表記に正規化。整数もそのまま整数文字列に。 */
function normalizeFractionString(s: string): string | null {
  const fracMatch = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (fracMatch) {
    const num = Number(fracMatch[1]);
    const den = Number(fracMatch[2]);
    if (den === 0) return null;
    return formatFraction(num, den);
  }
  if (/^-?\d+$/.test(s)) return String(Number(s)); // 整数の分数答えを許容
  return null;
}

/** 比文字列 "a:b" を既約表記に正規化。 */
function normalizeRatioString(s: string): string | null {
  const m = s.match(/^(-?\d+):(-?\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  try {
    return formatRatio(a, b);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// 採点
// ------------------------------------------------------------------

/**
 * ユーザー入力を採点する。
 * 入力を正規化してから problem.answer と比較する。
 * - integer/decimal: 数値化して微小誤差(1e-9)以内なら正解
 * - fraction: 約分して比較（"6/8"="3/4"、整数も許容）
 * - text(比): 既約 "a:b" にして比較
 */
export function gradeAnswer(
  unitId: string,
  problem: Problem,
  userInput: string
): GradeResult {
  const expected = problem.answer;
  const cleaned = extractNumeric(userInput);

  switch (problem.answerType) {
    case "fraction": {
      const normUser = normalizeFractionString(cleaned);
      if (normUser === null) {
        return { correct: false, expected, normalizedUser: cleaned };
      }
      // 期待値も同じルールで正規化して比較（堅牢化）。
      const normExpected = normalizeFractionString(expected) ?? expected;
      return {
        correct: normUser === normExpected,
        expected,
        normalizedUser: normUser,
      };
    }
    case "text": {
      // 現状のtext単元は比のみ。
      const normUser = normalizeRatioString(cleaned);
      if (normUser === null) {
        return { correct: false, expected, normalizedUser: cleaned };
      }
      const normExpected = normalizeRatioString(expected) ?? expected;
      return {
        correct: normUser === normExpected,
        expected,
        normalizedUser: normUser,
      };
    }
    case "integer":
    case "decimal":
    default: {
      const userVal = parseNumeric(cleaned);
      const expectedVal = parseNumeric(extractNumeric(expected));
      if (userVal === null || expectedVal === null) {
        return { correct: false, expected, normalizedUser: cleaned };
      }
      const correct = Math.abs(userVal - expectedVal) < 1e-9;
      return { correct, expected, normalizedUser: cleaned };
    }
  }
}
