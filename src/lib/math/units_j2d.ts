// 中2数学 追加分（生成AI不使用・答えはコード確定）。
// すべての答えはコードで計算して確定させ、数値系（integer/decimal/fraction）でのみ答える。
// 各 def は generate と diagnose を内包し、監督が index で束ねる（このファイルは index.ts を編集しない）。

import type { Problem, UnitDef } from "@/lib/math/types";
import { formatFraction, formatDecimal, gcd } from "@/lib/math/units";

// gcd は将来の単元拡張のために import 済み。未使用警告を避ける軽い参照（副作用なし）。
void gcd;

// ------------------------------------------------------------------
// 型
// ------------------------------------------------------------------

/** generate に加えて diagnose を内包した単元定義。 */
export type DiagUnitDef = UnitDef & {
  diagnose: (problem: Problem, userInput: string) => string | null;
};

// ------------------------------------------------------------------
// 数値ユーティリティ（このファイル内で自己完結）
// ------------------------------------------------------------------

/** min〜max（両端含む）の整数を返す。 */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 0を除く min〜max の整数を返す（係数などに使う）。 */
function randNonZero(min: number, max: number): number {
  let v = 0;
  while (v === 0) v = randInt(min, max);
  return v;
}

/** 配列からランダムに1つ選ぶ。 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ------------------------------------------------------------------
// 表示ヘルパ
// ------------------------------------------------------------------

/** 係数付きの一次項を「2x」「-x」「x」の形にする（係数±1を省略）。 */
function coefTerm(coef: number, v: string): string {
  if (coef === 1) return v;
  if (coef === -1) return `-${v}`;
  return `${coef}${v}`;
}

/** 「+ b」「- b」の形の定数項（0は空文字）。 */
function constTerm(b: number): string {
  if (b === 0) return "";
  return b > 0 ? ` + ${b}` : ` - ${-b}`;
}

/** 式 ax + b（x の名前指定可）を人が読める形にする。 */
function linearExpr(a: number, b: number, v = "x"): string {
  const head = coefTerm(a, v);
  return `${head}${constTerm(b)}`;
}

// ------------------------------------------------------------------
// 入力正規化（診断用・軽量）
// ------------------------------------------------------------------

/** 全角→半角の最低限の変換。 */
function toHalfWidthLite(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[／]/g, "/")
    .replace(/[．。]/g, ".")
    .replace(/[：]/g, ":")
    .replace(/[－―ー−]/g, "-");
}

