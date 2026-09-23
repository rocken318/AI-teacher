// 中学1年 数学の単元（J1系）＝問題ジェネレータ群。
// すべての答えはコードで計算して確定させる（生成AIは使わない）。
// 各 def は generate と diagnose を内包し、監督が index で束ねる。

import type { Problem, UnitDef } from "@/lib/math/types";

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

// ------------------------------------------------------------------
// 表示ユーティリティ
// ------------------------------------------------------------------

/** 符号つきの数をかっこ書きにする（例 3 → "(+3)"、-3 → "(-3)"）。 */
function paren(n: number): string {
  return n >= 0 ? `(+${n})` : `(${n})`;
}

/** 定数項を "+ 3" / "- 3" の形にする。 */
function withSign(n: number): string {
  return n >= 0 ? `+ ${n}` : `- ${-n}`;
}

// ==================================================================
// j1m-pos-neg : 正負の数の加減
// ==================================================================
//
// a ± b（a, b は符号つき整数）を計算させる。
// ひき算は「ひく数の符号を変えてたす」が最大のつまずきポイント。

function genPosNeg(): Problem {
  const a = randNonZero(-15, 15);
  const b = randNonZero(-15, 15);
  const isAdd = Math.random() < 0.5;
  const value = isAdd ? a + b : a - b;

  return {
    unitId: "j1m-pos-neg",
    prompt: `${paren(a)} ${isAdd ? "+" : "-"} ${paren(b)} を計算しなさい。`,
    answer: String(value),
    answerType: "integer",
    // op: 1=たし算, 0=ひき算。
    meta: { a, b, op: isAdd ? 1 : 0, value },
  };
}

function diagPosNeg(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const op = mm(meta, "op");
  if ([a, b, op].some(Number.isNaN)) return null;

  const correct = op === 1 ? a + b : a - b;
  if (near(val, correct)) return null;

  if (op === 0) {
    // ひき算なのに そのまま たしてしまった（符号を変え忘れ）。
    const wrong = a + b;
    if (wrong !== correct && near(val, wrong)) {
      return "ひき算は「ひく数の 符号を 反対にして たす」だよ。" +
        `${paren(b)} を ひくので、${b >= 0 ? -b : "+" + -b} を たすことに なるね。`;
    }
  } else {
    // たし算なのに ひいてしまった。
    const wrong = a - b;
    if (wrong !== correct && near(val, wrong)) {
      return "たし算なのに ひき算に なっているみたい。" +
        `${paren(b)} は そのまま たすよ。`;
    }
  }

  // 符号を 無視して 絶対値だけで たしてしまった。
  const absSum = Math.abs(a) + Math.abs(b);
  if (absSum !== correct && near(val, absSum)) {
    return "符号を 見ないで 数だけ たしたみたい。異なる符号どうしなら、大きい方から 小さい方を ひいて、大きい方の符号を つけるよ。";
  }
  // 符号を 無視して 絶対値の差にしてしまった。
  const absDiff = Math.abs(Math.abs(a) - Math.abs(b));
  if (absDiff !== correct && near(val, absDiff)) {
    return "数の 大きさだけで 計算したみたい。同じ符号どうしなら たして その符号、ちがう符号どうしなら ひいて 大きい方の符号だよ。";
  }
  // 答えの 符号だけが 反対。
  if (correct !== 0 && near(val, -correct)) {
    return "計算の 大きさは 合っているよ。答えの 符号が 反対みたい。絶対値の 大きい方の 符号を つけてね。";
  }
  return null;
}

// ==================================================================
// j1m-pos-neg-muldiv : 正負の数の乗除
// ==================================================================
//
// 乗法：a × b。除法：a ÷ b（a = b × q として必ず割り切れるようにする）。
// 同符号なら正、異符号なら負、というルールの定着をねらう。

