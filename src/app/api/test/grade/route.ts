import { NextRequest, NextResponse } from "next/server";
import { getUnit, gradeAnswer, diagnose } from "@/lib/math";
import type { Problem } from "@/lib/math";
import { decodeToken } from "@/lib/math/token";
import { logAttempt, logTestResult } from "@/lib/db/log";
import { getTestHistory } from "@/lib/db/read";
import { buildTestKey } from "@/lib/test/session";

export const runtime = "nodejs";

type AnswerIn = {
  unitId?: string;
  answerToken?: string;
  userInput?: string;
  prompt?: string;
};

/**
 * テストの一括採点 API（算数・v1）。
 * リクエスト: {
 *   subject: "math", unitIds: string[], childId?: string,
 *   answers: [{ unitId, answerToken, userInput, prompt? }]
 * }
 * レスポンス: {
 *   score, total, testKey,
 *   items: [{ unitId, prompt, userInput, correct, expected, diagnosis }],
 *   prevScore, prevTotal, bestScore, bestTotal, isBest
 * }
 * 採点はサーバーで gradeAnswer に委譲。正解・問題文はトークンから復元し、
 * クライアント申告（userInput 以外）は信用しない。
 */
export async function POST(req: NextRequest) {
  let body: {
    subject?: string;
    unitIds?: unknown;
    childId?: string;
    answers?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const subject = (body.subject ?? "").toString().trim();
  if (subject !== "math") {
    return NextResponse.json({ error: "v1 は算数(math)のみ対応" }, { status: 400 });
  }

  const unitIds = Array.isArray(body.unitIds)
    ? body.unitIds.map((u) => String(u)).filter(Boolean)
    : [];
  const answers: AnswerIn[] = Array.isArray(body.answers)
    ? (body.answers as AnswerIn[])
    : [];
  if (unitIds.length === 0 || answers.length === 0) {
    return NextResponse.json(
      { error: "unitIds and answers are required" },
      { status: 400 },
    );
  }

  const items = answers.map((a) => {
    const unitId = (a.unitId ?? "").trim();
    const token = (a.answerToken ?? "").trim();
    const userInput = a.userInput ?? "";
    const unit = getUnit(unitId);
    const payload = decodeToken(token);
    if (!unit || !payload || payload.unitId !== unitId) {
      return {
        unitId,
        prompt: a.prompt ?? "",
        userInput,
        correct: false,
        expected: "",
        diagnosis: null as string | null,
      };
    }
    const problem: Problem = {
      unitId,
      prompt: payload.prompt,
      answer: payload.answer,
      answerType: unit.answerType,
      meta: payload.meta ?? {},
    };
    const r = gradeAnswer(unitId, problem, userInput);
    const diagnosis = r.correct ? null : diagnose(unitId, problem, userInput);
    return {
      unitId,
      prompt: payload.prompt,
      userInput,
      correct: r.correct,
      expected: r.expected,
      diagnosis,
    };
  });

  const score = items.filter((i) => i.correct).length;
  const total = items.length;
  const testKey = buildTestKey(subject, unitIds);

  let prevScore: number | null = null;
  let prevTotal: number | null = null;
  let bestScore: number | null = null;
  let bestTotal: number | null = null;
  let isBest = false;

  const childId = (body.childId ?? "").trim();
  if (childId) {
    const hist = await getTestHistory(childId, testKey, 50);
    if (hist.length > 0) {
      prevScore = hist[0].score;
      prevTotal = hist[0].total;
      let best = hist[0];
      for (const h of hist) {
        if (h.score / h.total > best.score / best.total) best = h;
      }
      bestScore = best.score;
      bestTotal = best.total;
      isBest = score / total > best.score / best.total;
    } else {
      isBest = true;
    }

    const unitCsv = Array.from(new Set(unitIds)).sort().join(",");
    logTestResult({ childId, subject, unitIds: unitCsv, testKey, total, score });
    for (const it of items) {
      logAttempt(childId, subject, it.unitId, it.correct, "test");
    }
  }

  return NextResponse.json({
    score,
    total,
    testKey,
    items,
    prevScore,
    prevTotal,
    bestScore,
    bestTotal,
    isBest,
  });
}
