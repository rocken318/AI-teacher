// 追加単元（B系）＝問題ジェネレータ群（第2弾）。
// すべての答えはコードで計算して確定させる（生成AIは使わない）。
// 各 def は generate と diagnose を内包し、監督が index で束ねる。

import type { Problem, UnitDef } from "@/lib/math/types";
import {
  reduceFraction,
  formatFraction,
  formatDecimal,
  formatRatio,
  gcd,
} from "@/lib/math/units";

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

/** 配列からランダムに1つ選ぶ。 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 最小公倍数。 */
function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
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

/** 分数入力を既約 "num/den" に正規化。整数は "n"。失敗時 null。 */
function normFrac(s: string): string | null {
  const frac = s.match(/^(-?\d+)\/(-?\d+)$/);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    return formatFraction(Number(frac[1]), den);
  }
  if (/^-?\d+$/.test(s)) return String(Number(s));
  return null;
}

/** 比入力 "a:b" を既約 "a:b" に正規化。失敗時 null。 */
function normRatio(s: string): string | null {
  const mt = s.match(/^(-?\d+):(-?\d+)$/);
  if (!mt) return null;
  const a = Number(mt[1]);
  const b = Number(mt[2]);
  if (a === 0 && b === 0) return null;
  try {
    return formatRatio(a, b);
  } catch {
    return null;
  }
}

/** meta を安全に取り出す。 */
function mm(meta: Record<string, number> | undefined, key: string, fallback = NaN): number {
  const v = meta?.[key];
  return typeof v === "number" ? v : fallback;
}

// ==================================================================
// b-area-rect : 長方形・正方形の面積
// ==================================================================

function genAreaRect(): Problem {
  const isSquare = Math.random() < 0.35;
  if (isSquare) {
    const side = randInt(2, 20);
    const area = side * side;
    return {
      unitId: "b-area-rect",
      prompt: `1辺が ${side}cm の正方形の面積は何 cm² ？`,
      answer: String(area),
      answerType: "integer",
      // isSquare: 1=正方形, 0=長方形。tate/yoko は辺の長さ。
      meta: { tate: side, yoko: side, area, isSquare: 1 },
    };
  }
  let tate = randInt(2, 20);
  let yoko = randInt(2, 20);
  if (tate === yoko) yoko = yoko === 20 ? 19 : yoko + 1; // 正方形にならないよう調整
  const area = tate * yoko;
  return {
    unitId: "b-area-rect",
    prompt: `たて ${tate}cm、よこ ${yoko}cm の長方形の面積は何 cm² ？`,
    answer: String(area),
    answerType: "integer",
    meta: { tate, yoko, area, isSquare: 0 },
  };
}

function diagAreaRect(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const tate = mm(meta, "tate");
  const yoko = mm(meta, "yoko");
  if ([tate, yoko].some(Number.isNaN)) return null;
  // まわりの長さと取りちがえ＝(たて＋よこ)×2。
  if (near(val, (tate + yoko) * 2)) {
    return "それは「まわりの長さ」の求め方だね。面積は たて × よこ で計算するよ。";
  }
  // たてとよこをたしてしまった。
  if (tate + yoko !== (tate + yoko) * 2 && near(val, tate + yoko)) {
    return "たてとよこを たし算しちゃったみたい。面積は たて × よこ（かけ算）だよ。";
  }
  return null;
}

// ==================================================================
// b-perimeter : 長方形のまわりの長さ
// ==================================================================

function genPerimeter(): Problem {
  let tate = randInt(2, 20);
  let yoko = randInt(2, 20);
  if (tate === yoko) yoko = yoko === 20 ? 19 : yoko + 1;
  const perimeter = (tate + yoko) * 2;
  return {
    unitId: "b-perimeter",
    prompt: `たて ${tate}cm、よこ ${yoko}cm の長方形の まわりの長さは何 cm ？`,
    answer: String(perimeter),
    answerType: "integer",
    meta: { tate, yoko, perimeter },
  };
}