function genPosNegMulDiv(): Problem {
  const isMul = Math.random() < 0.5;

  if (isMul) {
    const a = randNonZero(-12, 12);
    const b = randNonZero(-9, 9);
    const value = a * b;
    return {
      unitId: "j1m-pos-neg-muldiv",
      prompt: `${paren(a)} × ${paren(b)} を計算しなさい。`,
      answer: String(value),
      answerType: "integer",
      // op: 1=乗法, 0=除法。
      meta: { a, b, op: 1, value },
    };
  }

  // 除法：商 q を先に決め、a = b × q とすることで必ず割り切れる。
  let b = randNonZero(-9, 9);
  while (b === 1 || b === -1) b = randNonZero(-9, 9);
  const q = randNonZero(-9, 9);
  const a = b * q;
  return {
    unitId: "j1m-pos-neg-muldiv",
    prompt: `${paren(a)} ÷ ${paren(b)} を計算しなさい。`,
    answer: String(q),
    answerType: "integer",
    meta: { a, b, op: 0, value: q },
  };
}

function diagPosNegMulDiv(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const op = mm(meta, "op");
  if ([a, b, op].some(Number.isNaN)) return null;
  if (b === 0) return null;

  const correct = op === 1 ? a * b : a / b;
  if (near(val, correct)) return null;

  // 符号だけ まちがえた（もっとも多いミス）。
  if (correct !== 0 && near(val, -correct)) {
    const same = a * b > 0;
    return same
      ? "符号が 反対みたい。同じ符号どうしの かけ算・わり算の 答えは + だよ。"
      : "符号が 反対みたい。ちがう符号どうしの かけ算・わり算の 答えは - だよ。";
  }

  if (op === 1) {
    // かけ算なのに わり算した。
    const wrong = a / b;
    if (wrong !== correct && near(val, wrong)) {
      return "わり算に なっているみたい。この問題は × なので、2つの数を かけてね。";
    }
    // かけ算なのに たし算した。
    const wrong2 = a + b;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "たし算に なっているみたい。この問題は × だよ。まず 数どうしを かけて、あとから 符号を 決めよう。";
    }
  } else {
    // わり算なのに かけ算した。
    const wrong = a * b;
    if (wrong !== correct && near(val, wrong)) {
      return "かけ算に なっているみたい。この問題は ÷ なので、前の数を うしろの数で わってね。";
    }
    // わる数と わられる数を 逆にした。
    if (a !== 0) {
      const wrong2 = b / a;
      if (wrong2 !== correct && near(val, wrong2)) {
        return "わる数と わられる数が 逆みたい。" + `${paren(a)} ÷ ${paren(b)}` + " の順で 計算するよ。";
      }
    }
  }
  return null;
}

// ==================================================================
// j1m-letter-expr : 文字式の計算
// ==================================================================
//
// simplify：ax + bx - cx をまとめたときの x の係数を答える。
// evaluate ：ax + b に x = xv を代入した値を答える。

function genLetterExpr(): Problem {
  const mode = pick(["simplify", "evaluate"] as const);

  if (mode === "simplify") {
    let a = randInt(2, 9);
    let b = randInt(2, 9);
    let c = randInt(1, 9);
    // 係数が 0 になると「x が消える」ので、やさしさ優先で作り直す。
    let guard = 0;
    while (a + b - c === 0 && guard < 50) {
      a = randInt(2, 9);
      b = randInt(2, 9);
      c = randInt(1, 9);
      guard++;
    }
    const coef = a + b - c;
    return {
      unitId: "j1m-letter-expr",
      prompt: `${a}x + ${b}x - ${c}x を計算しなさい。まとめたときの x の係数を答えなさい。`,
      answer: String(coef),
      answerType: "integer",
      // mode: 0=同類項をまとめる, 1=代入。
      meta: { mode: 0, a, b, c, coef },
    };
  }

  // 代入：ax + b に x = xv を代入。
  const a = randNonZero(-8, 8);
  const b = randNonZero(-12, 12);
  const xv = randNonZero(-6, 6);
  const value = a * xv + b;
  return {
    unitId: "j1m-letter-expr",
    prompt: `${a}x ${withSign(b)} について、x = ${xv} のときの式の値を求めなさい。`,
    answer: String(value),
    answerType: "integer",
    meta: { mode: 1, a, b, xv, value },
  };
}

