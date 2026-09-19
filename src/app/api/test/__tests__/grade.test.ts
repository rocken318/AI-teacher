import { expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { encodeToken } from "@/lib/math/token";

/**
 * /api/test/grade のルートテスト。
 * - 実 DB 不要のケースは childId を渡さず、保存/履歴分岐をスキップする。
 * - 正解/不正解を決めるため、既知の answer でトークンを自前生成する
 *   （div-basic は answerType: integer）。
 */

const UNIT = "div-basic";

/** JSON ボディから NextRequest 相当の Request を作る。 */
function makeReq(payload: unknown): Request {
  return new Request("http://localhost/api/test/grade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** 正解する解答（userInput が token の answer と一致）。 */
function correctAnswer(answer: string) {
  return {
    unitId: UNIT,
    answerToken: encodeToken({ unitId: UNIT, answer, prompt: "1+1", meta: {} }),
    userInput: answer,
  };
}

/** 不正解の解答（userInput が answer と不一致）。 */
function wrongAnswer(answer: string, userInput: string) {
  return {
    unitId: UNIT,
    answerToken: encodeToken({ unitId: UNIT, answer, prompt: "1+1", meta: {} }),
    userInput,
  };
}

test("改ざんトークンはその item を correct:false にし、リクエスト全体は 200", async () => {
  const { POST } = await import("../grade/route");
  // 5問: 3問は正解、1問は答え間違い、1問は改ざんトークン。
  const answers = [
    correctAnswer("2"),
    correctAnswer("3"),
    wrongAnswer("9", "99999"),
    { unitId: UNIT, answerToken: "not-a-real-token!!", userInput: "4" },
    correctAnswer("8"),
  ];
  const res = await POST(
    makeReq({ subject: "math", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  // 改ざんトークンの item は correct:false。
  expect(body.items[3].correct).toBe(false);
  expect(body.items[3].expected).toBe("");
  // 答え間違いも false。
  expect(body.items[2].correct).toBe(false);
  // score は本当に正解した 3 問のみ。
  expect(body.score).toBe(3);
  expect(body.total).toBe(5);
});

test("childId 無しなら履歴/保存分岐をスキップ（isBest:false, prev/best は null）", async () => {
  const { POST } = await import("../grade/route");
  const answers = [
    correctAnswer("2"),
    correctAnswer("2"),
    correctAnswer("2"),
    correctAnswer("2"),
    correctAnswer("2"),
  ];
  const res = await POST(
    makeReq({ subject: "math", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body.score).toBe(5);
  expect(body.isBest).toBe(false);
  expect(body.prevScore).toBeNull();
  expect(body.prevTotal).toBeNull();
  expect(body.bestScore).toBeNull();
  expect(body.bestTotal).toBeNull();
});

test("answers.length が 5/10/20 以外なら 400", async () => {
  const { POST } = await import("../grade/route");
  const answers = [correctAnswer("2"), correctAnswer("2")]; // 2問
  const res = await POST(
    makeReq({ subject: "math", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("answers は 5 / 10 / 20 問");
});

test("answers の unitId が unitIds 外なら 400", async () => {
  const { POST } = await import("../grade/route");
  // 4問は div-basic、1問だけ別単元を申告（unitIds には含めない）。
  const answers = [
    correctAnswer("2"),
    correctAnswer("2"),
    correctAnswer("2"),
    correctAnswer("2"),
    { ...correctAnswer("2"), unitId: "dec-addsub" },
  ];
  const res = await POST(
    makeReq({ subject: "math", unitIds: [UNIT], answers }) as never,
  );
  expect(res.status).toBe(400);
  const body = await res.json();
  expect(body.error).toBe("answers の単元が unitIds と一致しません");
});

// --- childId ありの初回ケース（SQLite を使う。store.test.ts と同じ隔離パターン） ---
test("childId ありの初回テストは isBest:true / prev は null（SQLite）", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ai-sensei-grade-"));
  const prevDb = process.env.DATABASE_URL;
  const prevVercel = process.env.VERCEL;
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.SQLITE_PATH = join(dir, "t.db");
  vi.resetModules();
  try {
    const { POST } = await import("../grade/route");
    const answers = [
      correctAnswer("2"),
      correctAnswer("2"),
      correctAnswer("2"),
      wrongAnswer("2", "9"),
      wrongAnswer("2", "9"),
    ];
    const res = await POST(
      makeReq({
        subject: "math",
        unitIds: [UNIT],
        childId: "grade-test-child",
        answers,
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(3);
    expect(body.total).toBe(5);
    // 初回なので前回は無く、自己ベスト扱い。
    expect(body.prevScore).toBeNull();
    expect(body.prevTotal).toBeNull();
    expect(body.bestScore).toBeNull();
    expect(body.isBest).toBe(true);
  } finally {
    if (prevDb === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = prevDb;
    if (prevVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = prevVercel;
    delete process.env.SQLITE_PATH;
    rmSync(dir, { recursive: true, force: true });
    vi.resetModules();
  }
});