function diagPerimeter(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const tate = mm(meta, "tate");
  const yoko = mm(meta, "yoko");
  if ([tate, yoko].some(Number.isNaN)) return null;
  // 面積を答えてしまった。
  if (near(val, tate * yoko)) {
    return "それは「面積」の求め方だね。まわりの長さは (たて ＋ よこ) × 2 だよ。";
  }
  // ×2 を忘れた＝たて＋よこ。
  if (near(val, tate + yoko)) {
    return "たてとよこは たせたね。でも長方形は同じ辺が2本ずつあるから、さいごに × 2 するよ。";
  }
  return null;
}

// ==================================================================
// b-angle-sum : 角の大きさ（一直線180° / 三角形の内角和180°）
// ==================================================================

function genAngleSum(): Problem {
  const mode = pick(["line", "triangle"] as const);
  if (mode === "line") {
    // 一直線は180°。片方 known を引く。
    const known = randInt(20, 160);
    const ans = 180 - known;
    return {
      unitId: "b-angle-sum",
      prompt: `一直線の角は 180° です。となりの角が ${known}° のとき、もう一方の角は何度？`,
      answer: String(ans),
      answerType: "integer",
      // total: 全体の角(180)。a,b は既知の角。known2=0（未使用）。
      meta: { total: 180, a: known, b: 0, ans, mode: 0 },
    };
  }
  // 三角形の内角の和は180°。2つ known を引く。
  const a = randInt(30, 100);
  const b = randInt(20, Math.min(120, 179 - a)); // a+b < 180 を保証
  const ans = 180 - a - b;
  return {
    unitId: "b-angle-sum",
    prompt: `三角形の3つの角のうち2つが ${a}° と ${b}° です。残りの角は何度？`,
    answer: String(ans),
    answerType: "integer",
    meta: { total: 180, a, b, ans, mode: 1 },
  };
}

function diagAngleSum(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const mode = mm(meta, "mode");
  if ([a, b, mode].some(Number.isNaN)) return null;
  if (mode === 0) {
    // 一直線180°。90°と勘違い（直角と混同）。
    if (near(val, 90)) {
      return "90° は直角のときだね。ここは「一直線 = 180°」だから、180 から ひくよ。";
    }
    // 引き忘れ＝known をそのまま答えた。
    if (near(val, a)) {
      return "きかれた角の数字を そのまま答えちゃったみたい。180 から その角を ひこう。";
    }
    return null;
  }
  // 三角形。1つだけ引いた（引き忘れ）。
  if (near(val, 180 - a) || near(val, 180 - b)) {
    return "角を1つ ひき忘れているみたい。三角形は 180 から 2つの角を どちらも ひくよ。";
  }
  // たし算だけして180を引いてない、または a+b を答えた。
  if (near(val, a + b)) {
    return "2つの角を たした数を答えちゃったみたい。残りの角は 180 から その和を ひくよ。";
  }
  return null;
}

// ==================================================================
// b-large-number : 大きな数（10倍・100倍・10でわる）
// ==================================================================

function genLargeNumber(): Problem {
  const op = pick(["x10", "x100", "div10"] as const);
  if (op === "x10") {
    const base = randInt(1, 9999) * 10; // 10でわり切れる数にして÷10も安全に共通化不要だが桁を整える
    const value = base;
    const ans = value * 10;
    return {
      unitId: "b-large-number",
      prompt: `${value} を 10倍すると いくつ？`,
      answer: String(ans),
      answerType: "integer",
      // op: 0=×10, 1=×100, 2=÷10。
      meta: { value, ans, op: 0 },
    };
  }
  if (op === "x100") {
    const value = randInt(1, 9999);
    const ans = value * 100;
    return {
      unitId: "b-large-number",
      prompt: `${value} を 100倍すると いくつ？`,
      answer: String(ans),
      answerType: "integer",
      meta: { value, ans, op: 1 },
    };
  }
  // ÷10（割り切れるよう末尾0にする）。
  const value = randInt(1, 9999) * 10;
  const ans = value / 10;
  return {
    unitId: "b-large-number",
    prompt: `${value} を 10でわると いくつ？`,
    answer: String(ans),
    answerType: "integer",
    meta: { value, ans, op: 2 },
  };
}