function diagLetterExpr(problem: Problem, userInput: string): string | null {
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
    const correct = a + b - c;
    if (near(val, correct)) return null;

    // 最後の項の ひき算を たし算にしてしまった。
    const wrong = a + b + c;
    if (wrong !== correct && near(val, wrong)) {
      return "さいごの " + `- ${c}x` + " を たしてしまったみたい。ひく項は そのまま ひいてね。";
    }
    // 3つ目の項を 計算に入れ忘れた。
    const wrong2 = a + b;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "3つ目の " + `- ${c}x` + " を 計算に 入れ忘れたみたい。同類項は 全部 まとめるよ。";
    }
    // 係数を かけてしまった。
    const wrong3 = a * b * c;
    if (wrong3 !== correct && near(val, wrong3)) {
      return "係数を かけてしまったみたい。同類項を まとめるときは 係数を たしひきするよ。";
    }
    return null;
  }

  // mode === 1：代入。
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const xv = mm(meta, "xv");
  if ([a, b, xv].some(Number.isNaN)) return null;
  const correct = a * xv + b;
  if (near(val, correct)) return null;

  // 定数項 b を たし忘れた。
  const wrong = a * xv;
  if (wrong !== correct && near(val, wrong)) {
    return "定数の " + `${b}` + " を たすのを わすれたみたい。ax + b の + b も 計算してね。";
  }
  // ax を「a + x」と かんちがいした。
  const wrong2 = a + xv + b;
  if (wrong2 !== correct && near(val, wrong2)) {
    return `${a}x` + " は " + `${a} × x` + " という意味だよ。たし算ではなく かけ算をしてね。";
  }
  // 先に a + b をしてから x を かけてしまった。
  const wrong3 = (a + b) * xv;
  if (wrong3 !== correct && near(val, wrong3)) {
    return "先に " + `${a}` + " と " + `${b}` + " を たしてしまったみたい。かけ算を 先に、たし算は あとだよ。";
  }
  // 定数項の 符号を まちがえた。
  const wrong4 = a * xv - b;
  if (wrong4 !== correct && near(val, wrong4)) {
    return "定数の 符号が 反対みたい。式の " + `${withSign(b)}` + " を そのまま 使ってね。";
  }
  return null;
}

// ==================================================================
// j1m-linear-eq : 一次方程式
// ==================================================================
//
// ax + b = c を解いて x を答える。x が整数になるよう c を逆算して作る。

function genLinearEqJ1(): Problem {
  const a = randNonZero(2, 9);
  const x = randInt(-9, 9);
  const b = randNonZero(-12, 12);
  const c = a * x + b;

  return {
    unitId: "j1m-linear-eq",
    prompt: `方程式 ${a}x ${withSign(b)} = ${c} を解きなさい。x = ?`,
    answer: String(x),
    answerType: "integer",
    meta: { a, b, c, x },
  };
}

function diagLinearEqJ1(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a = mm(meta, "a");
  const b = mm(meta, "b");
  const c = mm(meta, "c");
  if ([a, b, c].some(Number.isNaN)) return null;
  if (a === 0) return null;

  const correct = (c - b) / a;
  if (near(val, correct)) return null;

  // 移項のとき 符号を 変えなかった。
  const wrong = (c + b) / a;
  if (wrong !== correct && near(val, wrong)) {
    return "移項するときに 符号を 変えるのを わすれたみたい。左の " +
      `${withSign(b)}` + " を 右へ うつすと 符号が 反対に なるよ。";
  }
  // b を 移項せずに c ÷ a にしてしまった。
  const wrong2 = c / a;
  if (wrong2 !== correct && near(val, wrong2)) {
    return "定数の " + `${b}` + " を 右辺へ うつすのを わすれたみたい。まず 数だけを 右に 集めてね。";
  }
  // a で わるのを わすれた（c - b で止まった）。
  const wrong3 = c - b;
  if (wrong3 !== correct && near(val, wrong3)) {
    return "さいごに " + `${a}` + " で わるのを わすれたみたい。" + `${a}x = ${c - b}` + " まで 来たら 両辺を " + `${a}` + " で わるよ。";
  }
  // わる代わりに かけてしまった。
  const wrong4 = (c - b) * a;
  if (wrong4 !== correct && near(val, wrong4)) {
    return "さいごは かけ算ではなく わり算だよ。" + `${a}x = ${c - b}` + " の 両辺を " + `${a}` + " で わってね。";
  }
  return null;
}

