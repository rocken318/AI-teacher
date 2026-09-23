// 中2数学 追加分 その3（J2E系）＝問題ジェネレータ群。
// すべての答えはコードで計算して確定させる（生成AIは使わない）。
// 各 def は generate と diagnose を内包し、監督が index で束ねる（このファイルは index.ts を編集しない）。

import type { Problem, UnitDef } from "@/lib/math/types";
import { formatFraction, reduceFraction } from "@/lib/math/units";

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

/** 組合せ nC2（2個選ぶ場合の数）。 */
function comb2(n: number): number {
  return (n * (n - 1)) / 2;
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
  return `${coefTerm(a, v)}${constTerm(b)}`;
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

/** meta を安全に取り出す。 */
function mm(meta: Record<string, number> | undefined, key: string, fallback = NaN): number {
  const v = meta?.[key];
  return typeof v === "number" ? v : fallback;
}

// ==================================================================
// j2em-poly-mul-div : 多項式と数の乗除
// ==================================================================
//
// k(ax + b)、(ax + b) ÷ k、k1(a1x + b1) − k2(a2x + b2) を展開し、
// x = xv を代入した値を答えさせる（分配法則の確認を数値で確定させる）。

function genPolyMulDiv(): Problem {
  const mode = pick(["mul", "div", "combo"] as const);
  const xv = randInt(-5, 5);

  if (mode === "mul") {
    // k(ax + b) を展開して代入。
    const k = randNonZero(-6, 6);
    const a = randNonZero(-6, 6);
    const b = randInt(-9, 9);
    const value = k * (a * xv + b);
    return {
      unitId: "j2em-poly-mul-div",
      prompt: `${k}(${linearExpr(a, b)}) を 計算し、x = ${xv} のときの 値を 求めよ。`,
      answer: String(value),
      answerType: "integer",
      // mode: 0=乗法, 1=除法, 2=2項の組合せ。
      meta: { mode: 0, k, a, b, xv, value },
    };
  }

  if (mode === "div") {
    // (ax + b) ÷ k。係数・定数とも k で割り切れるように作る。
    const k = randInt(2, 6);
    const q1 = randNonZero(-6, 6); // 商の x の係数
    const q0 = randInt(-9, 9); // 商の定数項
    const a = k * q1;
    const b = k * q0;
    const value = q1 * xv + q0;
    return {
      unitId: "j2em-poly-mul-div",
      prompt: `(${linearExpr(a, b)}) ÷ ${k} を 計算し、x = ${xv} のときの 値を 求めよ。`,
      answer: String(value),
      answerType: "integer",
      meta: { mode: 1, k, a, b, q1, q0, xv, value },
    };
  }

  // k1(a1x + b1) − k2(a2x + b2)：かっこの前のマイナスの配り方をみる。
  const k1 = randInt(2, 5);
  const k2 = randInt(2, 5);
  const a1 = randNonZero(-5, 5);
  const b1 = randInt(-8, 8);
  const a2 = randNonZero(-5, 5);
  const b2 = randNonZero(-8, 8);
  const value = k1 * (a1 * xv + b1) - k2 * (a2 * xv + b2);
  return {
    unitId: "j2em-poly-mul-div",
    prompt:
      `${k1}(${linearExpr(a1, b1)}) - ${k2}(${linearExpr(a2, b2)}) を 計算し、` +
      `x = ${xv} のときの 値を 求めよ。`,
    answer: String(value),
    answerType: "integer",
    meta: { mode: 2, k1, k2, a1, b1, a2, b2, xv, value },
  };
}

function diagPolyMulDiv(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const xv = mm(meta, "xv");
  if ([mode, xv].some(Number.isNaN)) return null;

  if (mode === 0) {
    const k = mm(meta, "k");
    const a = mm(meta, "a");
    const b = mm(meta, "b");
    if ([k, a, b].some(Number.isNaN)) return null;
    const correct = k * (a * xv + b);
    // 定数項に k を かけ忘れた（分配のもれ）。
    const wrong1 = k * a * xv + b;
    if (wrong1 !== correct && near(val, wrong1)) {
      return "かっこの中の 定数 " + `${b}` + " にも かけるのを わすれたみたい。" +
        "k(ax + b) は ka×x + kb だよ。";
    }
    // x の項に k を かけ忘れた。
    const wrong2 = a * xv + k * b;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "x の 項にも かけるのを わすれたみたい。かっこの中の 全部に かけてね。";
    }
    return null;
  }

  if (mode === 1) {
    const k = mm(meta, "k");
    const a = mm(meta, "a");
    const b = mm(meta, "b");
    const q1 = mm(meta, "q1");
    const q0 = mm(meta, "q0");
    if ([k, a, b, q1, q0].some(Number.isNaN)) return null;
    const correct = q1 * xv + q0;
    // 定数項を わり忘れた。
    const wrong1 = q1 * xv + b;
    if (wrong1 !== correct && near(val, wrong1)) {
      return "定数 " + `${b}` + " を " + `${k}` + " で わるのを わすれたみたい。" +
        "わり算も かっこの中の 全部に かかるよ。";
    }
    // x の係数を わり忘れた。
    const wrong2 = a * xv + q0;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "x の 係数を " + `${k}` + " で わるのを わすれたみたい。両方の 項を わってね。";
    }
    return null;
  }

  // mode === 2：うしろの かっこの符号の配り方。
  const k1 = mm(meta, "k1");
  const k2 = mm(meta, "k2");
  const a1 = mm(meta, "a1");
  const b1 = mm(meta, "b1");
  const a2 = mm(meta, "a2");
  const b2 = mm(meta, "b2");
  if ([k1, k2, a1, b1, a2, b2].some(Number.isNaN)) return null;
  const correct = k1 * (a1 * xv + b1) - k2 * (a2 * xv + b2);
  // 定数項だけ マイナスを配り忘れた。
  const wrong1 = k1 * (a1 * xv + b1) - k2 * a2 * xv + k2 * b2;
  if (wrong1 !== correct && near(val, wrong1)) {
    return "うしろの かっこの 定数の 符号を 変えるのを わすれたみたい。" +
      "-k(ax + b) は -ka×x - kb だよ。";
  }
  // うしろの かっこ全体を たしてしまった。
  const wrong2 = k1 * (a1 * xv + b1) + k2 * (a2 * xv + b2);
  if (wrong2 !== correct && near(val, wrong2)) {
    return "うしろの かっこを ひくのに、たしてしまったみたい。" +
      "かっこの中の 符号を 全部 反対にしてから たしてね。";
  }
  return null;
}

