// 中1数学 追加分（生成AI不使用・答えはコード確定）。
// すべての答えはコードで計算して確定させ、数値系（integer/decimal）でのみ答える。
// 各 def は generate と diagnose を内包し、監督が index で束ねる（このファイルは index.ts を編集しない）。

import type { Problem, UnitDef } from "@/lib/math/types";
import { formatDecimal } from "@/lib/math/units";

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

/** 「+ b」「- b」の形の定数項（0は空文字）。 */
function constTerm(b: number): string {
  if (b === 0) return "";
  return b > 0 ? ` + ${b}` : ` - ${-b}`;
}

/** 係数付きの一次項を「2x」「-x」「x」の形にする（係数±1を省略）。 */
function coefTerm(coef: number, v: string): string {
  if (coef === 1) return v;
  if (coef === -1) return `-${v}`;
  return `${coef}${v}`;
}

/** 負の数は かっこ付きで表示する（例: -3 → (-3)）。 */
function paren(n: number): string {
  return n < 0 ? `(${n})` : String(n);
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

/** 2つの値が「別物」として扱えるか（誤答ヒントの誤爆防止）。 */
function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > 1e-9;
}

/** meta を安全に取り出す。 */
function mm(meta: Record<string, number> | undefined, key: string, fallback = NaN): number {
  const v = meta?.[key];
  return typeof v === "number" ? v : fallback;
}

// ==================================================================
// j1dm-abs-compare : 絶対値と数の大小
// ==================================================================
//
// 絶対値を求めるか、2つの数の大きいほう／小さいほうを答える。答えは integer。

function genAbsCompare(): Problem {
  const mode = pick(["abs", "larger", "smaller"] as const);

  if (mode === "abs") {
    const a = randNonZero(-15, 15);
    const ans = Math.abs(a);
    return {
      unitId: "j1dm-abs-compare",
      prompt: `${paren(a)} の 絶対値を 答えよ。`,
      answer: String(ans),
      answerType: "integer",
      // mode: 0=絶対値, 1=大きいほう, 2=小さいほう。
      meta: { mode: 0, a, ans },
    };
  }

  // 2数の大小。少なくとも片方は負にして、負の数の大小を必ず考えさせる。
  let a = randInt(-12, 12);
  let b = randInt(-12, 12);
  let guard = 0;
  while ((a === b || (a > 0 && b > 0)) && guard < 200) {
    a = randInt(-12, 12);
    b = randInt(-12, 12);
    guard++;
  }
  if (a === b) b = a + 1; // 念のための保険（無限ループ回避後）

  if (mode === "larger") {
    const ans = Math.max(a, b);
    return {
      unitId: "j1dm-abs-compare",
      prompt: `${paren(a)} と ${paren(b)} では、どちらが 大きいか。大きいほうの 数を 答えよ。`,
      answer: String(ans),
      answerType: "integer",
      meta: { mode: 1, a, b, ans },
    };
  }

  const ans = Math.min(a, b);
  return {
    unitId: "j1dm-abs-compare",
    prompt: `${paren(a)} と ${paren(b)} では、どちらが 小さいか。小さいほうの 数を 答えよ。`,
    answer: String(ans),
    answerType: "integer",
    meta: { mode: 2, a, b, ans },
  };
}

