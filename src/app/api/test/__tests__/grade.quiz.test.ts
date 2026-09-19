import { expect, test } from "vitest";
import { encodeQuizToken } from "@/lib/quiz/token";
import { getQuizUnit } from "@/lib/quiz";

/**
 * /api/test/grade のクイズ教科（science）ルートテスト。
 * - 実 DB 不要（childId を渡さない）。
 * - 正誤を決めるため、既知の answerIndex でトークンを自前生成する。
 * - 使う単元/問題は実在の science 単元から取る。
 */

const UNIT = "sci-4-electricity";

/** その単元の指定 itemId の問題（answerIndex を含む）を取り出す。 */
function itemOf(itemId: string) {
  const unit = getQuizUnit(UNIT);
  if (!unit) throw new Error("test fixture missing: " + UNIT);
  const it = unit.items.find((i) => i.id === itemId);
  if (!it) throw new Error("test fixture missing item: " + itemId);
  return it;
}

function makeReq(payload: unknown): Request {
  return new Request("http://localhost/api/test/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** 正しく採点される解答（token は正規、choiceIndex は指定）。 */
function answerFor(itemId: string, choiceIndex: number) {
  const it = itemOf(itemId);
  return {
    unitId: UNIT,
    itemId,
    token: encodeQuizToken({ unitId: UNIT, itemId, answerIndex: it.answerIndex }),
    choiceIndex,
  };
}

test("quiz 正常採点：正解/不正解が期待どおり・explanation が返る", async () => {
  const { POST } = await import("../grade/route");
  const it1 = itemOf("sci-4-electricity-1");
  const it2 = itemOf("sci-4-electricity-2");
  // 5問: 2問は正解の index、3問は誤った index。
  const wrong1 = (it1.answerIndex + 1) % it1.choices.length;
  const wrong2 = (it2.answerIndex + 1) % it2.choices.length;
  const answers = [
    answerFor("sci-4-electricity-1", it1.answerIndex), // 正解
    answerFor("sci-4-electricity-2", it2.answerIndex), // 正解
    answerFor("sci-4-electricity-1", wrong1), // 不正解
    answerFor("sci-4-electricity-2", wrong2), // 不正解
    answerFor("sci-4-electricity-1", wrong1), // 不正解
  ];
  const res = await POST(
    makeReq({ subject: "science", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.kind).toBe("quiz");
  expect(body.items[0].correct).toBe(true);
  expect(body.items[1].correct).toBe(true);
  expect(body.items[2].correct).toBe(false);
  expect(body.score).toBe(2);
  expect(body.total).toBe(5);
  // authored explanation が返る（正解時も文言あり）。
  expect(typeof body.items[0].explanation).toBe("string");
  expect(body.items[0].explanation.length).toBeGreaterThan(0);
});

test("改ざんトークンはその item を correct:false・全体は 200", async () => {
  const { POST } = await import("../grade/route");
  const it1 = itemOf("sci-4-electricity-1");
  // 5問正規のうち1問だけトークンを別 item の answerIndex にすり替える
  //（token 内 itemId が申告 itemId と食い違う → correct:false）。
  const tampered = {
    unitId: UNIT,
    itemId: "sci-4-electricity-1",
    // 別 item を指すトークン（unitId/itemId 不一致）。
    token: encodeQuizToken({
      unitId: UNIT,
      itemId: "sci-4-electricity-2",
      answerIndex: 0,
    }),
    choiceIndex: it1.answerIndex,
  };
  const answers = [
    answerFor("sci-4-electricity-1", it1.answerIndex),
    answerFor("sci-4-electricity-1", it1.answerIndex),
    answerFor("sci-4-electricity-1", it1.answerIndex),
    answerFor("sci-4-electricity-1", it1.answerIndex),
    tampered,
  ];
  const res = await POST(
    makeReq({ subject: "science", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  // 改ざん item は correct:false・answerIndex は露出しない(-1)。
  expect(body.items[4].correct).toBe(false);
  expect(body.items[4].answerIndex).toBe(-1);
  // 正規4問だけが得点。
  expect(body.score).toBe(4);
  expect(body.total).toBe(5);
});

test("answers.length が 5/10/20 以外なら 400", async () => {
  const { POST } = await import("../grade/route");
  const it1 = itemOf("sci-4-electricity-1");
  const answers = [
    answerFor("sci-4-electricity-1", it1.answerIndex),
    answerFor("sci-4-electricity-1", it1.answerIndex),
  ]; // 2問
  const res = await POST(
    makeReq({ subject: "science", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("answers は 5 / 10 / 20 問");
});

test("answer.unitId が unitIds 外なら 400", async () => {
  const { POST } = await import("../grade/route");
  const it1 = itemOf("sci-4-electricity-1");
  const good = answerFor("sci-4-electricity-1", it1.answerIndex);
  const answers = [
    good,
    good,
    good,
    good,
    { ...good, unitId: "sci-4-not-selected" }, // 選択外の単元
  ];
  const res = await POST(
    makeReq({ subject: "science", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("answers の単元が unitIds と一致しません");
});
