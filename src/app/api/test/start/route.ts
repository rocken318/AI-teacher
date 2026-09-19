import { NextRequest, NextResponse } from "next/server";
import { generateProblem } from "@/lib/math";
import { encodeToken } from "@/lib/math/token";
import { getQuizUnit, pickQuestion } from "@/lib/quiz";
import { encodeQuizToken } from "@/lib/quiz/token";
import {
  buildTestKey,
  distributeCount,
  buildRandomTestKey,
  pickRandomSlots,
} from "@/lib/test/session";
import { isTestSubject, subjectKind, subjectPool, isValidUnit } from "@/lib/test/pool";

export const runtime = "nodejs";

const ALLOWED_COUNTS = [5, 10, 20];

/**
 * テストの出題セットを配る API（全教科対応 + 全単元ランダム）。
 * リクエスト: { subject, unitIds?, grade?, random?, count }
 * レスポンス: { testKey, total, kind, items }
 *  - math item:  { index, unitId, prompt, answerType, answerToken }
 *  - quiz item:  { index, unitId, itemId, question, choices, token }
 *  - answer / answerIndex は絶対に出さない（暗号トークン内のみ）。
 */
export async function POST(req: NextRequest) {
  let body: {
    subject?: string;
    unitIds?: unknown;
    grade?: string;
    random?: unknown;
    count?: unknown;
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

  const count = Number(body.count);
  if (!ALLOWED_COUNTS.includes(count)) {
    return NextResponse.json({ error: "count は 5 / 10 / 20 のいずれか" }, { status: 400 });
  }

  const random = body.random === true;
  const kind = subjectKind(subject);

  // 出題スロット（各要素が unitId）と testKey を決める。
  let slots: string[];
  let testKey: string;
  if (random) {
    const grade = (body.grade ?? "").toString().trim();
    if (!grade) {
      return NextResponse.json({ error: "random には grade が必要です" }, { status: 400 });
    }
    const pool = subjectPool(subject, grade);
    if (pool.length === 0) {
      return NextResponse.json({ error: "その教科・学年に単元がありません" }, { status: 400 });
    }
    slots = pickRandomSlots(pool, count);
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
    slots = distributeCount(unitIds, count);
    testKey = buildTestKey(subject, unitIds);
  }

  if (kind === "math") {
    const items = slots.map((unitId, index) => {
      const p = generateProblem(unitId);
      return {
        index,
        unitId,
        prompt: p.prompt,
        answerType: p.answerType,
        answerToken: encodeToken({
          unitId,
          answer: p.answer,
          prompt: p.prompt,
          meta: p.meta ?? {},
        }),
      };
    });
    return NextResponse.json({ testKey, total: count, kind, items });
  }

  // quiz: 各スロットで1問選ぶ。同一テスト内の itemId 重複はできるだけ避け、
  // 単元の在庫が尽きたら、今回のスロット由来の単元集合から補充する。
  // slots は random でも非 random でも「検証済みの実在単元」なので、
  // ここから補充すれば教科整合（testKey の許容単元）を崩さない。
  const candidatePool = Array.from(new Set(slots));

  // 「使用済み」は 単元:問題id の複合キーで管理する。
  // 旧単元は問題idが "q1..q6" を使い回すため、id だけで判定すると別単元の
  // 別問題まで重複扱いになってしまう（＝出題が偏る）。複合キーで正しく区別する。
  const usedKeys = new Set<string>();
  const keyOf = (unitId: string, itemId: string) => `${unitId}:${itemId}`;
  const items: Array<{
    index: number;
    unitId: string;
    itemId: string;
    question: string;
    choices: string[];
    token: string;
  }> = [];

  for (let index = 0; index < slots.length; index++) {
    // 候補単元の並び：まず本来のスロット単元、続けてプール内の他単元（重複回避の補充用）。
    const primary = slots[index];
    const order = [primary, ...candidatePool.filter((u) => u !== primary)];

    let placed = false;
    for (const unitId of order) {
      const unit = getQuizUnit(unitId);
      if (!unit || unit.items.length === 0) continue;

      // この単元でまだ使っていない item を優先。全部使い切っていれば重複を許容。
      const unused = unit.items.filter(
        (it) => !usedKeys.has(keyOf(unitId, it.id)),
      );
      const source = unused.length > 0 ? unused : unit.items;
      const chosen = source[Math.floor(Math.random() * source.length)];

      usedKeys.add(keyOf(unitId, chosen.id));
      items.push({
        index,
        unitId,
        itemId: chosen.id,
        question: chosen.question,
        choices: chosen.choices,
        token: encodeQuizToken({
          unitId,
          itemId: chosen.id,
          answerIndex: chosen.answerIndex,
        }),
      });
      placed = true;
      break;
    }

    // どの単元からも取れない（理論上プール検証済みなので起きないが）安全側フォールバック。
    if (!placed) {
      const picked = pickQuestion(primary);
      if (picked) {
        const unit = getQuizUnit(primary)!;
        const it = unit.items.find((i) => i.id === picked.itemId)!;
        items.push({
          index,
          unitId: primary,
          itemId: it.id,
          question: it.question,
          choices: it.choices,
          token: encodeQuizToken({
            unitId: primary,
            itemId: it.id,
            answerIndex: it.answerIndex,
          }),
        });
      }
    }
  }

  return NextResponse.json({ testKey, total: count, kind, items });
}