function diagLargeNumber(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const value = mm(meta, "value");
  const op = mm(meta, "op");
  if ([value, op].some(Number.isNaN)) return null;
  if (op === 0) {
    // ×10 なのに ×100 した／変えなかった。
    if (near(val, value * 100)) {
      return "0を2つ つけちゃったみたい。10倍は 右に 0を 1つ つけるよ。";
    }
    if (near(val, value)) {
      return "数が 変わっていないね。10倍は 右に 0を 1つ ふやすよ。";
    }
    return null;
  }
  if (op === 1) {
    // ×100 なのに ×10 した。
    if (near(val, value * 10)) {
      return "0が 1つ 足りないみたい。100倍は 右に 0を 2つ つけるよ。";
    }
    return null;
  }
  // ÷10 なのに ×10 した／0を消しすぎ。
  if (near(val, value * 10)) {
    return "反対に 10倍しちゃったみたい。10でわるのは 右の 0を 1つ とるよ。";
  }
  if (near(val, value / 100)) {
    return "0を 2つ とっちゃったみたい。10でわるのは 0を 1つ とるだけだよ。";
  }
  return null;
}

// ==================================================================
// b-dec-place : 小数のしくみ（0.1が何個 / 10倍・1/10）
// ==================================================================

function genDecPlace(): Problem {
  const mode = pick(["count", "x10", "div10"] as const);
  if (mode === "count") {
    // 「0.1 を □こ 集めると X」→ □を答える。X は 1/10 単位。
    const count = randInt(2, 99);
    const valueTenths = count; // 0.1 が count 個 = count/10
    return {
      unitId: "b-dec-place",
      prompt: `${formatDecimal(valueTenths / 10)} は 0.1 を 何こ 集めた数？`,
      answer: String(count),
      answerType: "integer",
      // mode: 0=0.1が何個, 1=×10, 2=÷10。valueTenths は 1/10 単位。
      meta: { valueTenths, count, mode: 0 },
    };
  }
  if (mode === "x10") {
    const valueTenths = randInt(11, 999); // 1.1〜99.9
    const ansTenths = valueTenths * 10; // ×10 → 整数（1/10単位）
    return {
      unitId: "b-dec-place",
      prompt: `${formatDecimal(valueTenths / 10)} を 10倍すると いくつ？`,
      answer: formatDecimal(ansTenths / 10),
      answerType: "decimal",
      meta: { valueTenths, ansTenths, mode: 1 },
    };
  }
  // ÷10（1/10）。整数を10でわって小数第1位にする。
  const base = randInt(2, 999);
  const valueTenths = base * 10; // 元は整数（1/10単位）
  const ansTenths = base; // ÷10 → base/10
  return {
    unitId: "b-dec-place",
    prompt: `${formatDecimal(valueTenths / 10)} を 10でわると いくつ？`,
    answer: formatDecimal(ansTenths / 10),
    answerType: "decimal",
    meta: { valueTenths, ansTenths, mode: 2 },
  };
}

function diagDecPlace(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  if (Number.isNaN(mode)) return null;
  if (mode === 0) {
    const valueTenths = mm(meta, "valueTenths");
    if (Number.isNaN(valueTenths)) return null;
    // 桁ずれ：0.01 単位で数えた等＝count×10 や /10。
    if (near(val, valueTenths * 10)) {
      return "けたが ずれているみたい。0.1 が いくつ分かを 数えよう（0.01 ではないよ）。";
    }
    if (near(val, valueTenths / 10)) {
      return "けたが ずれているみたい。0.1 を もとに 何こ分かを 数えてね。";
    }
    return null;
  }
  if (mode === 1) {
    const valueTenths = mm(meta, "valueTenths");
    const correct = (valueTenths * 10) / 10;
    if (near(val, correct / 100) || near(val, valueTenths / 100)) {
      return "小数点を 反対に 動かしたみたい。10倍は 小数点を 右に 1つ 動かすよ。";
    }
    if (near(val, correct * 10)) {
      return "小数点を 動かしすぎたみたい。10倍は 右に 1つだけ 動かすよ。";
    }
    return null;
  }
  // mode === 2（÷10）
  const valueTenths = mm(meta, "valueTenths");
  const correct = valueTenths / 10 / 10;
  if (near(val, correct * 100)) {
    return "小数点を 反対に 動かしたみたい。10でわるのは 小数点を 左に 1つ 動かすよ。";
  }
  if (near(val, correct / 10)) {
    return "小数点を 動かしすぎたみたい。10でわるのは 左に 1つだけ 動かすよ。";
  }
  return null;
}