function diagAbsCompare(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  if ([mode, a].some(Number.isNaN)) return null;

  if (mode === 0) {
    const ans = Math.abs(a);
    // 符号を つけたまま 答えた。
    if (differs(a, ans) && near(val, a)) {
      return "絶対値は 数直線で 0から どれだけ はなれているかだよ。いつも 0か 正の数に なるね。";
    }
    // 符号を 逆に つけてしまった。
    if (differs(-ans, ans) && near(val, -ans)) {
      return "絶対値に マイナスは つかないよ。0からの きょりだから 正の数に なるね。";
    }
    return null;
  }

  const b = mm(meta, "b");
  const ans = mm(meta, "ans");
  if ([b, ans].some(Number.isNaN)) return null;
  const other = ans === a ? b : a;

  if (mode === 1) {
    // 絶対値の 大きいほうを えらんでしまった。
    const byAbs = Math.abs(a) >= Math.abs(b) ? a : b;
    if (differs(byAbs, ans) && near(val, byAbs)) {
      return "絶対値が 大きいほうを えらんだみたい。負の数は 絶対値が 大きいほど 小さく なるよ。";
    }
    if (differs(other, ans) && near(val, other)) {
      return "数直線では 右に ある ほうが 大きいよ。2つの 数を 数直線に かいて くらべてみよう。";
    }
    // 大きさだけ（絶対値）を 答えた。
    if (differs(Math.abs(ans), ans) && near(val, Math.abs(ans))) {
      return "符号も つけて 答えてね。もとの 数を そのまま 書くよ。";
    }
    return null;
  }

  // mode === 2（小さいほう）。
  const byAbs = Math.abs(a) <= Math.abs(b) ? a : b;
  if (differs(byAbs, ans) && near(val, byAbs)) {
    return "絶対値が 小さいほうを えらんだみたい。負の数は 絶対値が 大きいほど 小さく なるよ。";
  }
  if (differs(other, ans) && near(val, other)) {
    return "数直線では 左に ある ほうが 小さいよ。2つの 数を 数直線に かいて くらべてみよう。";
  }
  if (differs(Math.abs(ans), ans) && near(val, Math.abs(ans))) {
    return "符号も つけて 答えてね。もとの 数を そのまま 書くよ。";
  }
  return null;
}

// ==================================================================
// j1dm-exponent : 累乗の計算
// ==================================================================
//
// (-3)^2 のように かっこの中を n回 かける形と、-(2^2) のように
// マイナスが かっこの外に ある形を 区別して計算する。答えは integer。

function genExponent(): Problem {
  const mode = pick(["negBase", "posBase", "negOut"] as const);

  if (mode === "negBase") {
    // (-a)^n : かっこの中の 符号も n回 かける。
    const a = randInt(2, 7);
    const n = pick([2, 3] as const);
    const ans = Math.pow(-a, n);
    return {
      unitId: "j1dm-exponent",
      prompt: `(-${a})^${n} を 計算せよ。`,
      answer: String(ans),
      answerType: "integer",
      // mode: 0=(-a)^n, 1=a^n, 2=-(a^n)。
      meta: { mode: 0, a, n, ans },
    };
  }

  if (mode === "posBase") {
    // a^n : そのまま n回 かける。
    const a = randInt(2, 6);
    const n = a >= 5 ? pick([2, 3] as const) : pick([2, 3, 4] as const);
    const ans = Math.pow(a, n);
    return {
      unitId: "j1dm-exponent",
      prompt: `${a}^${n} を 計算せよ。`,
      answer: String(ans),
      answerType: "integer",
      meta: { mode: 1, a, n, ans },
    };
  }

  // -(a^n) : マイナスは かっこの外。最後に 符号を つける。
  const a = randInt(2, 7);
  const n = pick([2, 3] as const);
  const ans = -Math.pow(a, n);
  return {
    unitId: "j1dm-exponent",
    prompt: `-(${a}^${n}) を 計算せよ。`,
    answer: String(ans),
    answerType: "integer",
    meta: { mode: 2, a, n, ans },
  };
}

