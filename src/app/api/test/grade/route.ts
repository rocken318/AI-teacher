import { NextRequest, NextResponse } from "next/server";
import { getUnit, gradeAnswer, diagnose } from "@/lib/math";
import type { Problem } from "@/lib/math";
import { decodeToken } from "@/lib/math/token";
import { gradeQuiz } from "@/lib/quiz";
import { decodeQuizToken } from "@/lib/quiz/token";
import { logAttempt, logTestResult } from "@/lib/db/log";
import { getTestHistory } from "@/lib/db/read";
import {
  buildTestKey,
  buildRandomTestKey,
} from "@/lib/test/session";
import { isTestSubject, subjectKind, subjectPool, isValidUnit } from "@/lib/test/pool";

export const runtime = "nodejs";

/** 実際のテストは常に 5 / 10 / 20 問。ここを固定すると保存する total を信用できる。 */
const ALLOWED_COUNTS = [5, 10, 20];

type MathAnswerIn = {
  unitId?: string;
  answerToken?: string;
  userInput?: string;
  prompt?: string;
};

type QuizAnswerIn = {
  unitId?: string;
  itemId?: string;
  token?: string;
  choiceIndex?: number;
};

type AnswerIn = MathAnswerIn & QuizAnswerIn;

type ResultItem =
  | {
      unitId: string;
      prompt: string;
      userInput: string;
      correct: boolean;
      expected: string;
      diagnosis: string | null;
    }
  | {
      unitId: string;
      itemId: string;
      choiceIndex: number;
      correct: boolean;
      answerIndex: number;
      explanation: string;
    };

/**
 * テストの一括採点 API（全教科対応 + 全単元ランダム）。
 * リクエスト: { subject, unitIds?, grade?, random?, childId?, answers }
 * レスポンス: { score, total, testKey, kind, items, prevScore, prevTotal, bestScore, bestTotal, isBest }
 * 採点はサーバーで確定。正解・answerIndex はトークンから復元し、クライアント申告は信用しない。
 * answer / answerIndex はレスポンスに出さない（quiz は authored explanation / answerIndex のみ）。
 */