// ==================================================================
// j1m-proportion : 比例・反比例
// ==================================================================
//
// 比例  ：y = ax。1組の (x, y) から a を求め、別の x での y を答える。
// 反比例：y = a/x。a = x1 × y1 を求め、a の約数である x2 での y を答える。

/** n の 2 以上 n 以下の約数を返す（n ≥ 2 を想定）。 */
function divisorsFrom2(n: number): number[] {
  const out: number[] = [];
  for (let d = 2; d <= n; d++) {
    if (n % d === 0) out.push(d);
  }
  return out;
}

function genProportion(): Problem {
  const mode = pick(["direct", "inverse"] as const);

  if (mode === "direct") {
    const a = randInt(2, 9); // 比例定数（整数）
    const x1 = randInt(2, 6);
    const y1 = a * x1;
    let x2 = randInt(2, 9);
    let guard = 0;
    while (x2 === x1 && guard < 50) {
      x2 = randInt(2, 9);
      guard++;
    }
    const y2 = a * x2;
    return {
      unitId: "j1m-proportion",
      prompt:
        `y は x に比例し、x = ${x1} のとき y = ${y1} です。` +
        `x = ${x2} のときの y の値を求めなさい。`,
      answer: String(y2),
      answerType: "integer",
      // mode: 0=比例, 1=反比例。
      meta: { mode: 0, a, x1, y1, x2, y2 },
    };
  }

  // 反比例：a = x1 × y1。x2 は a の約数から選ぶので y2 は必ず整数。
  const x1 = randInt(2, 6);
  const y1 = randInt(2, 12);
  const a = x1 * y1;
  const cands = divisorsFrom2(a).filter((d) => d !== x1);
  const x2 = cands.length > 0 ? pick(cands) : x1;
  const y2 = a / x2;
  return {
    unitId: "j1m-proportion",
    prompt:
      `y は x に反比例し、x = ${x1} のとき y = ${y1} です。` +
      `x = ${x2} のときの y の値を求めなさい。`,
    answer: String(y2),
    answerType: "integer",
    meta: { mode: 1, a, x1, y1, x2, y2 },
  };
}