function diagExponent(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  const n = mm(meta, "n");
  if ([mode, a, n].some(Number.isNaN)) return null;

  const pow = Math.pow(a, n);

  if (mode === 0) {
    const ans = Math.pow(-a, n);
    // 符号を 1回しか かけなかった（かっこの中の − を 見のがした）。
    if (differs(-pow, ans) && near(val, -pow)) {
      return "かっこの 中の マイナスも いっしょに " + `${n}` + "回 かけるよ。符号の 数を かぞえてみよう。";
    }
    // かけ算では なく a × n を してしまった。
    if (differs(-a * n, ans) && near(val, -a * n)) {
      return "累乗は 同じ数を " + `${n}` + "回 かけ算することだよ。かける回数を 数に かけないでね。";
    }
    if (differs(a * n, ans) && near(val, a * n)) {
      return "累乗は 同じ数を " + `${n}` + "回 かけ算することだよ。かける回数を 数に かけないでね。";
    }
    return null;
  }

  if (mode === 1) {
    // a × n と まちがえた。
    if (differs(a * n, pow) && near(val, a * n)) {
      return "累乗は 同じ数を " + `${n}` + "回 かけ算することだよ。a × n では ないよ。";
    }
    // 1回 かけ算を 少なくした。
    const oneLess = Math.pow(a, n - 1);
    if (differs(oneLess, pow) && near(val, oneLess)) {
      return "かける回数が 1回 たりないみたい。" + `${a}` + " を " + `${n}` + "回 かけてね。";
    }
    return null;
  }

  // mode === 2：-(a^n)。マイナスは かっこの外。
  const ans = -pow;
  if (differs(pow, ans) && near(val, pow)) {
    return "マイナスは かっこの 外に あるよ。先に かっこの中の 累乗を 計算して、最後に − を つけてね。";
  }
  if (differs(-a * n, ans) && near(val, -a * n)) {
    return "累乗は 同じ数を " + `${n}` + "回 かけ算することだよ。かける回数を 数に かけないでね。";
  }
  return null;
}

// ==================================================================
// j1dm-eq-paren : かっこのある一次方程式
// ==================================================================
//
// a(x + b) = c 型と、a x - b(x - c) = d 型。解が整数になるよう先に解を決める。答えは integer。

function genEqParen(): Problem {
  const mode = pick(["simple", "double"] as const);

  if (mode === "simple") {
    // a(x + b) = c、c = a(x0 + b)。
    const a = randInt(2, 6);
    const b = randNonZero(-9, 9);
    const x0 = randInt(-8, 8);
    const c = a * (x0 + b);
    return {
      unitId: "j1dm-eq-paren",
      prompt: `方程式 ${a}(x${constTerm(b)}) = ${c} を解け。`,
      answer: String(x0),
      answerType: "integer",
      // mode: 0=a(x+b)=c, 1=ax-b(x-c)=d。
      meta: { mode: 0, a, b, c, x0 },
    };
  }

  // a x - b(x - c) = d、d = (a - b) x0 + b c。a - b ≠ 0 を保証。
  const a = randInt(2, 7);
  let b = randInt(1, 5);
  let guard = 0;
  while (a - b === 0 && guard < 50) {
    b = randInt(1, 5);
    guard++;
  }
  const c = randNonZero(-8, 8);
  const x0 = randInt(-8, 8);
  const d = (a - b) * x0 + b * c;
  const bStr = b === 1 ? "" : String(b);
  return {
    unitId: "j1dm-eq-paren",
    prompt: `方程式 ${coefTerm(a, "x")} - ${bStr}(x${constTerm(-c)}) = ${d} を解け。`,
    answer: String(x0),
    answerType: "integer",
    meta: { mode: 1, a, b, c, d, x0 },
  };
}