// ==================================================================
// j2em-equal-ratio : 等式の変形
// ==================================================================
//
// 公式を ある文字について 解き、数値を 代入して 値を 求めさせる。
// 「両辺に 同じことをする」手順を 数値で 確定できるようにする。

function genEqualRatio(): Problem {
  const mode = pick(["perimeter", "trapezoid", "mean", "volume"] as const);

  if (mode === "perimeter") {
    // ℓ = 2(a + b) を a について解く → a = ℓ/2 − b。
    const a = randInt(2, 15);
    const b = randInt(2, 15);
    const L = 2 * (a + b);
    return {
      unitId: "j2em-equal-ratio",
      prompt:
        `長方形の まわりの 長さの 式 ℓ = 2(a + b) を a について 解き、` +
        `ℓ = ${L}, b = ${b} のときの a の 値を 求めよ。`,
      answer: String(a),
      answerType: "integer",
      // mode: 0=まわりの長さ, 1=台形, 2=平均, 3=体積。
      meta: { mode: 0, a, b, L },
    };
  }

  if (mode === "trapezoid") {
    // S = (a + b) × h ÷ 2 を a について解く → a = 2S/h − b。
    const a = randInt(2, 15);
    const b = randInt(2, 15);
    let h = randInt(2, 10);
    if (((a + b) * h) % 2 !== 0) h += 1; // S を整数化
    const S = ((a + b) * h) / 2;
    return {
      unitId: "j2em-equal-ratio",
      prompt:
        `台形の 面積の 式 S = (a + b) × h ÷ 2 を a について 解き、` +
        `S = ${S}, b = ${b}, h = ${h} のときの a の 値を 求めよ。`,
      answer: String(a),
      answerType: "integer",
      meta: { mode: 1, a, b, h, S },
    };
  }

  if (mode === "mean") {
    // m = (a + b) / 2 を b について解く → b = 2m − a。
    let a = randInt(2, 20);
    const b = randInt(2, 20);
    if ((a + b) % 2 !== 0) a += 1; // m を整数化
    const m = (a + b) / 2;
    return {
      unitId: "j2em-equal-ratio",
      prompt:
        `2つの数の 平均の 式 m = (a + b) ÷ 2 を b について 解き、` +
        `m = ${m}, a = ${a} のときの b の 値を 求めよ。`,
      answer: String(b),
      answerType: "integer",
      meta: { mode: 2, a, b, m },
    };
  }

  // V = abc を c について解く → c = V ÷ (a × b)。
  const a = randInt(2, 9);
  const b = randInt(2, 9);
  const c = randInt(2, 12);
  const V = a * b * c;
  return {
    unitId: "j2em-equal-ratio",
    prompt:
      `直方体の 体積の 式 V = abc を c について 解き、` +
      `V = ${V}, a = ${a}, b = ${b} のときの c の 値を 求めよ。`,
    answer: String(c),
    answerType: "integer",
    meta: { mode: 3, a, b, c, V },
  };
}