// ==================================================================
// b-mul-div-dec-int : 小数×整数 / 小数÷整数（割り切れる）
// ==================================================================

function genMulDivDecInt(): Problem {
  const isMul = Math.random() < 0.5;
  if (isMul) {
    // 小数(1/10単位) × 整数。
    const aTenths = randInt(11, 199); // 1.1〜19.9
    const b = randInt(2, 9);
    const prodTenths = aTenths * b;
    return {
      unitId: "b-mul-div-dec-int",
      prompt: `${formatDecimal(aTenths / 10)} × ${b} = ?`,
      answer: formatDecimal(prodTenths / 10),
      answerType: "decimal",
      // op: 1=×, 0=÷。aTenths は 1/10 単位、b は整数。
      meta: { aTenths, b, op: 1 },
    };
  }
  // 小数÷整数（割り切れる）：商を1/10単位で先に決める。
  const b = randInt(2, 9);
  const quotientTenths = randInt(11, 199); // 商 1.1〜19.9
  const dividendTenths = b * quotientTenths; // 割られる数（1/10単位）
  return {
    unitId: "b-mul-div-dec-int",
    prompt: `${formatDecimal(dividendTenths / 10)} ÷ ${b} = ?`,
    answer: formatDecimal(quotientTenths / 10),
    answerType: "decimal",
    // op: 0=÷。dividendTenths は 1/10 単位、b は整数、商は 1/10 単位。
    meta: { dividendTenths, b, quotientTenths, op: 0 },
  };
}

function diagMulDivDecInt(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const op = mm(meta, "op");
  if (Number.isNaN(op)) return null;
  if (op === 1) {
    const aTenths = mm(meta, "aTenths");
    const b = mm(meta, "b");
    if ([aTenths, b].some(Number.isNaN)) return null;
    const correct = (aTenths * b) / 10;
    if (near(val, correct * 10)) {
      return "小数点を うち忘れたみたい。答えが 10倍 大きくなってるよ。小数点以下のけた数を 数えなおしてね。";
    }
    if (near(val, correct / 10)) {
      return "小数点の 位置が ずれたみたい。答えが 10分の1 小さくなってるよ。";
    }
    return null;
  }
  const dividendTenths = mm(meta, "dividendTenths");
  const b = mm(meta, "b");
  if ([dividendTenths, b].some(Number.isNaN)) return null;
  const correct = dividendTenths / 10 / b;
  if (near(val, correct * 10)) {
    return "商の 小数点の 位置が ずれたみたい。答えが 10倍 大きくなってるよ。割られる数の 小数点に そろえてね。";
  }
  if (near(val, correct / 10)) {
    return "商の 小数点の 位置が ずれたみたい。答えが 10分の1 小さくなってるよ。";
  }
  return null;
}

// ==================================================================
// b-multiples : 倍数（最小公倍数）
// ==================================================================

function genMultiples(): Problem {
  const mode = pick(["lcm", "nth"] as const);
  if (mode === "lcm") {
    const a = randInt(2, 9);
    let b = randInt(2, 9);
    if (b === a) b = a === 9 ? 8 : a + 1;
    const ans = lcm(a, b);
    return {
      unitId: "b-multiples",
      prompt: `${a} と ${b} の 最小公倍数は？`,
      answer: String(ans),
      answerType: "integer",
      // mode: 0=最小公倍数, 1=n番目の倍数。
      meta: { a, b, ans, mode: 0 },
    };
  }
  // ○の△番目の倍数。
  const a = randInt(2, 12);
  const n = randInt(2, 9);
  const ans = a * n;
  return {
    unitId: "b-multiples",
    prompt: `${a} の 倍数を 小さい方から ならべたとき、${n} 番目の数は？`,
    answer: String(ans),
    answerType: "integer",
    meta: { a, n, ans, mode: 1 },
  };
}