/** 診断用に入力から数式文字だけを取り出す（空白除去）。 */
function cleanInput(raw: string): string {
  return toHalfWidthLite(raw)
    .replace(/[^0-9./:\- ]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/** 分数/整数/小数文字列を数値化。失敗時 null。 */
function toNumber(s: string): number | null {
  if (s === "") return null;
  const frac = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    return Number(frac[1]) / den;
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return null;
}

/** 数値の近似一致（分数・小数の丸め誤差に耐える）。 */
function near(a: number | null, b: number): boolean {
  return a !== null && Math.abs(a - b) < 1e-9;
}

/** meta を安全に取り出す。 */
function mm(meta: Record<string, number> | undefined, key: string, fallback = NaN): number {
  const v = meta?.[key];
  return typeof v === "number" ? v : fallback;
}

// ==================================================================
// j2dm-subst : 式の値（代入）
// ==================================================================
//
// 単項式・多項式に x, y を代入して数値を求める。答えは integer。

function genSubst(): Problem {
  const mode = pick(["mono", "poly"] as const);
  const xv = randNonZero(-5, 5);

  if (mode === "mono") {
    // a x + b の1変数式に代入。
    const a = randNonZero(-6, 6);
    const b = randInt(-9, 9);
    const value = a * xv + b;
    return {
      unitId: "j2dm-subst",
      prompt: `x = ${xv} のとき、${linearExpr(a, b)} の値を求めよ。`,
      answer: String(value),
      answerType: "integer",
      // mode: 0=1変数, 1=2変数。
      meta: { mode: 0, a, b, xv, value },
    };
  }

  // a x + b y の2変数式に代入。
  const a = randNonZero(-6, 6);
  const b = randNonZero(-6, 6);
  const yv = randNonZero(-5, 5);
  const value = a * xv + b * yv;
  return {
    unitId: "j2dm-subst",
    prompt: `x = ${xv}, y = ${yv} のとき、${coefTerm(a, "x")} ${
      b > 0 ? "+ " + coefTerm(b, "y") : "- " + coefTerm(-b, "y")
    } の値を求めよ。`,
    answer: String(value),
    answerType: "integer",
    meta: { mode: 1, a, b, xv, yv, value },
  };
}

function diagSubst(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const xv = mm(meta, "xv");
  if ([mode, a, b, xv].some(Number.isNaN)) return null;

  if (mode === 0) {
    const correct = a * xv + b;
    // 定数 b をたし忘れた。
    const wrong = a * xv;
    if (wrong !== correct && near(val, wrong)) {
      return "定数 " + `${b}` + " を たすのを わすれたみたい。ax + b の + b も 計算してね。";
    }
    return null;
  }

  // mode === 1（2変数）。
  const yv = mm(meta, "yv");
  if (Number.isNaN(yv)) return null;
  const correct = a * xv + b * yv;
  // x と y の値を取りちがえて代入した。
  const swapped = a * yv + b * xv;
  if (swapped !== correct && near(val, swapped)) {
    return "x と y の 値を 取りちがえて 代入したみたい。x のところに x の値、y のところに y の値を 入れてね。";
  }
  return null;
}

// ==================================================================
// j2dm-simeq-add : 連立方程式（加減法）で x の値
// ==================================================================
//
// 解 (x, y) を先に整数で決め、係数を与えて2式を作る。答えは x（integer）。

function genSimeqAdd(): Problem {
  const x = randInt(-6, 6);
  const y = randInt(-6, 6);
  const a1 = randNonZero(1, 5);
  const b1 = randNonZero(1, 5);
  let a2 = randNonZero(1, 5);
  let b2 = randNonZero(1, 5);
  // 一意解を保証：行列式 ≠ 0。
  let guard = 0;
  while (a1 * b2 - a2 * b1 === 0 && guard < 100) {
    a2 = randNonZero(1, 5);
    b2 = randNonZero(1, 5);
    guard++;
  }
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  return {
    unitId: "j2dm-simeq-add",
    prompt: `連立方程式\n${linearExpr(a1, 0)} + ${coefTerm(b1, "y")} = ${c1}\n${linearExpr(
      a2,
      0,
    )} + ${coefTerm(b2, "y")} = ${c2}\nを解いて、x の値を求めよ。`,
    answer: String(x),
    answerType: "integer",
    meta: { a1, b1, c1, a2, b2, c2, x, y },
  };
}

function diagSimeqAdd(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const x = mm(meta, "x");
  const y = mm(meta, "y");
  if ([x, y].some(Number.isNaN)) return null;
  // y の値を答えてしまった（x と y の取りちがえ）。
  if (y !== x && near(val, y)) {
    return "きかれているのは x の値だよ。y の値と 取りちがえていないか たしかめてね。";
  }
  return null;
}

// ==================================================================
// j2dm-simeq-sub : 連立方程式（代入法）で y の値
// ==================================================================
//
// y = m x + n 型の1式と、a x + b y = c 型の1式。答えは y（integer）。

function genSimeqSub(): Problem {
  const x = randInt(-6, 6);
  const m = randNonZero(-4, 4);
  const n = randInt(-8, 8);
  const y = m * x + n; // y = m x + n を満たす
  // もう1式：a x + b y = c。b ≠ 0 で y が代入で消せる形。
  const a = randNonZero(1, 5);
  let b = randNonZero(1, 5);
  // 代入後の x の係数 (a + b*m) が 0 だと解が一意に定まらない（不定）。0を避ける。
  let guard = 0;
  while (a + b * m === 0 && guard < 100) {
    b = randNonZero(1, 5);
    guard++;
  }
  const c = a * x + b * y;
  return {
    unitId: "j2dm-simeq-sub",
    prompt: `連立方程式\ny = ${linearExpr(m, n)}\n${coefTerm(a, "x")} + ${coefTerm(
      b,
      "y",
    )} = ${c}\nを解いて、y の値を求めよ。`,
    answer: String(y),
    answerType: "integer",
    meta: { m, n, a, b, c, x, y },
  };
}

function diagSimeqSub(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const x = mm(meta, "x");
  const y = mm(meta, "y");
  if ([x, y].some(Number.isNaN)) return null;
  // x の値を答えてしまった（x と y の取りちがえ）。
  if (x !== y && near(val, x)) {
    return "きかれているのは y の値だよ。先に 出した x の値と 取りちがえていないか たしかめてね。";
  }
  return null;
}

// ==================================================================
// j2dm-func-rate : 一次関数の変化の割合
// ==================================================================
//
// y = ax + b で x が p→q のときの変化の割合（= a）を問う。答えは integer。

function genFuncRate(): Problem {
  const a = randNonZero(-6, 6);
  const b = randInt(-9, 9);
  const p = randInt(-5, 3);
  const dx = randInt(1, 6);
  const q = p + dx;
  const yp = a * p + b;
  const yq = a * q + b;
  return {
    unitId: "j2dm-func-rate",
    prompt: `一次関数 y = ${linearExpr(a, b)} で、x が ${p} から ${q} まで変わるときの変化の割合を求めよ。`,
    answer: String(a),
    answerType: "integer",
    // 変化の割合 = (yq - yp)/(q - p) = a。
    meta: { a, b, p, q, yp, yq, dx },
  };
}

function diagFuncRate(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const p = mm(meta, "p");
  const q = mm(meta, "q");
  const yp = mm(meta, "yp");
  const yq = mm(meta, "yq");
  if ([a, b, p, q, yp, yq].some(Number.isNaN)) return null;

  // 切片 b を答えてしまった。
  if (b !== a && near(val, b)) {
    return "変化の割合は 傾き a のことだよ。切片 b と 取りちがえていないか たしかめてね。";
  }
  // 増加量の引き算の向きを逆にした（(yp - yq)/(q - p) = -a）。
  const reversed = (yp - yq) / (q - p);
  if (reversed !== a && near(val, reversed)) {
    return "y の増加量の 引き算の 向きが 逆になっているみたい。(あとの y − さきの y) ÷ (あとの x − さきの x) だよ。";
  }
  // y の増加量そのものを答えてしまった（÷ x増加量 を忘れた）。
  if (yq - yp !== a && near(val, yq - yp)) {
    return "それは y の 増加量だね。変化の割合は それを x の増加量（" + `${q - p}` + "）で わるよ。";
  }
  return null;
}

// ==================================================================
// j2dm-func-value : 一次関数の値
// ==================================================================
//
// y = ax + b に x を代入して y を求める。答えは integer。

function genFuncValue(): Problem {
  const a = randNonZero(-6, 6);
  const b = randInt(-9, 9);
  const xv = randInt(-6, 6);
  const y = a * xv + b;
  return {
    unitId: "j2dm-func-value",
    prompt: `一次関数 y = ${linearExpr(a, b)} について、x = ${xv} のときの y の値を求めよ。`,
    answer: String(y),
    answerType: "integer",
    meta: { a, b, xv, y },
  };
}

function diagFuncValue(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const xv = mm(meta, "xv");
  if ([a, b, xv].some(Number.isNaN)) return null;
  const correct = a * xv + b;
  // 切片 b をたし忘れ（a*x のみ）。
  const wrong = a * xv;
  if (wrong !== correct && near(val, wrong)) {
    return "切片 " + `${b}` + " を たすのを わすれたみたい。y = ax + b の + b も 計算してね。";
  }
  // 傾きと切片を取りちがえて b*x + a とした。
  const swapped = b * xv + a;
  if (swapped !== correct && near(val, swapped)) {
    return "傾き a と 切片 b を 取りちがえたみたい。x に かけるのは 傾き a だよ。";
  }
  return null;
}

// ==================================================================
// j2dm-func-find : 一次関数の式決定（切片 b を問う）
// ==================================================================
//
// 傾きと1点、または2点から式 y = ax + b を求め、切片 b を答える。答えは integer。

function genFuncFind(): Problem {
  const mode = pick(["slopePoint", "twoPoints"] as const);
  const a = randNonZero(-5, 5);
  const b = randInt(-9, 9);

  if (mode === "slopePoint") {
    // 傾き a と 通る1点 (x1, y1)。
    const x1 = randInt(-5, 5);
    const y1 = a * x1 + b;
    return {
      unitId: "j2dm-func-find",
      prompt: `傾きが ${a} で、点 (${x1}, ${y1}) を通る一次関数 y = ax + b の 切片 b を求めよ。`,
      answer: String(b),
      answerType: "integer",
      // mode: 0=傾き+1点, 1=2点。
      meta: { mode: 0, a, b, x1, y1 },
    };
  }

  // 2点 (x1, y1), (x2, y2)。x1 ≠ x2。
  const x1 = randInt(-5, 2);
  const dx = randInt(1, 6);
  const x2 = x1 + dx;
  const y1 = a * x1 + b;
  const y2 = a * x2 + b;
  return {
    unitId: "j2dm-func-find",
    prompt: `2点 (${x1}, ${y1}) と (${x2}, ${y2}) を通る一次関数 y = ax + b の 切片 b を求めよ。`,
    answer: String(b),
    answerType: "integer",
    meta: { mode: 1, a, b, x1, y1, x2, y2 },
  };
}

function diagFuncFind(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  if ([a, b].some(Number.isNaN)) return null;
  // 傾き a を答えてしまった（切片と傾きの取りちがえ）。
  if (a !== b && near(val, a)) {
    return "きかれているのは 切片 b だよ。傾き a と 取りちがえていないか たしかめてね。";
  }
  const mode = mm(meta, "mode");
  if (mode === 0) {
    // 通る点の y 座標をそのまま答えた。
    const y1 = mm(meta, "y1");
    if (!Number.isNaN(y1) && y1 !== b && near(val, y1)) {
      return "点の y 座標を そのまま 答えたみたい。b は y = ax + b に 点を 代入して 求めるよ。";
    }
  }
  return null;
}

// ==================================================================
// j2dm-intersect : 2直線の交点の x 座標
// ==================================================================
//
// 交点 (x, y) を先に整数で決め、傾きの異なる2式を作る。答えは x（integer）。

function genIntersect(): Problem {
  const x = randInt(-5, 5);
  const y = randInt(-8, 8);
  const a1 = randNonZero(-5, 5);
  let a2 = randNonZero(-5, 5);
  // 傾きが異なる（交点が一意）。
  let guard = 0;
  while (a2 === a1 && guard < 50) {
    a2 = randNonZero(-5, 5);
    guard++;
  }
  const b1 = y - a1 * x; // 直線1が (x,y) を通る
  const b2 = y - a2 * x; // 直線2が (x,y) を通る
  return {
    unitId: "j2dm-intersect",
    prompt: `2直線 y = ${linearExpr(a1, b1)} と y = ${linearExpr(
      a2,
      b2,
    )} の 交点の x 座標を求めよ。`,
    answer: String(x),
    answerType: "integer",
    meta: { a1, b1, a2, b2, x, y },
  };
}

function diagIntersect(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const x = mm(meta, "x");
  const y = mm(meta, "y");
  if ([x, y].some(Number.isNaN)) return null;
  // 交点の y 座標を答えてしまった。
  if (y !== x && near(val, y)) {
    return "きかれているのは 交点の x 座標だよ。y 座標と 取りちがえていないか たしかめてね。";
  }
  return null;
}

// ==================================================================
// j2dm-polygon-angle : 多角形の内角・外角
// ==================================================================
//
// n角形の内角の和、正n角形の1つの内角、1つの外角のいずれか。答えは integer。

function genPolygonAngle(): Problem {
  const mode = pick(["sum", "interior", "exterior"] as const);

  if (mode === "sum") {
    // 内角の和 = (n - 2) × 180。
    const n = randInt(3, 12);
    const sum = (n - 2) * 180;
    return {
      unitId: "j2dm-polygon-angle",
      prompt: `${n}角形の 内角の和は 何度？`,
      answer: String(sum),
      answerType: "integer",
      // mode: 0=内角の和, 1=正n角形の1つの内角, 2=正n角形の1つの外角。
      meta: { mode: 0, n, sum },
    };
  }

  // 正多角形：内角・外角が整数になる n を選ぶ（360の約数、かつ内角も整数）。
  const n = pick([3, 4, 5, 6, 8, 9, 10, 12] as const);
  const ext = 360 / n; // 1つの外角
  const interior = 180 - ext; // 1つの内角

  if (mode === "interior") {
    return {
      unitId: "j2dm-polygon-angle",
      prompt: `正${n}角形の 1つの内角の 大きさは 何度？`,
      answer: String(interior),
      answerType: "integer",
      meta: { mode: 1, n, ext, interior },
    };
  }

  return {
    unitId: "j2dm-polygon-angle",
    prompt: `正${n}角形の 1つの外角の 大きさは 何度？`,
    answer: String(ext),
    answerType: "integer",
    meta: { mode: 2, n, ext, interior },
  };
}

function diagPolygonAngle(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const n = mm(meta, "n");
  if ([mode, n].some(Number.isNaN)) return null;

  if (mode === 0) {
    const correct = (n - 2) * 180;
    // 「− 2」を忘れて n × 180 とした。
    if (n * 180 !== correct && near(val, n * 180)) {
      return "(n − 2) の「− 2」を わすれたみたい。三角形が (n − 2) 個 できるから ×180 だよ。";
    }
    // (n − 1) × 180 としてしまった。
    if ((n - 1) * 180 !== correct && near(val, (n - 1) * 180)) {
      return "(n − 2) の 2 を 1 に してしまったみたい。三角形は (n − 2) 個 だよ。";
    }
    // 外角の和 360 と取りちがえ。
    if (correct !== 360 && near(val, 360)) {
      return "それは「外角の和」だね。内角の和は (n − 2) × 180 で 計算するよ。";
    }
    return null;
  }

  const ext = mm(meta, "ext");
  const interior = mm(meta, "interior");
  if ([ext, interior].some(Number.isNaN)) return null;

  if (mode === 1) {
    // 内角を問われて外角を答えた。
    if (ext !== interior && near(val, ext)) {
      return "それは 1つの「外角」だね。1つの内角は 180 − 外角 で 求めるよ。";
    }
    return null;
  }

  // mode === 2：外角を問われて内角を答えた。
  if (interior !== ext && near(val, interior)) {
    return "それは 1つの「内角」だね。1つの外角は 360 ÷ n で 求めるよ（外角の和は 360°）。";
  }
  return null;
}

// ==================================================================
// j2dm-parallelogram : 平行四辺形・二等辺三角形の角
// ==================================================================
//
// 平行四辺形の性質（対角は等しい・となり合う角の和は180°）、
// 二等辺三角形の性質（底角は等しい・内角の和180°）を使って角を求める。答えは integer。

function genParallelogram(): Problem {
  const mode = pick(["paraOpp", "paraAdj", "isoBase", "isoApex"] as const);

  if (mode === "paraOpp") {
    // 平行四辺形で ∠A が与えられ、対角 ∠C を問う（∠C = ∠A）。
    const a = randInt(35, 145);
    return {
      unitId: "j2dm-parallelogram",
      prompt: `平行四辺形 ABCD で ∠A = ${a}° のとき、∠C の 大きさは 何度？`,
      answer: String(a),
      answerType: "integer",
      // mode: 0=平行四辺形の対角, 1=平行四辺形のとなり角, 2=二等辺の底角, 3=二等辺の頂角。
      meta: { mode: 0, a, ans: a },
    };
  }

  if (mode === "paraAdj") {
    // 平行四辺形で ∠A が与えられ、となり合う ∠B を問う（∠B = 180 − ∠A）。
    const a = randInt(35, 145);
    const ans = 180 - a;
    return {
      unitId: "j2dm-parallelogram",
      prompt: `平行四辺形 ABCD で ∠A = ${a}° のとき、∠B の 大きさは 何度？`,
      answer: String(ans),
      answerType: "integer",
      meta: { mode: 1, a, ans },
    };
  }

  if (mode === "isoBase") {
    // 二等辺三角形で頂角が与えられ、底角を問う（底角 = (180 − 頂角) / 2）。整数化。
    let apex = randInt(20, 140);
    if (apex % 2 !== 0) apex += 1; // (180 - apex) を偶数に
    const base = (180 - apex) / 2;
    return {
      unitId: "j2dm-parallelogram",
      prompt: `二等辺三角形で 頂角が ${apex}° のとき、1つの底角の 大きさは 何度？`,
      answer: String(base),
      answerType: "integer",
      meta: { mode: 2, apex, base },
    };
  }

  // 二等辺三角形で底角が与えられ、頂角を問う（頂角 = 180 − 2×底角、正になる範囲）。
  const base = randInt(30, 80);
  const apex = 180 - 2 * base;
  return {
    unitId: "j2dm-parallelogram",
    prompt: `二等辺三角形で 1つの底角が ${base}° のとき、頂角の 大きさは 何度？`,
    answer: String(apex),
    answerType: "integer",
    meta: { mode: 3, base, apex },
  };
}

function diagParallelogram(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  if (Number.isNaN(mode)) return null;

  if (mode === 0) {
    // 対角を問われて、となり角 180 − ∠A を答えた。
    const a = mm(meta, "a");
    if (Number.isNaN(a)) return null;
    if (180 - a !== a && near(val, 180 - a)) {
      return "対角（向かい合う角）は 等しいよ。∠C = ∠A だね。となり合う角と 取りちがえていないかな。";
    }
    return null;
  }

  if (mode === 1) {
    // となり角を問われて、対角 ∠A（等しい方）を答えた。
    const a = mm(meta, "a");
    if (Number.isNaN(a)) return null;
    if (a !== 180 - a && near(val, a)) {
      return "となり合う角の 和は 180° だよ。∠B = 180 − ∠A だね。対角と 取りちがえていないかな。";
    }
    return null;
  }

  if (mode === 2) {
    // 底角を問われて、÷2 を忘れ (180 − 頂角) を答えた。
    const apex = mm(meta, "apex");
    if (Number.isNaN(apex)) return null;
    const base = (180 - apex) / 2;
    if (180 - apex !== base && near(val, 180 - apex)) {
      return "底角は 2つ 等しいから、(180 − 頂角) を さらに 2で わるよ。÷2 を わすれていないかな。";
    }
    return null;
  }

  // mode === 3：頂角を問われて、底角の 2倍を忘れ 180 − 底角 を答えた。
  const base = mm(meta, "base");
  if (Number.isNaN(base)) return null;
  const apex = 180 - 2 * base;
  if (180 - base !== apex && near(val, 180 - base)) {
    return "底角は 2つ あるよ。頂角 = 180 − 底角 × 2 だね。底角を 2倍するのを わすれていないかな。";
  }
  return null;
}

// ==================================================================
// j2dm-quartile : 四分位数・四分位範囲・範囲
// ==================================================================
//
// データ列を与え、第1/第2/第3四分位数、四分位範囲、範囲のどれかを問う。
// answer は integer/decimal（中央値は .5 が出うるので formatDecimal）。

/** ソート済み配列の中央値（偶数個なら平均で .5 が出うる）。 */
function medianOf(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/** 四分位数（Q1, Q2, Q3）を「中央値で前半・後半に分ける」日本の教科書方式で計算。 */
function quartiles(sorted: number[]): { q1: number; q2: number; q3: number } {
  const n = sorted.length;
  const q2 = medianOf(sorted);
  const half = Math.floor(n / 2);
  // 奇数個のときは中央値を含めず前後 half 個ずつに分ける。
  const lower = sorted.slice(0, half);
  const upper = sorted.slice(n - half);
  const q1 = medianOf(lower);
  const q3 = medianOf(upper);
  return { q1, q2, q3 };
}

function genQuartile(): Problem {
  // データ個数は 7〜10。値は 1〜40 の相異なる整数（重複可でも良いが分位が見やすいよう分散）。
  const size = randInt(7, 10);
  const set = new Set<number>();
  while (set.size < size) set.add(randInt(1, 40));
  const data = Array.from(set);
  // 出題は元の（シャッフルされた）順で見せる。
  const shuffled = [...data];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const sorted = [...data].sort((a, b) => a - b);
  const { q1, q2, q3 } = quartiles(sorted);
  const range = sorted[sorted.length - 1] - sorted[0];
  const iqr = q3 - q1;

  const ask = pick(["q1", "q2", "q3", "iqr", "range"] as const);
  const labelMap: Record<typeof ask, string> = {
    q1: "第1四分位数",
    q2: "第2四分位数（中央値）",
    q3: "第3四分位数",
    iqr: "四分位範囲",
    range: "範囲",
  };
  const valueMap: Record<typeof ask, number> = { q1, q2, q3, iqr, range };
  const answerVal = valueMap[ask];
  // q1/q2/q3/iqr は .5 が出うるので decimal 表現、range は整数。
  const answerType = Number.isInteger(answerVal) ? "integer" : "decimal";

  return {
    unitId: "j2dm-quartile",
    prompt: `次のデータの ${labelMap[ask]} を求めよ。\n${shuffled.join(", ")}`,
    answer: answerType === "integer" ? String(answerVal) : formatDecimal(answerVal),
    answerType,
    // ask: 0=q1,1=q2,2=q3,3=iqr,4=range。
    meta: {
      ask: ["q1", "q2", "q3", "iqr", "range"].indexOf(ask),
      q1,
      q2,
      q3,
      iqr,
      range,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      size,
    },
  };
}

function diagQuartile(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const ask = mm(meta, "ask");
  const q1 = mm(meta, "q1");
  const q2 = mm(meta, "q2");
  const q3 = mm(meta, "q3");
  const iqr = mm(meta, "iqr");
  const range = mm(meta, "range");
  if ([ask, q1, q2, q3, iqr, range].some(Number.isNaN)) return null;

  if (ask === 3) {
    // 四分位範囲を問われて、範囲（最大−最小）を答えた。
    if (range !== iqr && near(val, range)) {
      return "四分位範囲は 第3四分位数 − 第1四分位数 だよ。（最大 − 最小）の「範囲」と 取りちがえていないかな。";
    }
    return null;
  }
  if (ask === 4) {
    // 範囲を問われて、四分位範囲を答えた。
    if (iqr !== range && near(val, iqr)) {
      return "範囲は 最大の値 − 最小の値 だよ。四分位範囲（Q3 − Q1）と 取りちがえていないかな。";
    }
    return null;
  }
  // Q1/Q2/Q3 のとき、別の四分位数を答えていないか軽く指摘。
  if (ask === 0 && near(val, q2)) {
    return "それは 中央値（第2四分位数）だね。第1四分位数は データの 前半の 中央値だよ。";
  }
  if (ask === 2 && near(val, q2)) {
    return "それは 中央値（第2四分位数）だね。第3四分位数は データの 後半の 中央値だよ。";
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_J2D: UnitDef[] = [
  {
    id: "j2dm-subst",
    grade: "中2",
    title: "式の値（代入）",
    lesson:
      "式に 文字の 値を あてはめて 計算することを「代入」といいます。まず 文字の ところに 数を あてはめ、次に 計算します。負の数を 代入するときは かっこを つけて 計算すると まちがえにくくなります。",
    hint: "x や y の ところに、あたえられた 数を そのまま あてはめてみよう。負の数は かっこを つけて 代入すると 安心だよ。",
    answerType: "integer",
    generate: genSubst,
    diagnose: diagSubst,
  },
  {
    id: "j2dm-simeq-add",
    grade: "中2",
    title: "連立方程式（加減法）",
    lesson:
      "連立方程式は、2つの式から 1つの文字を 消して 解きます。加減法では、片方の文字の 係数を そろえて、2式を たすか ひくかで 1文字を 消します。残った 1文字の 方程式を 解いてから もう一方を 求めます。",
    hint: "まず x か y の 係数を そろえよう。係数が そろったら、2つの式を たすか ひくかで 片方の 文字を 消せるよ。",
    answerType: "integer",
    generate: genSimeqAdd,
    diagnose: diagSimeqAdd,
  },
  {
    id: "j2dm-simeq-sub",
    grade: "中2",
    title: "連立方程式（代入法）",
    lesson:
      "「y = …」の形の式が あるときは、代入法が べんりです。その 式を もう一方の 式の y に そのまま 代入すると、x だけの 方程式に なります。x を 求めてから、y = … に もどして y を 計算します。",
    hint: "「y = …」の 右がわを、もう一方の 式の y に そっくり 代入しよう。まず x が 求まるよ。",
    answerType: "integer",
    generate: genSimeqSub,
    diagnose: diagSimeqSub,
  },
  {
    id: "j2dm-func-rate",
    grade: "中2",
    title: "一次関数の変化の割合",
    lesson:
      "一次関数 y = ax + b の 変化の割合は、(y の増加量) ÷ (x の増加量) で 求めます。これは いつも 傾き a に 等しく なります。増加量は「あとの値 − さきの値」で 計算します。",
    hint: "変化の割合 = y の増加量 ÷ x の増加量 だよ。引き算は「あとの値 − さきの値」で そろえてね。",
    answerType: "integer",
    generate: genFuncRate,
    diagnose: diagFuncRate,
  },
  {
    id: "j2dm-func-value",
    grade: "中2",
    title: "一次関数の値",
    lesson:
      "一次関数 y = ax + b に x の 値を 代入すると、対応する y の 値が 求まります。まず a に x を かけ、そのあと b を たします。負の数の 代入は かっこを つけると 安心です。",
    hint: "y = ax + b の x に 数を 代入しよう。a × x を してから + b を するよ。",
    answerType: "integer",
    generate: genFuncValue,
    diagnose: diagFuncValue,
  },
  {
    id: "j2dm-func-find",
    grade: "中2",
    title: "一次関数の式を求める",
    lesson:
      "一次関数の 式 y = ax + b は、傾き a と 切片 b が わかれば 決まります。傾きと 通る1点が わかれば、点を 代入して b を 求めます。2点が わかれば、まず 傾き a を 求め、次に b を 求めます。",
    hint: "まず 傾き a を おさえよう。通る点を y = ax + b に 代入すると、切片 b が 求められるよ。",
    answerType: "integer",
    generate: genFuncFind,
    diagnose: diagFuncFind,
  },
  {
    id: "j2dm-intersect",
    grade: "中2",
    title: "2直線の交点",
    lesson:
      "2直線の 交点は、2つの 式を 連立方程式として 解いた 解に なります。y が 等しく なるので、右がわどうしを = で つなぐと x の 方程式に なります。x を 求めてから y を 求めます。",
    hint: "2つの y = … の 右がわどうしを = で つないでみよう。すると x の 方程式に なるよ。",
    answerType: "integer",
    generate: genIntersect,
    diagnose: diagIntersect,
  },
  {
    id: "j2dm-polygon-angle",
    grade: "中2",
    title: "多角形の内角・外角",
    lesson:
      "n角形の 内角の和は (n − 2) × 180° です。どんな 多角形でも 外角の和は いつも 360° に なります。正n角形では、1つの外角は 360 ÷ n、1つの内角は 180 − 外角 で 求められます。",
    hint: "内角の和は (n − 2) × 180 だよ。正多角形なら 1つの外角は 360 ÷ n、内角は 180 − 外角 で 求まるよ。",
    answerType: "integer",
    generate: genPolygonAngle,
    diagnose: diagPolygonAngle,
  },
  {
    id: "j2dm-parallelogram",
    grade: "中2",
    title: "平行四辺形・二等辺三角形の角",
    lesson:
      "平行四辺形では、向かい合う角（対角）は 等しく、となり合う角の 和は 180° です。二等辺三角形では、2つの 底角が 等しく、内角の和は 180° です。これらの 性質を 使うと 角を 求められます。",
    hint: "平行四辺形は 対角が 等しく、となり角の 和が 180°。二等辺三角形は 底角が 等しいよ。どの 性質を 使うか えらんでね。",
    answerType: "integer",
    generate: genParallelogram,
    diagnose: diagParallelogram,
  },
  {
    id: "j2dm-quartile",
    grade: "中2",
    title: "四分位数・四分位範囲",
    lesson:
      "データを 小さい順に ならべ、中央値を 第2四分位数と いいます。前半の 中央値が 第1四分位数、後半の 中央値が 第3四分位数です。四分位範囲は 第3四分位数 − 第1四分位数、範囲は 最大 − 最小です。",
    hint: "まず データを 小さい順に ならべよう。まん中が 第2四分位数、前半・後半の まん中が 第1・第3四分位数だよ。",
    answerType: "integer",
    generate: genQuartile,
    diagnose: diagQuartile,
  },
];