function diagEqualRatio(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  if ([mode, a, b].some(Number.isNaN)) return null;

  if (mode === 0) {
    const L = mm(meta, "L");
    if (Number.isNaN(L)) return null;
    // 両辺を 2 でわるのを わすれた。
    if (L - b !== a && near(val, L - b)) {
      return "先に 両辺を 2で わるのを わすれたみたい。ℓ ÷ 2 = a + b に してから b を 移そう。";
    }
    // 移項の符号ミス。
    if (L / 2 + b !== a && near(val, L / 2 + b)) {
      return "b を 右へ 移すとき 符号を 変えるのを わすれたみたい。a = ℓ ÷ 2 − b だよ。";
    }
    return null;
  }

  if (mode === 1) {
    const h = mm(meta, "h");
    const S = mm(meta, "S");
    if ([h, S].some(Number.isNaN)) return null;
    // ÷2 を もどす（×2）のを わすれた。
    const wrong1 = S / h - b;
    if (wrong1 !== a && near(val, wrong1)) {
      return "両辺を 2倍して ÷2 を 消すのを わすれたみたい。まず 2S = (a + b) × h にしよう。";
    }
    // 移項の符号ミス。
    const wrong2 = (2 * S) / h + b;
    if (wrong2 !== a && near(val, wrong2)) {
      return "b を 移すとき 符号を 変えるのを わすれたみたい。a = 2S ÷ h − b だよ。";
    }
    return null;
  }

  if (mode === 2) {
    const m = mm(meta, "m");
    if (Number.isNaN(m)) return null;
    // 両辺を 2倍するのを わすれた。
    if (m - a !== b && near(val, m - a)) {
      return "両辺を 2倍するのを わすれたみたい。まず 2m = a + b に してから a を 移そう。";
    }
    // 移項の符号ミス。
    if (2 * m + a !== b && near(val, 2 * m + a)) {
      return "a を 右へ 移すとき 符号を 変えるのを わすれたみたい。b = 2m − a だよ。";
    }
    return null;
  }

  // mode === 3：V = abc を c について解く。
  const c = mm(meta, "c");
  const V = mm(meta, "V");
  if ([c, V].some(Number.isNaN)) return null;
  // a だけで わった（b でわり忘れ）。
  if (V / a !== c && near(val, V / a)) {
    return "a だけで わったみたい。c = V ÷ (a × b) なので b でも わってね。";
  }
  // b だけで わった。
  if (V / b !== c && near(val, V / b)) {
    return "b だけで わったみたい。c = V ÷ (a × b) なので a でも わってね。";
  }
  return null;
}

// ==================================================================
// j2em-parallel-proof-angle : 角の計算（平行線・三角形の外角）
// ==================================================================
//
// 三角形の 外角の 性質、内角の和、平行線の 同側内角 を 使って 角を 求める。答えは integer。