function diagMultiples(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  if (Number.isNaN(mode)) return null;
  if (mode === 0) {
    const a = mm(meta, "a");
    const b = mm(meta, "b");
    if ([a, b].some(Number.isNaN)) return null;
    // 最大公約数と取りちがえ。
    const g = gcd(a, b);
    if (g !== lcm(a, b) && near(val, g)) {
      return "それは「最大公約数」だね。ここは 最小公倍数（両方の倍数で いちばん小さい数）を 求めるよ。";
    }
    return null;
  }
  // mode === 1：n番目の倍数。1つずれ（0番目から数えた等）。
  const a = mm(meta, "a");
  const n = mm(meta, "n");
  if ([a, n].some(Number.isNaN)) return null;
  if (near(val, a * (n + 1))) {
    return `数える 番号が 1つ ずれたみたい。1番目は ${a} だよ。`;
  }
  if (n > 1 && near(val, a * (n - 1))) {
    return "数える 番号が 1つ ずれたみたい。何番目かを もう一度 数えてね。";
  }
  return null;
}

// ==================================================================
// b-divisors : 約数（最大公約数）
// ==================================================================

function genDivisors(): Problem {
  const a = randInt(4, 36);
  let b = randInt(4, 36);
  if (b === a) b = a === 36 ? 35 : a + 1;
  const ans = gcd(a, b);
  return {
    unitId: "b-divisors",
    prompt: `${a} と ${b} の 最大公約数は？`,
    answer: String(ans),
    answerType: "integer",
    meta: { a, b, ans },
  };
}

function diagDivisors(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  if ([a, b].some(Number.isNaN)) return null;
  const g = gcd(a, b);
  const l = lcm(a, b);
  // 最小公倍数と取りちがえ。
  if (g !== l && near(val, l)) {
    return "それは「最小公倍数」だね。ここは 最大公約数（両方を わり切れる いちばん大きい数）を 求めるよ。";
  }
  return null;
}

// ==================================================================
// b-reduce : 約分（分数を既約に）
// ==================================================================

function genReduce(): Problem {
  // 既約 p/q（真分数）に共通倍率 k を掛けた見た目を出題。
  let p = randInt(1, 8);
  let q = randInt(2, 9);
  if (p >= q) p = randInt(1, q - 1); // 真分数にそろえる
  const g0 = gcd(p, q) || 1;
  p = p / g0;
  q = q / g0;
  const k = randInt(2, 6);
  const num = p * k;
  const den = q * k;
  const r = reduceFraction(num, den);
  return {
    unitId: "b-reduce",
    prompt: `${num}/${den} を約分して、これ以上約分できない分数にすると？`,
    answer: formatFraction(r.num, r.den),
    answerType: "fraction",
    // num/den は約分前、k は共通倍率。
    meta: { num, den, k },
  };
}