function diagEqParen(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const x0 = mm(meta, "x0");
  if ([mode, a, b, x0].some(Number.isNaN)) return null;

  if (mode === 0) {
    const c = mm(meta, "c");
    if (Number.isNaN(c)) return null;
    // かっこを はずすとき a を b に かけ忘れた（a x + b = c として解いた）。
    const wrongDist = (c - b) / a;
    if (differs(wrongDist, x0) && near(val, wrongDist)) {
      return "かっこを はずすときは、外の " + `${a}` + " を かっこの 中の どちらにも かけるよ。";
    }
    // 定数 b を まるごと 落としてしまった（a x = c として解いた）。
    const wrongDrop = c / a;
    if (differs(wrongDrop, x0) && near(val, wrongDrop)) {
      return "かっこの 中の " + `${b}` + " が 消えているみたい。両方の 項を 忘れずに 計算してね。";
    }
    return null;
  }

  // mode === 1。
  const c = mm(meta, "c");
  const d = mm(meta, "d");
  if ([c, d].some(Number.isNaN)) return null;
  // -b(x - c) を -b x - b c と 符号を まちがえた。
  const wrongSign = (d + b * c) / (a - b);
  if (differs(wrongSign, x0) && near(val, wrongSign)) {
    return "マイナスの ついた かっこを はずすときは、中の 符号が すべて 反対に なるよ。";
  }
  // x の 係数を a - b では なく a + b に してしまった。
  const wrongCoef = (d - b * c) / (a + b);
  if (differs(wrongCoef, x0) && near(val, wrongCoef)) {
    return "x の 係数の 計算を 見なおそう。前に − が あるから " + `${a}` + " から ひくよ。";
  }
  return null;
}

// ==================================================================
// j1dm-ratio-eq : 比例式
// ==================================================================
//
// a : b = c : x（または a : x = c : d）を解く。
// 基準の比 p : q と 倍率 k1, k2 から作るので、答えは必ず整数。答えは integer。

function genRatioEq(): Problem {
  let p = randInt(1, 9);
  let q = randInt(1, 9);
  let guard = 0;
  while (p === q && guard < 50) {
    q = randInt(1, 9);
    guard++;
  }
  if (p === q) p = q === 9 ? 8 : q + 1;

  const k1 = randInt(1, 6);
  const k2 = randInt(1, 6);
  const mode = pick(["tail", "inner"] as const);

  if (mode === "tail") {
    // a : b = c : x、x = b c / a。
    const a = p * k1;
    const b = q * k1;
    const c = p * k2;
    const x = q * k2;
    return {
      unitId: "j1dm-ratio-eq",
      prompt: `比例式 ${a} : ${b} = ${c} : x を解いて、x の 値を 求めよ。`,
      answer: String(x),
      answerType: "integer",
      // mode: 0=a:b=c:x, 1=a:x=c:d。
      meta: { mode: 0, a, b, c, x },
    };
  }

  // a : x = c : d、x = a d / c。
  const a = p * k1;
  const x = q * k1;
  const c = p * k2;
  const d = q * k2;
  return {
    unitId: "j1dm-ratio-eq",
    prompt: `比例式 ${a} : x = ${c} : ${d} を解いて、x の 値を 求めよ。`,
    answer: String(x),
    answerType: "integer",
    meta: { mode: 1, a, c, d, x },
  };
}

function diagRatioEq(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  const x = mm(meta, "x");
  if ([mode, a, x].some(Number.isNaN)) return null;

  if (mode === 0) {
    const b = mm(meta, "b");
    const c = mm(meta, "c");
    if ([b, c].some(Number.isNaN)) return null;
    // 内項・外項の 組み合わせを まちがえた（a c / b にしてしまった）。
    if (b !== 0) {
      const wrongPair = (a * c) / b;
      if (differs(wrongPair, x) && near(val, wrongPair)) {
        return "a : b = c : x では、外側どうしの 積 a × x と 内側どうしの 積 b × c が 等しく なるよ。";
      }
    }
    // 比を 差で 考えてしまった（c に b - a を たした）。
    const wrongDiff = c + (b - a);
    if (differs(wrongDiff, x) && near(val, wrongDiff)) {
      return "比は 差では なく 何倍かで くらべるよ。ひき算では なく かけ算・わり算で 考えてみよう。";
    }
    return null;
  }

  // mode === 1。
  const c = mm(meta, "c");
  const d = mm(meta, "d");
  if ([c, d].some(Number.isNaN)) return null;
  // 外項・内項を 取りちがえた（a c / d にしてしまった）。
  if (d !== 0) {
    const wrongPair = (a * c) / d;
    if (differs(wrongPair, x) && near(val, wrongPair)) {
      return "a : x = c : d では、外側どうしの 積 a × d と 内側どうしの 積 x × c が 等しく なるよ。";
    }
  }
  // 比を 差で 考えてしまった。
  const wrongDiff = a + (d - c);
  if (differs(wrongDiff, x) && near(val, wrongDiff)) {
    return "比は 差では なく 何倍かで くらべるよ。ひき算では なく かけ算・わり算で 考えてみよう。";
  }
  return null;
}