function genParallelAngle(): Problem {
  const mode = pick(["extSum", "triRest", "coInterior", "extInner"] as const);

  if (mode === "extSum") {
    // 外角 = となり合わない 2つの 内角の和。
    const a = randInt(25, 80);
    const b = randInt(25, 80);
    const ext = a + b;
    return {
      unitId: "j2em-parallel-proof-angle",
      prompt: `三角形 ABC で ∠A = ${a}°, ∠B = ${b}° のとき、頂点 C の 外角の 大きさは 何度？`,
      answer: String(ext),
      answerType: "integer",
      // mode: 0=外角の和, 1=残りの内角, 2=同側内角, 3=外角から内角。
      meta: { mode: 0, a, b, ext, innerC: 180 - a - b },
    };
  }

  if (mode === "triRest") {
    // 内角の和 180° から 残りの 内角を 求める。
    const a = randInt(25, 90);
    const b = randInt(25, 90);
    const c = 180 - a - b;
    return {
      unitId: "j2em-parallel-proof-angle",
      prompt: `三角形 ABC で ∠A = ${a}°, ∠B = ${b}° のとき、∠C の 大きさは 何度？`,
      answer: String(c),
      answerType: "integer",
      meta: { mode: 1, a, b, c, ext: a + b },
    };
  }

  if (mode === "coInterior") {
    // 平行線の 同側内角（となり合う内角）の 和は 180°。
    const a = randInt(35, 145);
    const ans = 180 - a;
    return {
      unitId: "j2em-parallel-proof-angle",
      prompt:
        `2直線 ℓ と m が 平行で、1本の 直線が 交わっている。` +
        `一方の 内角が ${a}° のとき、同じがわに ある もう1つの 内角（同側内角）は 何度？`,
      answer: String(ans),
      answerType: "integer",
      meta: { mode: 2, a, ans },
    };
  }

  // 外角と 1つの 内角から もう1つの 内角を 求める。
  const a = randInt(25, 80);
  const b = randInt(25, 80);
  const ext = a + b;
  return {
    unitId: "j2em-parallel-proof-angle",
    prompt:
      `三角形 ABC で 頂点 C の 外角が ${ext}°、∠A = ${a}° のとき、` +
      `∠B の 大きさは 何度？`,
    answer: String(b),
    answerType: "integer",
    meta: { mode: 3, a, b, ext },
  };
}

function diagParallelAngle(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  if ([mode, a].some(Number.isNaN)) return null;

  if (mode === 0) {
    const b = mm(meta, "b");
    const ext = mm(meta, "ext");
    if ([b, ext].some(Number.isNaN)) return null;
    // 内角 ∠C を 答えてしまった。
    const innerC = 180 - a - b;
    if (innerC !== ext && near(val, innerC)) {
      return "それは 内角 ∠C だね。外角は となり合わない 2つの 内角の 和（∠A + ∠B）だよ。";
    }
    // 180 から ひいてしまった。
    if (180 - ext !== ext && near(val, 180 - ext)) {
      return "180 から ひく 必要は ないよ。外角は ∠A + ∠B で そのまま 求まるよ。";
    }
    return null;
  }

  if (mode === 1) {
    const b = mm(meta, "b");
    const c = mm(meta, "c");
    if ([b, c].some(Number.isNaN)) return null;
    // 外角（a + b）を 答えてしまった。
    if (a + b !== c && near(val, a + b)) {
      return "それは 頂点 C の「外角」だね。内角 ∠C は 180 − ∠A − ∠B で 求めるよ。";
    }
    return null;
  }

  if (mode === 2) {
    const ans = mm(meta, "ans");
    if (Number.isNaN(ans)) return null;
    // 錯角・同位角と 取りちがえて そのままの 角を 答えた。
    if (a !== ans && near(val, a)) {
      return "等しく なるのは 錯角と 同位角だよ。同じがわの 内角どうしは たして 180° だね。";
    }
    return null;
  }

  // mode === 3：外角から 内角を 求める。
  const b = mm(meta, "b");
  const ext = mm(meta, "ext");
  if ([b, ext].some(Number.isNaN)) return null;
  // 外角を 内角だと 思って 180 から ひいた。
  const wrong1 = 180 - ext - a;
  if (wrong1 !== b && near(val, wrong1)) {
    return "与えられた " + `${ext}` + "° は 内角ではなく 外角だよ。外角 = ∠A + ∠B を 使ってね。";
  }
  // ひき算の 向きを まちがえた。
  if (ext + a !== b && near(val, ext + a)) {
    return "たし算では なく ひき算だね。∠B = 外角 − ∠A で 求まるよ。";
  }
  return null;
}

// ==================================================================
// j2em-congruence-angle : 合同な図形と角
// ==================================================================
//
// △ABC ≡ △DEF の 対応（A↔D, B↔E, C↔F）を 使って 角や 辺を 求める。答えは integer。