function diagReduce(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const num = mm(meta, "num");
  const den = mm(meta, "den");
  if ([num, den].some(Number.isNaN)) return null;
  const user = normFrac(cleaned);
  if (user === null) return null;
  const g = gcd(num, den);
  const answer = formatFraction(num, den);
  if (user === answer) return null; // 正解は診断しない
  // 「もとの分数のまま（約分していない）」。
  if (user === normFrac(`${num}/${den}`)) {
    return "まだ 約分できるよ。上と下を 同じ数で わっていこう。";
  }
  // 「約分しきれていない」＝2など小さい公約数で1回だけ割った等、まだ約分できる形。
  const un = cleaned.match(/^(-?\d+)\/(-?\d+)$/);
  if (un) {
    const un1 = Number(un[1]);
    const ud1 = Number(un[2]);
    // ユーザーの分数が元と等しい値で、かつ既約でない → 約分しきれていない。
    if (
      ud1 !== 0 &&
      Math.abs(un1 / ud1 - num / den) < 1e-9 &&
      gcd(un1, ud1) > 1
    ) {
      return "おしい！ もう一歩。まだ 上と下を 同じ数で われるよ（これ以上われない形まで）。";
    }
  }
  // 割る数を間違い＝分子だけ or 分母だけ g で割った。
  if (g > 1) {
    if (user === normFrac(`${num / g}/${den}`) || user === normFrac(`${num}/${den / g}`)) {
      return "上か下の どちらかだけを わったみたい。約分は 上と下を 同じ数で わるよ。";
    }
  }
  return null;
}

// ==================================================================
// b-round-calc : 概数にしてから計算（見積もり）
// ==================================================================

function genRoundCalc(): Problem {
  // 上から1桁の概数にして たし算する見積もり。
  const a = randInt(1000, 8999);
  const b = randInt(1000, 8999);
  // 上から1桁の概数 = 上から2桁目を四捨五入。
  const roundTop1 = (v: number): number => {
    const digits = String(v).length;
    const factor = Math.pow(10, digits - 1);
    return Math.round(v / factor) * factor;
  };
  const ra = roundTop1(a);
  const rb = roundTop1(b);
  const ans = ra + rb;
  return {
    unitId: "b-round-calc",
    prompt: `${a} ＋ ${b} を、それぞれ上から1桁のがい数にしてから たし算で見積もると？`,
    answer: String(ans),
    answerType: "integer",
    // a,b は元の数、ra,rb は概数、ans は概数の和。
    meta: { a, b, ra, rb, ans },
  };
}

function diagRoundCalc(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  if ([a, b].some(Number.isNaN)) return null;
  // 概数にせず そのまま たした。
  if (near(val, a + b)) {
    return "がい数に する前の 数で たしちゃったみたい。まず それぞれを 上から1桁の がい数に してから たすよ。";
  }
  // 四捨五入の位ずれ＝上から2桁の概数にして足した。
  const roundTopN = (v: number, keep: number): number => {
    const digits = String(v).length;
    const factor = Math.pow(10, Math.max(0, digits - keep));
    return Math.round(v / factor) * factor;
  };
  const two = roundTopN(a, 2) + roundTopN(b, 2);
  if (two !== a + b && near(val, two)) {
    return "四捨五入する 位が ちがうみたい。ここは「上から1桁」の がい数に そろえてね。";
  }
  return null;
}

// ------------------------------------------------------------------
// 単元定義一覧
// ------------------------------------------------------------------

