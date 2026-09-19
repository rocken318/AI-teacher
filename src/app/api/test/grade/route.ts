import { NextRequest, NextResponse } from "next/server";
import { getUnit, gradeAnswer, diagnose } from "@/lib/math";
import type { Problem } from "@/lib/math";
import { decodeToken } from "@/lib/math/token";
import { logAttempt, logTestResult } from "@/lib/db/log";
import { getTestHistory } from "@/lib/db/read";
import { buildTestKey } from "@/lib/test/session";

export const runtime = "nodejs";

/** 実際のテストは常に 5 / 10 / 20 問。ここを固定すると保存する total を信用できる。 */
const ALLOWED_COUNTS = [5, 10, 20];

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

  // Fix 1: 出題数は 5 / 10 / 20 のいずれか。1問だけを「テスト1回」として
  // 保存されるのを防ぎ、保存する total を信用できる値に保つ。
  if (!ALLOWED_COUNTS.includes(answers.length)) {
    return NextResponse.json(
      { error: "answers は 5 / 10 / 20 問" },
      { status: 400 },
    );
  }

  // Fix 2a: 選択単元はすべて既知の単元でなければならない（start と同じ扱い）。
  // これで testKey / 履歴バケットが実在の単元だけで作られる。
  for (const id of unitIds) {
    if (!getUnit(id)) {
      return NextResponse.json(
        { error: `unknown unitId: ${id}` },
        { status: 404 },
      );
    }
  }

  // Fix 2b: 各解答が申告する unitId は選択単元集合に含まれていること。
  // （採点前に検証。トークンが不正/改ざんなら従来どおり item ごとに correct:false。
  //  こちらは「申告 unitId が選択と一致するか」の検証で、結果を正しい testKey に紐づける。）
  const unitSet = new Set(unitIds);
  for (const a of answers) {
    if (!unitSet.has((a.unitId ?? "").trim())) {
      return NextResponse.json(
        { error: "answers の単元が unitIds と一致しません" },
        { status: 400 },
      );
    }
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
    // Fix 4: math/grade と違い、この一括採点では prompt 不一致で全体を 400 にしない。
    // 1問の申告ズレでバッチ全体を落とすべきではないため、prompt はトークンの確定値を
    // そのまま使い、採点はトークン（正解）＋ userInput のみを信用する。
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
      // Fix 3: total<=0 の異常行（旧/他系統データ）は 0/0 → NaN で比較を壊すため除外。
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
        // 有効な過去行が無ければ今回を初回扱い（自己ベスト）。
        isBest = true;
      }
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