function genCongruenceAngle(): Problem {
  const mode = pick(["angleFar", "angleSrc", "angleDirect", "side"] as const);

  if (mode === "angleFar") {
    // △ABC の 2角から ∠F（= ∠C）を 求める。
    const a = randInt(30, 90);
    const b = randInt(30, 90);
    const c = 180 - a - b;
    return {
      unitId: "j2em-congruence-angle",
      prompt:
        `△ABC ≡ △DEF で、∠A = ${a}°, ∠B = ${b}° です。` +
        `∠F の 大きさは 何度？`,
      answer: String(c),
      answerType: "integer",
      // mode: 0=∠F, 1=∠C, 2=対応角そのまま, 3=対応辺。
      meta: { mode: 0, a, b, c },
    };
  }

  if (mode === "angleSrc") {
    // △DEF の 2角から ∠C（= ∠F）を 求める。
    const d = randInt(30, 90);
    const e = randInt(30, 90);
    const f = 180 - d - e;
    return {
      unitId: "j2em-congruence-angle",
      prompt:
        `△ABC ≡ △DEF で、∠D = ${d}°, ∠E = ${e}° です。` +
        `∠C の 大きさは 何度？`,
      answer: String(f),
      answerType: "integer",
      meta: { mode: 1, d, e, f },
    };
  }

  if (mode === "angleDirect") {
    // 対応する 角は 等しい（∠E = ∠B）。
    const e = randInt(30, 130);
    return {
      unitId: "j2em-congruence-angle",
      prompt: `△ABC ≡ △DEF で、∠E = ${e}° です。∠B の 大きさは 何度？`,
      answer: String(e),
      answerType: "integer",
      meta: { mode: 2, e },
    };
  }

  // 対応する 辺は 等しい（EF = BC）。3辺を 相異なる 長さにする。
  const set = new Set<number>();
  while (set.size < 3) set.add(randInt(4, 20));
  const [ab, bc, ca] = Array.from(set);
  return {
    unitId: "j2em-congruence-angle",
    prompt:
      `△ABC ≡ △DEF で、AB = ${ab}cm, BC = ${bc}cm, CA = ${ca}cm です。` +
      `辺 EF の 長さは 何 cm？`,
    answer: String(bc),
    answerType: "integer",
    meta: { mode: 3, ab, bc, ca },
  };
}

function diagCongruenceAngle(problem: Problem, userInput: string): string | null {
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
    const c = mm(meta, "c");
    if ([a, b, c].some(Number.isNaN)) return null;
    // F に 対応するのは C なのに A や B の 角を 答えた。
    if (a !== c && near(val, a)) {
      return "F に 対応するのは C だよ（A↔D, B↔E, C↔F）。∠A の 値では ないね。";
    }
    if (b !== c && near(val, b)) {
      return "F に 対応するのは C だよ（A↔D, B↔E, C↔F）。∠B の 値では ないね。";
    }
    // 内角の和を 使わず 2角を たした。
    if (a + b !== c && near(val, a + b)) {
      return "2つの 角を たしただけに なっているみたい。∠C = 180 − ∠A − ∠B だよ。";
    }
    return null;
  }

  if (mode === 1) {
    const d = mm(meta, "d");
    const e = mm(meta, "e");
    const f = mm(meta, "f");
    if ([d, e, f].some(Number.isNaN)) return null;
    if (d !== f && near(val, d)) {
      return "C に 対応するのは F だよ（A↔D, B↔E, C↔F）。∠D の 値では ないね。";
    }
    if (e !== f && near(val, e)) {
      return "C に 対応するのは F だよ（A↔D, B↔E, C↔F）。∠E の 値では ないね。";
    }
    if (d + e !== f && near(val, d + e)) {
      return "2つの 角を たしただけに なっているみたい。∠F = 180 − ∠D − ∠E だよ。";
    }
    return null;
  }

  if (mode === 2) {
    const e = mm(meta, "e");
    if (Number.isNaN(e)) return null;
    // 補角を 答えた（対応角は そのまま 等しい）。
    if (180 - e !== e && near(val, 180 - e)) {
      return "合同な 図形の 対応する 角は そのまま 等しいよ。180 から ひかなくて いいよ。";
    }
    return null;
  }

  // mode === 3：対応する 辺。
  const ab = mm(meta, "ab");
  const bc = mm(meta, "bc");
  const ca = mm(meta, "ca");
  if ([ab, bc, ca].some(Number.isNaN)) return null;
  if (ab !== bc && near(val, ab)) {
    return "EF に 対応するのは BC だよ（E↔B, F↔C）。AB の 長さでは ないね。";
  }
  if (ca !== bc && near(val, ca)) {
    return "EF に 対応するのは BC だよ（E↔B, F↔C）。CA の 長さでは ないね。";
  }
  return null;
}