function diagProportion(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  const a = mm(meta, "a");
  const x1 = mm(meta, "x1");
  const y1 = mm(meta, "y1");
  const x2 = mm(meta, "x2");
  if ([mode, a, x1, y1, x2].some(Number.isNaN)) return null;
  if (x1 === 0 || x2 === 0) return null;

  if (mode === 0) {
    const correct = a * x2;
    if (near(val, correct)) return null;

    // 比例定数 a を そのまま 答えた。
    if (a !== correct && near(val, a)) {
      return "それは 比例定数 a の 値だね。求めるのは y なので、y = a × x に x を 代入してね。";
    }
    // 差でふえると かんちがいした（y1 + (x2 - x1)）。
    const wrong = y1 + (x2 - x1);
    if (wrong !== correct && near(val, wrong)) {
      return "x が ふえた分だけ y も ふえる、と考えたみたい。比例は 何倍かの 関係だよ。まず y ÷ x で 比例定数を 出そう。";
    }
    // 反比例の式を 使ってしまった。
    const wrong2 = (x1 * y1) / x2;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "反比例の 式を 使ったみたい。比例は y = a × x（a = y ÷ x）だよ。";
    }
    return null;
  }

  // mode === 1：反比例。
  const correct = a / x2;
  if (near(val, correct)) return null;

  // 比例定数 a を そのまま 答えた。
  if (a !== correct && near(val, a)) {
    return "それは 比例定数 a（= x × y）の 値だね。求めるのは y なので、a を x で わってね。";
  }
  // わる代わりに かけてしまった。
  const wrong = a * x2;
  if (wrong !== correct && near(val, wrong)) {
    return "a を かけてしまったみたい。反比例は y = a ÷ x なので、" + `${a} ÷ ${x2}` + " だよ。";
  }
  // 比例の式を 使ってしまった。
  const wrong2 = (y1 / x1) * x2;
  if (wrong2 !== correct && near(val, wrong2)) {
    return "比例の 式を 使ったみたい。反比例は x × y が いつも 同じ になるよ。";
  }
  // x2 と y2 を 取りちがえた（x2 をそのまま答えた）。
  if (x2 !== correct && near(val, x2)) {
    return "それは x の 値だね。きかれているのは そのときの y の 値だよ。";
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_J1: DiagUnitDef[] = [
  {
    id: "j1m-pos-neg",
    grade: "中1",
    title: "正負の数の加減",
    lesson:
      "同じ符号どうしを たすときは、数を たして その符号を つけます。ちがう符号どうしのときは、大きい数から 小さい数を ひいて、大きい方の符号を つけます。ひき算は「ひく数の 符号を 反対にして たす」と 考えると かんたんです。",
    hint: "ひき算は、ひく数の 符号を 反対にして たし算に 直してみよう。",
    answerType: "integer",
    generate: genPosNeg,
    diagnose: diagPosNeg,
  },
  {
    id: "j1m-pos-neg-muldiv",
    grade: "中1",
    title: "正負の数の乗除",
    lesson:
      "かけ算・わり算では、まず 数（絶対値）どうしを 計算します。符号は、同じ符号どうしなら +、ちがう符号どうしなら - に なります。たし算・ひき算とは ルールが ちがうので 気をつけましょう。",
    hint: "先に 数だけを 計算して、あとから 符号を 決めよう。同符号なら +、異符号なら - だよ。",
    answerType: "integer",
    generate: genPosNegMulDiv,
    diagnose: diagPosNegMulDiv,
  },
  {
    id: "j1m-letter-expr",
    grade: "中1",
    title: "文字式の計算",
    lesson:
      "3x や 5x のように 同じ文字の 項を 同類項と いいます。同類項は、係数どうしを たしひきして 1つに まとめます。文字に 数を 代入するときは、3x を 3 × x に 直してから 計算します。",
    hint: "同じ文字どうしの 係数を たしひきしよう。代入のときは かけ算を 先に するよ。",
    answerType: "integer",
    generate: genLetterExpr,
    diagnose: diagLetterExpr,
  },
  {
    id: "j1m-linear-eq",
    grade: "中1",
    title: "一次方程式",
    lesson:
      "方程式は、文字の 項を 左辺に、数の 項を 右辺に 移項して 解きます。移項すると 符号が 反対に なります。さいごに 両辺を x の 係数で わると、x の 値が 求まります。",
    hint: "まず 数を 右辺へ 移項しよう。そのとき 符号が 反対に なるよ。",
    answerType: "integer",
    generate: genLinearEqJ1,
    diagnose: diagLinearEqJ1,
  },
  {
    id: "j1m-proportion",
    grade: "中1",
    title: "比例・反比例",
    lesson:
      "比例は y = a × x で 表され、a（比例定数）は y ÷ x で 求まります。反比例は y = a ÷ x で 表され、a は x × y で 求まります。まず 与えられた 1組の 値から a を 出すのが 手順の 第一歩です。",
    hint: "はじめに 比例定数 a を 求めよう。比例なら y ÷ x、反比例なら x × y だよ。",
    answerType: "integer",
    generate: genProportion,
    diagnose: diagProportion,
  },
];