// ==================================================================
// j1dm-plane-figure : 平面図形（円・おうぎ形）
// ==================================================================
//
// 円周率は 3.14。円の 円周・面積、おうぎ形の 弧の長さ・面積。答えは decimal。
// おうぎ形は 中心角の分数 p/q（q は 4, 5, 8）と 半径 r = q × m から作り、
// 答えが かならず 小数第2位までの きっちりした 値に なるようにする。

const PI = 3.14;

/** おうぎ形の 中心角（p/q と 度数）。q は 4, 5, 8 のみ（きれいな小数のため）。 */
const SECTOR_ANGLES: ReadonlyArray<{ p: number; q: number; deg: number }> = [
  { p: 1, q: 4, deg: 90 },
  { p: 3, q: 4, deg: 270 },
  { p: 1, q: 5, deg: 72 },
  { p: 2, q: 5, deg: 144 },
  { p: 3, q: 5, deg: 216 },
  { p: 4, q: 5, deg: 288 },
  { p: 1, q: 8, deg: 45 },
  { p: 3, q: 8, deg: 135 },
  { p: 5, q: 8, deg: 225 },
  { p: 7, q: 8, deg: 315 },
];

function genPlaneFigure(): Problem {
  const mode = pick(["circumR", "circumD", "areaR", "arc", "sectorArea"] as const);

  if (mode === "circumR") {
    // 円周 = 2 π r。
    const r = randInt(2, 15);
    const ans = 2 * PI * r;
    return {
      unitId: "j1dm-plane-figure",
      prompt: `半径 ${r} cm の 円の 円周の 長さは 何 cm か。円周率は 3.14 とする。`,
      answer: formatDecimal(ans),
      answerType: "decimal",
      // mode: 0=円周(半径), 1=円周(直径), 2=円の面積, 3=おうぎ形の弧, 4=おうぎ形の面積。
      meta: { mode: 0, r },
    };
  }

  if (mode === "circumD") {
    // 円周 = π d。
    const d = randInt(3, 20);
    const ans = PI * d;
    return {
      unitId: "j1dm-plane-figure",
      prompt: `直径 ${d} cm の 円の 円周の 長さは 何 cm か。円周率は 3.14 とする。`,
      answer: formatDecimal(ans),
      answerType: "decimal",
      meta: { mode: 1, d },
    };
  }

  if (mode === "areaR") {
    // 面積 = π r^2。
    const r = randInt(2, 12);
    const ans = PI * r * r;
    return {
      unitId: "j1dm-plane-figure",
      prompt: `半径 ${r} cm の 円の 面積は 何 cm² か。円周率は 3.14 とする。`,
      answer: formatDecimal(ans),
      answerType: "decimal",
      meta: { mode: 2, r },
    };
  }

  const ang = pick(SECTOR_ANGLES);
  const m = randInt(1, ang.q === 8 ? 2 : 3);
  const r = ang.q * m;

  if (mode === "arc") {
    // 弧の長さ = 2 π r × (p/q) = 6.28 × m × p（きっちり小数第2位まで）。
    const ans = 2 * PI * r * (ang.p / ang.q);
    return {
      unitId: "j1dm-plane-figure",
      prompt: `半径 ${r} cm、中心角 ${ang.deg}° の おうぎ形の 弧の長さは 何 cm か。円周率は 3.14 とする。`,
      answer: formatDecimal(ans),
      answerType: "decimal",
      meta: { mode: 3, r, p: ang.p, q: ang.q, deg: ang.deg },
    };
  }

  // おうぎ形の 面積 = π r^2 × (p/q) = 3.14 × q × m^2 × p（きっちり小数第2位まで）。
  const ans = PI * r * r * (ang.p / ang.q);
  return {
    unitId: "j1dm-plane-figure",
    prompt: `半径 ${r} cm、中心角 ${ang.deg}° の おうぎ形の 面積は 何 cm² か。円周率は 3.14 とする。`,
    answer: formatDecimal(ans),
    answerType: "decimal",
    meta: { mode: 4, r, p: ang.p, q: ang.q, deg: ang.deg },
  };
}