// ==================================================================
// j2em-probability-two : 確率（2つのさいころ・玉）
// ==================================================================
//
// 2つの さいころ（全 36通り）や、袋から 2個 同時に 取り出す 場合の 確率。
// 答えは 既約分数（fraction）。

function genProbabilityTwo(): Problem {
  const mode = pick(["diceSum", "diceCond", "ballsTwo"] as const);

  if (mode === "diceSum") {
    // 2つの さいころの 目の和が s になる 場合の数 = 6 − |s − 7|。
    const s = randInt(3, 11);
    const fav = 6 - Math.abs(s - 7);
    return {
      unitId: "j2em-probability-two",
      prompt: `大小 2つの さいころを 同時に 投げるとき、出た 目の 和が ${s} に なる 確率を 既約分数で 求めよ。`,
      answer: formatFraction(fav, 36),
      answerType: "fraction",
      // mode: 0=和, 1=条件, 2=玉2個。
      meta: { mode: 0, s, fav, total: 36 },
    };
  }

  if (mode === "diceCond") {
    // よく出る 条件つき（場合の数は 数え上げ済みの 定数）。
    const cond = pick(
      [
        { label: "同じ目（ぞろ目）が 出る", fav: 6 },
        { label: "出た 目の 和が 偶数に なる", fav: 18 },
        { label: "出た 目の 積が 偶数に なる", fav: 27 },
        { label: "少なくとも 1つは 1 の目が 出る", fav: 11 },
        { label: "2つとも 奇数の 目が 出る", fav: 9 },
        { label: "出た 目の 和が 5以下に なる", fav: 10 },
      ] as const,
    );
    return {
      unitId: "j2em-probability-two",
      prompt: `大小 2つの さいころを 同時に 投げるとき、${cond.label} 確率を 既約分数で 求めよ。`,
      answer: formatFraction(cond.fav, 36),
      answerType: "fraction",
      meta: { mode: 1, fav: cond.fav, total: 36 },
    };
  }

  // 袋から 2個 同時に 取り出して 2個とも 赤に なる 確率。
  const r = randInt(2, 5);
  const w = randInt(2, 5);
  const n = r + w;
  const fav = comb2(r);
  const total = comb2(n);
  return {
    unitId: "j2em-probability-two",
    prompt:
      `袋に 赤玉が ${r}個、白玉が ${w}個 入っている。` +
      `同時に 2個 取り出すとき、2個とも 赤玉に なる 確率を 既約分数で 求めよ。`,
    answer: formatFraction(fav, total),
    answerType: "fraction",
    meta: { mode: 2, r, w, n, fav, total },
  };
}

function diagProbabilityTwo(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const mode = mm(meta, "mode");
  const fav = mm(meta, "fav");
  const total = mm(meta, "total");
  if ([mode, fav, total].some(Number.isNaN)) return null;

  const correct = formatFraction(fav, total);
  const reduced = reduceFraction(fav, total);

  // 約分を わすれた（生の fav/total を そのまま 書いた）。
  if (reduced.den !== total && cleaned === `${fav}/${total}`) {
    return "場合の数は 合っているよ。さいごに 約分するのを わすれたみたい。" +
      `${fav}/${total}` + " を 約分してみてね。";
  }

  const user = normFrac(cleaned);
  if (user === null || user === correct) return null;

  // 分子と 分母を 逆にした。
  if (fav !== 0 && user === formatFraction(total, fav)) {
    return "分数の 上と 下が 逆に なっているみたい。確率は (あてはまる場合) ÷ (全部の場合) だよ。";
  }
  // 反対の 場合（余事象）を 数えた。
  if (user === formatFraction(total - fav, total)) {
    return "反対の 場合（あてはまらない方）を 数えたみたい。きかれている 場合の数を 数えてね。";
  }

  if (mode === 0 || mode === 1) {
    // 全部の 場合を 36通りでなく 12通り（6 + 6）と したみたい。
    if (user === formatFraction(fav, 12)) {
      return "全部の 場合の数は 6 + 6 では なく 6 × 6 = 36通り だよ。分母を 見なおしてね。";
    }
    // さいころ 1個の 6通りで 考えた。
    if (user === formatFraction(fav, 6)) {
      return "さいころは 2つ あるね。全部で 6 × 6 = 36通り だよ。";
    }
    return null;
  }

  // mode === 2：玉を 2個 取り出す。
  const r = mm(meta, "r");
  const n = mm(meta, "n");
  if ([r, n].some(Number.isNaN)) return null;
  // 1個だけ 取り出す 確率（r/n）と 取りちがえた。
  if (user === formatFraction(r, n)) {
    return "それは 1個だけ 取り出すときの 確率だね。2個 同時なので、" +
      "全部の 取り出し方は " + `${n}` + "個から 2個を 選ぶ 組合せで 数えるよ。";
  }
  // 順番を 区別して 数えた（並べ方 = 組合せの 2倍）→ 約分すると 同じなので 分母だけ n(n−1) に した場合。
  if (user === formatFraction(comb2(r), n * (n - 1))) {
    return "分母だけ 順番を 区別して 数えたみたい。分子と 分母で 数え方を そろえてね。";
  }
  return null;
}