export const UNIT_DEFS_B: DiagUnitDef[] = [
  {
    id: "b-area-rect",
    grade: "小4",
    title: "長方形・正方形の面積",
    lesson:
      "長方形の面積は「たて × よこ」で求められます。正方形は たてとよこが同じ長さなので「1辺 × 1辺」になります。面積の単位は cm²（平方センチメートル）などを使います。",
    hint: "面積は たて × よこ だよ。まわりの長さと まちがえないようにね。",
    answerType: "integer",
    generate: genAreaRect,
    diagnose: diagAreaRect,
  },
  {
    id: "b-perimeter",
    grade: "小4",
    title: "長方形のまわりの長さ",
    lesson:
      "長方形は 同じ長さの辺が 2本ずつ あります。まわりの長さは「(たて ＋ よこ) × 2」で求められます。4つの辺を 全部 たしても 同じ答えになります。",
    hint: "たてとよこを たしてから、× 2 するよ。同じ辺が 2本ずつ あるからね。",
    answerType: "integer",
    generate: genPerimeter,
    diagnose: diagPerimeter,
  },
  {
    id: "b-angle-sum",
    grade: "小4",
    title: "角の大きさ",
    lesson:
      "一直線の角は 180° です。三角形の 3つの角を たすと、いつも 180° になります。わかっている角を 180 から ひくと、残りの角の 大きさが 求められます。",
    hint: "180 から わかっている角を ひこう。三角形なら 2つとも ひくよ。",
    answerType: "integer",
    generate: genAngleSum,
    diagnose: diagAngleSum,
  },
  {
    id: "b-large-number",
    grade: "小4",
    title: "大きな数（10倍・100倍・10でわる）",
    lesson:
      "数を 10倍すると、位が 1つ 上がり、右に 0が 1つ ふえます。100倍なら 0が 2つ ふえます。10でわると 位が 1つ 下がり、右の 0が 1つ とれます。",
    hint: "10倍は 右に 0を 1つ、100倍は 2つ つけるよ。10でわるのは 0を 1つ とるよ。",
    answerType: "integer",
    generate: genLargeNumber,
    diagnose: diagLargeNumber,
  },
  {
    id: "b-dec-place",
    grade: "小4",
    title: "小数のしくみ",
    lesson:
      "小数は 0.1 を もとに できています。たとえば 2.3 は 0.1 を 23こ 集めた数です。小数を 10倍すると 小数点は 右に、10でわると 左に 1つ 動きます。",
    hint: "0.1 が いくつ分かを 考えよう。10倍・10でわるは 小数点が 1つ 動くよ。",
    answerType: "integer",
    generate: genDecPlace,
    diagnose: diagDecPlace,
  },
  {
    id: "b-mul-div-dec-int",
    grade: "小5",
    title: "小数×整数・小数÷整数",
    lesson:
      "小数 × 整数は、まず 整数のように かけ算して、小数点以下の けた数だけ 答えに 小数点を うちます。小数 ÷ 整数は、割られる数の 小数点に そろえて 商に 小数点を うちます。",
    hint: "まず 小数点を 気にせず 計算しよう。さいごに 小数点の 位置を たしかめてね。",
    answerType: "decimal",
    generate: genMulDivDecInt,
    diagnose: diagMulDivDecInt,
  },
  {
    id: "b-multiples",
    grade: "小5",
    title: "倍数・最小公倍数",
    lesson:
      "ある数を 整数倍した数を 倍数といいます。2つの数に 共通な 倍数のうち いちばん小さいものを 最小公倍数といいます。約数（わり切れる数）と まちがえないようにしましょう。",
    hint: "倍数は「その数を 何倍かした数」だよ。最小公倍数は 共通の倍数で いちばん小さいものだね。",
    answerType: "integer",
    generate: genMultiples,
    diagnose: diagMultiples,
  },
  {
    id: "b-divisors",
    grade: "小5",
    title: "約数・最大公約数",
    lesson:
      "ある数を わり切れる 数を 約数といいます。2つの数に 共通な 約数のうち いちばん大きいものを 最大公約数といいます。倍数と まちがえないように 気をつけましょう。",
    hint: "約数は「その数を わり切れる 数」だよ。最大公約数は 共通の約数で いちばん大きいものだね。",
    answerType: "integer",
    generate: genDivisors,
    diagnose: diagDivisors,
  },
  {
    id: "b-reduce",
    grade: "小5",
    title: "約分",
    lesson:
      "約分は、分数の 上（分子）と 下（分母）を 同じ数で わって 簡単にすることです。上と下の 公約数で わっていきます。これ以上 われない 形（既約分数）まで 約分します。",
    hint: "上と下を 同じ数で わろう。いちばん わりやすいのは 最大公約数だよ。",
    answerType: "fraction",
    generate: genReduce,
    diagnose: diagReduce,
  },
  {
    id: "b-round-calc",
    grade: "小4",
    title: "がい数にして計算（見積もり）",
    lesson:
      "大きな数の 計算では、まず それぞれを がい数（だいたいの数）に してから 計算すると、答えの 見当を つけられます。今回は 上から1桁の がい数に そろえてから たし算します。",
    hint: "先に それぞれを 上から1桁の がい数に してから、たし算するよ。",
    answerType: "integer",
    generate: genRoundCalc,
    diagnose: diagRoundCalc,
  },
];