function diagPlaneFigure(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  if (Number.isNaN(mode)) return null;

  if (mode === 0) {
    const r = mm(meta, "r");
    if (Number.isNaN(r)) return null;
    const ans = 2 * PI * r;
    // 半径を 直径と まちがえた（× 2 を 忘れた）。
    if (differs(PI * r, ans) && near(val, PI * r)) {
      return "円周は 直径 × 円周率 だよ。直径は 半径の 2倍だから、2 × 3.14 × 半径 に なるね。";
    }
    // 面積の 式で 計算した。
    if (differs(PI * r * r, ans) && near(val, PI * r * r)) {
      return "それは 円の 面積の 式だね。円周の 長さは 半径 × 2 × 3.14 だよ。";
    }
    return null;
  }

  if (mode === 1) {
    const d = mm(meta, "d");
    if (Number.isNaN(d)) return null;
    const ans = PI * d;
    // 直径を 半径として 2倍してしまった。
    if (differs(2 * PI * d, ans) && near(val, 2 * PI * d)) {
      return "あたえられているのは 直径だよ。円周は 直径 × 3.14 で もとめられるね。";
    }
    // 面積の 式で 計算した。
    const area = PI * (d / 2) * (d / 2);
    if (differs(area, ans) && near(val, area)) {
      return "それは 円の 面積だね。円周の 長さは 直径 × 3.14 だよ。";
    }
    return null;
  }

  if (mode === 2) {
    const r = mm(meta, "r");
    if (Number.isNaN(r)) return null;
    const ans = PI * r * r;
    // 円周の 式で 計算した。
    if (differs(2 * PI * r, ans) && near(val, 2 * PI * r)) {
      return "それは 円周の 長さだね。面積は 半径 × 半径 × 3.14 だよ。";
    }
    // 直径を 半径として 計算した。
    const byD = PI * (2 * r) * (2 * r);
    if (differs(byD, ans) && near(val, byD)) {
      return "かけるのは 半径 どうしだよ。直径と 取りちがえていないか たしかめてね。";
    }
    return null;
  }

  const r = mm(meta, "r");
  const p = mm(meta, "p");
  const q = mm(meta, "q");
  if ([r, p, q].some(Number.isNaN) || q === 0) return null;
  const frac = p / q;

  if (mode === 3) {
    const ans = 2 * PI * r * frac;
    // 中心角の 割合を かけ忘れた（円1周ぶんの 長さ）。
    if (differs(2 * PI * r, ans) && near(val, 2 * PI * r)) {
      return "おうぎ形は 円の 一部だよ。円周に 中心角 ÷ 360 を かけるのを 忘れていないかな。";
    }
    // おうぎ形の 面積を 求めてしまった。
    const secArea = PI * r * r * frac;
    if (differs(secArea, ans) && near(val, secArea)) {
      return "それは おうぎ形の 面積だね。弧の長さは 2 × 3.14 × 半径 × (中心角 ÷ 360) だよ。";
    }
    // 中心角の 割合を 半分に する式と 取りちがえた（÷2 のつけすぎ）。
    const halved = PI * r * frac;
    if (differs(halved, ans) && near(val, halved)) {
      return "弧の長さでは 2 でわらないよ。2 × 3.14 × 半径 に 中心角 ÷ 360 を かけるだけだね。";
    }
    return null;
  }

  // mode === 4（おうぎ形の面積）。
  const ans = PI * r * r * frac;
  // 中心角の 割合を かけ忘れた（円まるごとの 面積）。
  if (differs(PI * r * r, ans) && near(val, PI * r * r)) {
    return "おうぎ形は 円の 一部だよ。円の 面積に 中心角 ÷ 360 を かけるのを 忘れていないかな。";
  }
  // 弧の長さを 求めてしまった。
  const arc = 2 * PI * r * frac;
  if (differs(arc, ans) && near(val, arc)) {
    return "それは 弧の長さだね。面積は 3.14 × 半径 × 半径 × (中心角 ÷ 360) だよ。";
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_J1D: DiagUnitDef[] = [
  {
    id: "j1dm-abs-compare",
    grade: "中1",
    title: "絶対値と数の大小",
    lesson:
      "絶対値は、数直線で 0から その数までの きょりです。だから 絶対値は いつも 0か 正の数に なります。数の 大小は 数直線で 右に ある ほうが 大きく、左に ある ほうが 小さく なります。負の数どうしでは、絶対値が 大きいほど 小さい数に なります。",
    hint: "数直線を 思いうかべよう。0から どれだけ はなれているか、どちらが 右に あるかを くらべてみてね。",
    answerType: "integer",
    generate: genAbsCompare,
    diagnose: diagAbsCompare,
  },
  {
    id: "j1dm-exponent",
    grade: "中1",
    title: "累乗の計算",
    lesson:
      "同じ数を 何回か かけ算することを 累乗と いい、2 × 2 × 2 を 2³ と 書きます。(-3)² は かっこの 中の −3 を 2回 かけるので 9 に なります。-(3²) は 先に 3² を 計算してから − を つけるので -9 です。かっこが あるか ないかで 答えが かわります。",
    hint: "まず 何を 何回 かけるのかを たしかめよう。マイナスが かっこの 中か 外かに 気をつけてね。",
    answerType: "integer",
    generate: genExponent,
    diagnose: diagExponent,
  },
  {
    id: "j1dm-eq-paren",
    grade: "中1",
    title: "かっこのある一次方程式",
    lesson:
      "かっこの ある 方程式は、まず かっこを はずします。外の 数は かっこの 中の すべての 項に かけます。かっこの 前が − の ときは、中の 符号が すべて 反対に なります。そのあと 文字の 項を 左に、数の 項を 右に 集めて 解きます。",
    hint: "まず かっこを はずそう。外の 数は 中の すべての 項に かけるよ。",
    answerType: "integer",
    generate: genEqParen,
    diagnose: diagEqParen,
  },
  {
    id: "j1dm-ratio-eq",
    grade: "中1",
    title: "比例式",
    lesson:
      "a : b = c : d の ように 比が 等しいことを 表した 式を 比例式と いいます。比例式では、外側どうしの 積 a × d と、内側どうしの 積 b × c が 等しく なります。この 性質を 使うと、わからない 数を 方程式で 求められます。",
    hint: "外側どうしの かけ算と 内側どうしの かけ算が 等しくなるよ。まず その 式を 作ってみよう。",
    answerType: "integer",
    generate: genRatioEq,
    diagnose: diagRatioEq,
  },
  {
    id: "j1dm-plane-figure",
    grade: "中1",
    title: "平面図形（円・おうぎ形）",
    lesson:
      "円の 円周の 長さは 直径 × 円周率、面積は 半径 × 半径 × 円周率 です。ここでは 円周率を 3.14 として 計算します。おうぎ形は 円の 一部なので、弧の長さも 面積も 円の ぶんに (中心角 ÷ 360) を かけて 求めます。",
    hint: "まず 半径か 直径かを たしかめよう。おうぎ形なら 中心角 ÷ 360 を かけるのを 忘れないでね。",
    answerType: "decimal",
    generate: genPlaneFigure,
    diagnose: diagPlaneFigure,
  },
];