// ==================================================================
// j2em-data-median : データの活用（平均・中央値）
// ==================================================================
//
// 小さな データの 平均値 または 中央値 を 求める。
// データの 個数は 奇数にし、平均も 割り切れるように 作るので 答えは 必ず integer。

/** 昇順に ならべた 配列の まん中の 値（奇数個 前提）。 */
function middleOf(sorted: number[]): number {
  return sorted[Math.floor(sorted.length / 2)];
}

function genDataMedian(): Problem {
  const n = pick([5, 7, 9] as const);
  const ask = pick(["mean", "median"] as const);

  // 平均が 整数に なるように データを 作る（合計を n の 倍数に そろえる）。
  const target = randInt(6, 16); // 平均値
  let data: number[] = [];
  let guard = 0;
  while (guard < 200) {
    guard++;
    const head: number[] = [];
    for (let i = 0; i < n - 1; i++) head.push(randInt(1, 25));
    const last = n * target - head.reduce((s, v) => s + v, 0);
    if (last < 1 || last > 25) continue;
    const cand = [...head, last];
    const sortedCand = [...cand].sort((x, y) => x - y);
    // 平均と 中央値が 同じだと 取りちがえの 診断が できないので 避ける。
    if (middleOf(sortedCand) === target) continue;
    data = cand;
    break;
  }
  if (data.length === 0) {
    // 保険：単純な 等差データ（平均＝中央値だが 必ず 整数）。
    data = [];
    for (let i = 0; i < n; i++) data.push(target - Math.floor(n / 2) + i);
  }

  // 表示順を シャッフルする（並べかえの 手順を 意識させる）。
  const shown = [...data];
  for (let i = shown.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shown[i], shown[j]] = [shown[j], shown[i]];
  }
  const sorted = [...shown].sort((x, y) => x - y);
  const sum = shown.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const median = middleOf(sorted);
  const midRaw = shown[Math.floor(n / 2)]; // ならべかえずに とった まん中（よくある誤り）

  const answerVal = ask === "mean" ? mean : median;
  const label = ask === "mean" ? "平均値" : "中央値";

  const metaData: Record<string, number> = {};
  shown.forEach((v, i) => {
    metaData[`d${i}`] = v;
  });

  return {
    unitId: "j2em-data-median",
    prompt: `次の ${n}個の データの ${label} を 求めよ。\n${shown.join(", ")}`,
    answer: String(answerVal),
    answerType: "integer",
    // ask: 0=平均値, 1=中央値。
    meta: {
      ask: ask === "mean" ? 0 : 1,
      n,
      sum,
      mean,
      median,
      midRaw,
      min: sorted[0],
      max: sorted[n - 1],
      ...metaData,
    },
  };
}