export async function POST(req: NextRequest) {
  let body: {
    subject?: string;
    unitIds?: unknown;
    grade?: string;
    random?: unknown;
    childId?: string;
    answers?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const subject = (body.subject ?? "").toString().trim();
  if (!isTestSubject(subject)) {
    return NextResponse.json({ error: "未対応の教科です" }, { status: 400 });
  }

  const answers: AnswerIn[] = Array.isArray(body.answers)
    ? (body.answers as AnswerIn[])
    : [];

  // Fix 1: 出題数は 5 / 10 / 20 のいずれか。保存する total を信用できる値に保つ。
  if (!ALLOWED_COUNTS.includes(answers.length)) {
    return NextResponse.json({ error: "answers は 5 / 10 / 20 問" }, { status: 400 });
  }

  const random = body.random === true;
  const kind = subjectKind(subject);

  // testKey と「許容単元集合」を決める。
  //  - random: 教科×学年で固定。許容集合はその学年プール全体。
  //  - 非 random: 選択単元集合。各 unitId は実在（isValidUnit）でなければならない。
  let testKey: string;
  let allowed: Set<string>;
  let unitIdsForSave: string[] = [];
  const isRandomForSave = random;

  if (random) {
    const grade = (body.grade ?? "").toString().trim();
    if (!grade) {
      return NextResponse.json({ error: "random には grade が必要です" }, { status: 400 });
    }
    const pool = subjectPool(subject, grade);
    if (pool.length === 0) {
      return NextResponse.json({ error: "その教科・学年に単元がありません" }, { status: 400 });
    }
    allowed = new Set(pool);
    testKey = buildRandomTestKey(subject, grade);
  } else {
    const unitIds = Array.isArray(body.unitIds)
      ? body.unitIds.map((u) => String(u)).filter(Boolean)
      : [];
    if (unitIds.length === 0) {
      return NextResponse.json({ error: "unitIds is required" }, { status: 400 });
    }
    for (const id of unitIds) {
      if (!isValidUnit(subject, id)) {
        return NextResponse.json({ error: `unknown unitId: ${id}` }, { status: 404 });
      }
    }
    allowed = new Set(unitIds);
    testKey = buildTestKey(subject, unitIds);
    unitIdsForSave = unitIds;
  }

  // 各解答の申告 unitId は許容集合に含まれること（外れたら testKey 汚染防止で 400）。
  for (const a of answers) {
    if (!allowed.has((a.unitId ?? "").toString().trim())) {
      return NextResponse.json(
        { error: "answers の単元が unitIds と一致しません" },
        { status: 400 },
      );
    }
  }

  const items: ResultItem[] = answers.map((a) => {
    const unitId = (a.unitId ?? "").toString().trim();
    if (kind === "math") {
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
          diagnosis: null,
        };
      }
      // 一括採点では prompt 不一致で全体を落とさない。トークンの確定値を使い、
      // 採点はトークン（正解）＋ userInput のみを信用する。
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
    }

    // quiz: トークンから answerIndex を復元し、改ざん/不一致は correct:false。
    const itemId = (a.itemId ?? "").toString().trim();
    const choiceIndex = Number(a.choiceIndex);
    const token = (a.token ?? "").trim();
    const payload = decodeQuizToken(token);
    if (
      !payload ||
      payload.unitId !== unitId ||
      payload.itemId !== itemId
    ) {
      return {
        unitId,
        itemId,
        choiceIndex: Number.isFinite(choiceIndex) ? choiceIndex : -1,
        correct: false,
        answerIndex: -1,
        explanation: "",
      };
    }
    const graded = gradeQuiz(unitId, itemId, choiceIndex);
    if (!graded) {
      return {
        unitId,
        itemId,
        choiceIndex: Number.isFinite(choiceIndex) ? choiceIndex : -1,
        correct: false,
        answerIndex: -1,
        explanation: "",
      };
    }
    return {
      unitId,
      itemId,
      choiceIndex: Number.isFinite(choiceIndex) ? choiceIndex : -1,
      correct: graded.correct,
      answerIndex: graded.answerIndex,
      explanation: graded.explanation,
    };
  });

  const score = items.filter((i) => i.correct).length;
  const total = items.length;

  let prevScore: number | null = null;
  let prevTotal: number | null = null;
  let bestScore: number | null = null;
  let bestTotal: number | null = null;
  let isBest = false;

  const childId = (body.childId ?? "").trim();
  if (childId) {
    // 保存の「前」に前回・自己ベストを算出（既存 math grade と同じ考え方）。
    const hist = await getTestHistory(childId, testKey, 50);
    if (hist.length > 0) {
      prevScore = hist[0].score;
      prevTotal = hist[0].total;
      // total<=0 の異常行は 0/0 → NaN で比較を壊すため除外。
      const valid = hist.filter((h) => h.total > 0);
      if (valid.length > 0) {
        let best = valid[0];
        for (const h of valid) {
          if (h.score / h.total > best.score / best.total) best = h;
        }
        bestScore = best.score;
        bestTotal = best.total;
        isBest = score / total > best.score / best.total;
      } else {
        isBest = true;
      }
    } else {
      isBest = true;
    }

    const unitCsv = isRandomForSave
      ? "__ALL__"
      : Array.from(new Set(unitIdsForSave)).sort().join(",");
    logTestResult({ childId, subject, unitIds: unitCsv, testKey, total, score });
    for (const it of items) {
      logAttempt(childId, subject, it.unitId, it.correct, "test");
    }
  }

  return NextResponse.json({
    score,
    total,
    testKey,
    kind,
    items,
    prevScore,
    prevTotal,
    bestScore,
    bestTotal,
    isBest,
  });
}