function diagDataMedian(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const ask = mm(meta, "ask");
  const n = mm(meta, "n");
  const sum = mm(meta, "sum");
  const mean = mm(meta, "mean");
  const median = mm(meta, "median");
  const midRaw = mm(meta, "midRaw");
  const min = mm(meta, "min");
  const max = mm(meta, "max");
  if ([ask, n, sum, mean, median, midRaw, min, max].some(Number.isNaN)) return null;

  if (ask === 0) {
    // 平均値を きいたのに 中央値を 答えた。
    if (median !== mean && near(val, median)) {
      return "それは 中央値（まん中の 値）だね。平均値は 合計 ÷ 個数 で 求めるよ。";
    }
    // 合計を そのまま 答えた（÷個数 わすれ）。
    if (sum !== mean && near(val, sum)) {
      return "それは 合計だね。さいごに 個数 " + `${n}` + " で わるのを わすれたみたい。";
    }
    // (最大 + 最小) ÷ 2 を 平均だと 思った。
    const midRange = (max + min) / 2;
    if (midRange !== mean && near(val, midRange)) {
      return "最大と 最小だけでは 平均には ならないよ。全部を たして 個数で わってね。";
    }
    return null;
  }

  // ask === 1：中央値。
  if (mean !== median && near(val, mean)) {
    return "それは 平均値だね。中央値は 小さい順に ならべたときの まん中の 値だよ。";
  }
  if (midRaw !== median && near(val, midRaw)) {
    return "ならべかえる 前の まん中を とったみたい。先に 小さい順に ならべてから まん中を 見てね。";
  }
  // 範囲（最大 − 最小）を 答えた。
  if (max - min !== median && near(val, max - min)) {
    return "それは「範囲」だね。中央値は ならべかえた ときの まん中の 値だよ。";
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_J2E: DiagUnitDef[] = [
  {
    id: "j2em-poly-mul-div",
    grade: "中2",
    title: "多項式と数の乗除",
    lesson:
      "多項式に 数を かけるときは、かっこの中の すべての 項に かけます（分配法則）。わるときも 同じで、すべての 項を その数で わります。かっこの 前が マイナスの ときは、中の 符号を 全部 反対に します。",
    hint: "かっこの中の 項に 1つ ずつ かけて（わって）いこう。定数の 項を わすれやすいので 気をつけてね。",
    answerType: "integer",
    generate: genPolyMulDiv,
    diagnose: diagPolyMulDiv,
  },
  {
    id: "j2em-equal-ratio",
    grade: "中2",
    title: "等式の変形",
    lesson:
      "等式を ある文字に ついて 解くことを「等式の 変形」と いいます。両辺に 同じ 数を たしたり、かけたり わったり しても 等式は なりたちます。かっこや わり算が ある ときは、先に それを なくしてから 移項します。",
    hint: "まず ÷2 や かっこを なくそう。そのあとで、求めたい 文字だけを 左に のこすように 移項してね。",
    answerType: "integer",
    generate: genEqualRatio,
    diagnose: diagEqualRatio,
  },
  {
    id: "j2em-parallel-proof-angle",
    grade: "中2",
    title: "角の計算（平行線・三角形の外角）",
    lesson:
      "三角形の 内角の 和は 180° です。1つの 外角は、となり合わない 2つの 内角の 和に 等しく なります。平行線では 錯角と 同位角が 等しく、同じがわの 内角どうしは たすと 180° に なります。",
    hint: "外角は となり合わない 2つの 内角の 和だよ。平行線の ときは どの角が 等しいかを まず 見つけよう。",
    answerType: "integer",
    generate: genParallelAngle,
    diagnose: diagParallelAngle,
  },
  {
    id: "j2em-congruence-angle",
    grade: "中2",
    title: "合同な図形と角",
    lesson:
      "2つの 図形が 合同の とき、対応する 辺の 長さと 対応する 角の 大きさは 等しく なります。△ABC ≡ △DEF と 書いたら、A と D、B と E、C と F が 対応します。辺も AB と DE、BC と EF のように 対応します。",
    hint: "記号の ならび順で 対応が 決まるよ。A↔D, B↔E, C↔F を たしかめてから 答えてね。",
    answerType: "integer",
    generate: genCongruenceAngle,
    diagnose: diagCongruenceAngle,
  },
  {
    id: "j2em-probability-two",
    grade: "中2",
    title: "確率（2つのさいころ・玉）",
    lesson:
      "2つの さいころを 投げる ときは、起こりうる 場合が 6 × 6 = 36通り あります。表や 樹形図を かくと 数えもれが 減ります。確率は「あてはまる 場合の数 ÷ 全部の 場合の数」で、さいごに 約分します。",
    hint: "まず 全部で 何通りか を 数えよう。2つの さいころなら 36通りだよ。答えは 約分を わすれずにね。",
    answerType: "fraction",
    generate: genProbabilityTwo,
    diagnose: diagProbabilityTwo,
  },
  {
    id: "j2em-data-median",
    grade: "中2",
    title: "データの活用（平均・中央値）",
    lesson:
      "平均値は、データを 全部 たして 個数で わった 値です。中央値は、小さい順に ならべた ときの まん中の 値です。平均値と 中央値は ちがう 値に なることが あるので、何を きかれて いるかを たしかめましょう。",
    hint: "平均値なら 合計 ÷ 個数。中央値なら 先に 小さい順に ならべてから まん中を 見つけよう。",
    answerType: "integer",
    generate: genDataMedian,
    diagnose: diagDataMedian,
  },
];
