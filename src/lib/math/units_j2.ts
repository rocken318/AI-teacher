// 中学2年 数学の追加単元（J2系）＝問題ジェネレータ群。
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

// reduceFraction / formatRatio は将来の単元拡張のために import 済み。
// 現状の未使用警告を避けるための軽い参照（副作用なし）。
void reduceFraction;
void formatRatio;

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
// j2m-poly-add : 式の計算（多項式の加減・数値代入）
// ==================================================================
//
// (a1 x + b1 y) と (a2 x + b2 y) の和／差に x=xv, y=yv を代入した値を答えさせる。
// 係数の同類項をまとめる過程を確実にチェックできるよう、最後は数値化する。

function genPolyAdd(): Problem {
  const a1 = randNonZero(-6, 6);
  const b1 = randNonZero(-6, 6);
  const a2 = randNonZero(-6, 6);
  const b2 = randNonZero(-6, 6);
  const xv = randInt(1, 5);
  const yv = randInt(1, 5);
  const isAdd = Math.random() < 0.5;

  const sign = isAdd ? 1 : -1;
  const ax = a1 + sign * a2; // まとめた x の係数
  const by = b1 + sign * b2; // まとめた y の係数
  const value = ax * xv + by * yv;

  const term = (coef: number, v: string) => `${coef}${v}`;
  const first = `(${term(a1, "x")}${b1 >= 0 ? "+" : ""}${term(b1, "y")})`;
  const second = `(${term(a2, "x")}${b2 >= 0 ? "+" : ""}${term(b2, "y")})`;
  const op = isAdd ? "+" : "-";

  return {
    unitId: "j2m-poly-add",
    prompt: `${first} ${op} ${second} を計算し、x=${xv}, y=${yv} のときの値を求めよ。`,
    answer: String(value),
    answerType: "integer",
    // op: 1=和, 0=差。
    meta: { a1, b1, a2, b2, xv, yv, op: isAdd ? 1 : 0, ax, by, value },
  };
}

function diagPolyAdd(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const a1 = mm(meta, "a1");
  const b1 = mm(meta, "b1");
  const a2 = mm(meta, "a2");
  const b2 = mm(meta, "b2");
  const xv = mm(meta, "xv");
  const yv = mm(meta, "yv");
  const op = mm(meta, "op");
  if ([a1, b1, a2, b2, xv, yv, op].some(Number.isNaN)) return null;

  const correctAx = a1 + (op === 1 ? 1 : -1) * a2;
  const correctBy = b1 + (op === 1 ? 1 : -1) * b2;
  const correct = correctAx * xv + correctBy * yv;

  if (op === 0) {
    // 差なのに符号を変えず全部たしてしまった（かっこの前のマイナスを配れなかった）。
    const wrongAx = a1 + a2;
    const wrongBy = b1 + b2;
    const wrong = wrongAx * xv + wrongBy * yv;
    if (wrong !== correct && near(val, wrong)) {
      return "うしろのかっこの前がマイナスのとき、中の符号を全部反対にするのを わすれたみたい。-（○x+△y）は -○x-△y だよ。";
    }
    // うしろの x だけ符号を変えて y を変え忘れた（部分的な符号ミス）。
    const wrongY = correctAx * xv + (b1 + b2) * yv;
    if (wrongY !== correct && near(val, wrongY)) {
      return "x の符号は直せたけど、y の符号を変えるのを わすれたみたい。かっこの中は x も y も反対にするよ。";
    }
  }
  // x と y の係数を取りちがえて代入した（同類項の取り違え）。
  const swapped = correctAx * yv + correctBy * xv;
  if (swapped !== correct && near(val, swapped)) {
    return "x にまとめる係数と y にまとめる係数を 取りちがえたみたい。x どうし・y どうしを まとめてね。";
  }
  return null;
}

// ==================================================================
// j2m-mono-muldiv : 単項式の乗除（数値代入で数値化）
// ==================================================================
//
// 乗法：(c1 x^p1) × (c2 x^p2) に x=xv を代入。
// 除法：(c1 x^p1) ÷ (c2 x^p2)（割り切れる指数）に x=xv を代入。

function genMonoMulDiv(): Problem {
  const isMul = Math.random() < 0.5;
  const xv = randInt(2, 3);

  if (isMul) {
    const c1 = randNonZero(-5, 5);
    const c2 = randNonZero(-5, 5);
    const p1 = randInt(1, 3);
    const p2 = randInt(1, 3);
    const coef = c1 * c2;
    const pow = p1 + p2;
    const value = coef * Math.pow(xv, pow);
    return {
      unitId: "j2m-mono-muldiv",
      prompt: `${c1}x${sup(p1)} × ${c2}x${sup(p2)} を計算し、x=${xv} のときの値を求めよ。`,
      answer: String(value),
      answerType: "integer",
      // op: 1=乗, 0=除。
      meta: { c1, c2, p1, p2, xv, op: 1, coef, pow, value },
    };
  }

  // 除法：割り切れる係数・指数にする。
  const c2 = randNonZero(-5, 5);
  const q = randNonZero(-5, 5); // 商の係数
  const c1 = c2 * q; // 割り切れる
  const p2 = randInt(1, 2);
  const dp = randInt(1, 2); // 指数差（≥1 で正の指数）
  const p1 = p2 + dp;
  const coef = c1 / c2; // = q
  const pow = p1 - p2; // = dp
  const value = coef * Math.pow(xv, pow);
  return {
    unitId: "j2m-mono-muldiv",
    prompt: `${c1}x${sup(p1)} ÷ ${c2}x${sup(p2)} を計算し、x=${xv} のときの値を求めよ。`,
    answer: String(value),
    answerType: "integer",
    meta: { c1, c2, p1, p2, xv, op: 0, coef, pow, value },
  };
}

/** 指数を上付き風の文字列にする（表示用。2,3 のみ想定、それ以外は ^n）。 */
function sup(n: number): string {
  if (n === 1) return "";
  if (n === 2) return "²";
  if (n === 3) return "³";
  if (n === 4) return "⁴";
  return `^${n}`;
}

function diagMonoMulDiv(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const c1 = mm(meta, "c1");
  const c2 = mm(meta, "c2");
  const p1 = mm(meta, "p1");
  const p2 = mm(meta, "p2");
  const xv = mm(meta, "xv");
  const op = mm(meta, "op");
  if ([c1, c2, p1, p2, xv, op].some(Number.isNaN)) return null;

  const correctPow = op === 1 ? p1 + p2 : p1 - p2;
  const correctCoef = op === 1 ? c1 * c2 : c1 / c2;
  const correct = correctCoef * Math.pow(xv, correctPow);

  if (op === 1) {
    // 指数をかけてしまった（本当は たす）。
    const wrongPow = p1 * p2;
    const wrong = c1 * c2 * Math.pow(xv, wrongPow);
    if (wrong !== correct && near(val, wrong)) {
      return "指数を かけ算しちゃったみたい。同じ文字の かけ算では 指数は たすよ（x² × x³ = x⁵）。";
    }
  } else {
    // 指数を わってしまった（本当は ひく）。
    if (p2 !== 0 && Number.isInteger(p1 / p2)) {
      const wrongPow = p1 / p2;
      const wrong = (c1 / c2) * Math.pow(xv, wrongPow);
      if (wrong !== correct && near(val, wrong)) {
        return "指数を わり算しちゃったみたい。同じ文字の わり算では 指数は ひくよ（x⁵ ÷ x² = x³）。";
      }
    }
  }
  return null;
}

// ==================================================================
// j2m-linear-eq : 一次方程式・連立方程式
// ==================================================================
//
// 単独：ax + b = c を解いて x を答える（整数解になるよう設計）。
// 連立：x, y を先に決め、その値になる2式を作り「x+y の値」を答えさせる。

function genLinearEq(): Problem {
  const isSystem = Math.random() < 0.5;

  if (!isSystem) {
    // ax + b = c、x は整数解。
    const a = randNonZero(2, 6);
    const x = randInt(-6, 6);
    const b = randInt(-9, 9);
    const c = a * x + b;
    return {
      unitId: "j2m-linear-eq",
      prompt: `方程式 ${a}x ${b >= 0 ? "+ " + b : "- " + -b} = ${c} を解きなさい。x = ?`,
      answer: String(x),
      answerType: "integer",
      // kind: 0=単独。
      meta: { kind: 0, a, b, c, x },
    };
  }

  // 連立：x + y の値を答える。
  const x = randInt(-5, 5);
  const y = randInt(-5, 5);
  // 1本目: a1 x + b1 y = c1、2本目: a2 x + b2 y = c2（係数を分けて一意解に）。
  const a1 = randNonZero(1, 4);
  const b1 = randNonZero(1, 4);
  let a2 = randNonZero(1, 4);
  let b2 = randNonZero(1, 4);
  // 平行（解なし/不定）回避：行列式 a1*b2 - a2*b1 ≠ 0 を保証。
  let guard = 0;
  while (a1 * b2 - a2 * b1 === 0 && guard < 50) {
    a2 = randNonZero(1, 4);
    b2 = randNonZero(1, 4);
    guard++;
  }
  const c1 = a1 * x + b1 * y;
  const c2 = a2 * x + b2 * y;
  const sum = x + y;
  return {
    unitId: "j2m-linear-eq",
    prompt: `連立方程式 { ${a1}x + ${b1}y = ${c1} , ${a2}x + ${b2}y = ${c2} } を解き、x + y の値を求めよ。`,
    answer: String(sum),
    answerType: "integer",
    // kind: 1=連立。
    meta: { kind: 1, a1, b1, c1, a2, b2, c2, x, y, sum },
  };
}

function diagLinearEq(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const kind = mm(meta, "kind");
  if (Number.isNaN(kind)) return null;

  if (kind === 0) {
    const a = mm(meta, "a");
    const b = mm(meta, "b");
    const c = mm(meta, "c");
    if ([a, b, c].some(Number.isNaN)) return null;
    // 移項の符号ミス：b を移項するとき符号を変えず (c + b)/a としてしまった。
    const wrong = (c + b) / a;
    const correct = (c - b) / a;
    if (wrong !== correct && near(val, wrong)) {
      return "移項するとき 符号を変えるのを わすれたみたい。+" + `${b >= 0 ? b : "(" + b + ")"}` +
        " を右へ移すと 符号が反対になるよ。";
    }
    // b を全く動かさず c/a としてしまった。
    const wrong2 = c / a;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "定数 " + `${b}` + " を 右辺へ移すのを わすれたみたい。まず " + `${b}` + " を移項してね。";
    }
    return null;
  }

  // kind === 1：連立。x+y が正解。
  const x = mm(meta, "x");
  const y = mm(meta, "y");
  if ([x, y].some(Number.isNaN)) return null;
  // x - y や y - x を答えた（和と差の取りちがえ）。
  if (x - y !== x + y && near(val, x - y)) {
    return "x と y は 出せたかな。でも きかれているのは x + y（和）だよ。x - y になっていないか たしかめてね。";
  }
  return null;
}

// ==================================================================
// j2m-linear-func : 一次関数（y=ax+b の値・変化の割合）
// ==================================================================

function genLinearFunc(): Problem {
  const mode = pick(["value", "rate"] as const);
  const a = randNonZero(-5, 5);
  const b = randInt(-9, 9);

  if (mode === "value") {
    const xv = randInt(-6, 6);
    const y = a * xv + b;
    return {
      unitId: "j2m-linear-func",
      prompt: `一次関数 y = ${a}x ${b >= 0 ? "+ " + b : "- " + -b} について、x = ${xv} のときの y の値を求めよ。`,
      answer: String(y),
      answerType: "integer",
      // mode: 0=値, 1=変化の割合。
      meta: { mode: 0, a, b, xv, y },
    };
  }

  // 変化の割合＝傾き a。2点を与えて (Δy/Δx) を答えさせる。
  const x1 = randInt(-5, 2);
  const dx = randInt(1, 5);
  const x2 = x1 + dx;
  const y1 = a * x1 + b;
  const y2 = a * x2 + b;
  return {
    unitId: "j2m-linear-func",
    prompt: `一次関数 y = ${a}x ${b >= 0 ? "+ " + b : "- " + -b} で、x が ${x1} から ${x2} まで変わるときの変化の割合を求めよ。`,
    answer: String(a),
    answerType: "integer",
    meta: { mode: 1, a, b, x1, x2, y1, y2 },
  };
}

function diagLinearFunc(problem: Problem, userInput: string): string | null {
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
    const xv = mm(meta, "xv");
    if (Number.isNaN(xv)) return null;
    const correct = a * xv + b;
    // 傾きと切片の取りちがえ：b*x + a としてしまった。
    const wrong = b * xv + a;
    if (wrong !== correct && near(val, wrong)) {
      return "傾き a と 切片 b を 取りちがえたみたい。y = a×x + b なので、x に かけるのは a だよ。";
    }
    // 切片 b をたし忘れ：a*x のみ。
    const wrong2 = a * xv;
    if (wrong2 !== correct && near(val, wrong2)) {
      return "切片 " + `${b}` + " を たすのを わすれたみたい。y = ax + b の + b も 計算してね。";
    }
    return null;
  }

  // mode === 1：変化の割合＝a。切片 b を答えてしまった。
  if (b !== a && near(val, b)) {
    return "変化の割合は 傾き a のことだよ。切片 b と 取りちがえていないか たしかめてね。";
  }
  return null;
}

// ==================================================================
// j2m-angles : 平行線と角・多角形の内角/外角
// ==================================================================

function genAngles(): Problem {
  const mode = pick(["parallel", "interior", "exterior"] as const);

  if (mode === "parallel") {
    // 平行線と同位角・錯角。与えた角に等しい角を答える（値がそのまま等しい）。
    const ang = randInt(35, 145);
    const kind = pick(["同位角", "錯角"] as const);
    return {
      unitId: "j2m-angles",
      prompt: `2直線が平行なとき、${ang}° の角の${kind}の大きさは何度？`,
      answer: String(ang),
      answerType: "integer",
      // mode: 0=平行線, 1=内角和, 2=外角。
      meta: { mode: 0, ang },
    };
  }

  if (mode === "interior") {
    // 多角形の内角の和 = (n-2)×180。
    const n = randInt(3, 12);
    const sum = (n - 2) * 180;
    return {
      unitId: "j2m-angles",
      prompt: `${n}角形の内角の和は何度？`,
      answer: String(sum),
      answerType: "integer",
      meta: { mode: 1, n, sum },
    };
  }

  // 多角形の外角の和は常に 360°。ここでは正多角形の1つの外角を問う。
  const n = pick([3, 4, 5, 6, 8, 9, 10, 12] as const);
  const ext = 360 / n; // n は 360 の約数から選び整数化
  return {
    unitId: "j2m-angles",
    prompt: `正${n}角形の1つの外角の大きさは何度？`,
    answer: String(ext),
    answerType: "integer",
    meta: { mode: 2, n, ext },
  };
}

function diagAngles(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  if (Number.isNaN(mode)) return null;

  if (mode === 1) {
    // 内角の和。n を取りちがえて n×180 や (n-1)×180 としてしまった。
    const n = mm(meta, "n");
    if (Number.isNaN(n)) return null;
    const correct = (n - 2) * 180;
    if (near(val, n * 180)) {
      return "(n − 2) の「− 2」を わすれたみたい。三角形が (n − 2) 個 できるから ×180 だよ。";
    }
    if (near(val, (n - 1) * 180)) {
      return "(n − 2) の 2 を 1 にしてしまったみたい。頂点から 対角線で 分けると 三角形は (n − 2) 個 だよ。";
    }
    // 外角の和 360 と取りちがえ。
    if (correct !== 360 && near(val, 360)) {
      return "それは「外角の和」だね。内角の和は (n − 2) × 180 で 計算するよ。";
    }
    return null;
  }

  if (mode === 2) {
    // 正n角形の外角。内角（180 - 外角）を答えてしまった。
    const n = mm(meta, "n");
    if (Number.isNaN(n)) return null;
    const ext = 360 / n;
    const interior = 180 - ext;
    if (interior !== ext && near(val, interior)) {
      return "それは 1つの「内角」だね。1つの外角は 360 ÷ n で 求めるよ（外角の和は 360°）。";
    }
    return null;
  }

  return null;
}

// ==================================================================
// j2m-probability : 確率（さいころ・玉・コイン）
// ==================================================================

function genProbability(): Problem {
  const mode = pick(["dice", "balls", "coins"] as const);

  if (mode === "dice") {
    // 1個のさいころ。条件で場合の数を変える。
    const cond = pick(
      [
        { label: "偶数の目が出る", fav: 3 },
        { label: "3以上の目が出る", fav: 4 },
        { label: "3の倍数の目が出る", fav: 2 },
        { label: "5以上の目が出る", fav: 2 },
        { label: "1の目が出る", fav: 1 },
      ] as const,
    );
    return {
      unitId: "j2m-probability",
      prompt: `1個のさいころを投げるとき、${cond.label}確率を既約分数で求めよ。`,
      answer: formatFraction(cond.fav, 6),
      answerType: "fraction",
      // mode: 0=dice,1=balls,2=coins。fav=好ましい場合の数, total=全事象。
      meta: { mode: 0, fav: cond.fav, total: 6 },
    };
  }

  if (mode === "balls") {
    // 赤 r 個・白 w 個から1個引く。赤を引く確率。
    const r = randInt(1, 5);
    const w = randInt(1, 5);
    const total = r + w;
    return {
      unitId: "j2m-probability",
      prompt: `袋に赤玉が ${r}個、白玉が ${w}個 入っている。1個取り出すとき、赤玉が出る確率を既約分数で求めよ。`,
      answer: formatFraction(r, total),
      answerType: "fraction",
      meta: { mode: 1, fav: r, total },
    };
  }

  // コインを2枚投げる。全4通り。条件で場合の数を変える。
  const cond = pick(
    [
      { label: "2枚とも表になる", fav: 1 },
      { label: "表と裏が1枚ずつ出る", fav: 2 },
      { label: "少なくとも1枚は表になる", fav: 3 },
    ] as const,
  );
  return {
    unitId: "j2m-probability",
    prompt: `2枚のコインを同時に投げるとき、${cond.label}確率を既約分数で求めよ。`,
    answer: formatFraction(cond.fav, 4),
    answerType: "fraction",
    meta: { mode: 2, fav: cond.fav, total: 4 },
  };
}

function diagProbability(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const fav = mm(meta, "fav");
  const total = mm(meta, "total");
  if ([fav, total].some(Number.isNaN)) return null;

  const user = normFrac(cleaned);
  const correct = formatFraction(fav, total);
  if (user === null || user === correct) return null;

  // 分母と分子を逆にした。
  if (fav !== 0 && user === formatFraction(total, fav)) {
    return "分数の 上と下が 逆になっているみたい。確率は (あてはまる場合) ÷ (全部の場合) だよ。";
  }
  // 全事象の数え違い：total±1 を分母にしてしまった。
  if (user === formatFraction(fav, total + 1) || user === formatFraction(fav, total - 1)) {
    return "全部の場合の数（分母）を 数えまちがえたみたい。起こりうる すべてを もう一度 数えてね。";
  }
  // 「あてはまらない」場合を数えた（余事象）。
  if (user === formatFraction(total - fav, total)) {
    return "反対の場合（あてはまらない方）を 数えたみたい。きかれている場合の数を 数えてね。";
  }
  return null;
}

// ==================================================================
// j2m-simeq-word : 連立方程式の文章題（数値を1つ答える）
// ==================================================================
//
// 「大人 x 円・子ども y 円のチケット」型。合計枚数と合計金額から
// 大人の枚数（または子どもの枚数）を答えさせる。整数解になるよう設計。

function genSimeqWord(): Problem {
  // 大人 a 人・子ども c 人。単価は固定的な値。
  const adult = randInt(2, 8); // 大人の人数（答え候補）
  const child = randInt(2, 8); // 子どもの人数
  const priceA = pick([300, 400, 500, 600] as const);
  const priceC = pick([100, 150, 200, 250] as const);
  const totalPeople = adult + child;
  const totalMoney = adult * priceA + child * priceC;
  const askAdult = Math.random() < 0.5;
  const answer = askAdult ? adult : child;

  return {
    unitId: "j2m-simeq-word",
    prompt:
      `大人1人 ${priceA}円、子ども1人 ${priceC}円 の入館料です。` +
      `大人と子ども 合わせて ${totalPeople}人 で 入館し、料金の合計は ${totalMoney}円 でした。` +
      `${askAdult ? "大人" : "子ども"} は何人？`,
    answer: String(answer),
    answerType: "integer",
    // askAdult: 1=大人を問う, 0=子どもを問う。
    meta: {
      adult,
      child,
      priceA,
      priceC,
      totalPeople,
      totalMoney,
      askAdult: askAdult ? 1 : 0,
      answer,
    },
  };
}

function diagSimeqWord(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const adult = mm(meta, "adult");
  const child = mm(meta, "child");
  const askAdult = mm(meta, "askAdult");
  const totalPeople = mm(meta, "totalPeople");
  if ([adult, child, askAdult, totalPeople].some(Number.isNaN)) return null;

  const answer = askAdult === 1 ? adult : child;
  const other = askAdult === 1 ? child : adult;
  // もう一方の人数を答えた（大人と子どもの取りちがえ）。
  if (other !== answer && near(val, other)) {
    return "大人と 子どもを 取りちがえたみたい。きかれているのは " +
      `${askAdult === 1 ? "大人" : "子ども"}` + " の人数だよ。";
  }
  // 合計人数をそのまま答えた（立式せず）。
  if (near(val, totalPeople)) {
    return "それは「合わせた人数」だね。合計金額の式も 立てて、2つの式から 求めてね。";
  }
  return null;
}

// ==================================================================
// j2m-area-figure : 図形の求積（三角形・平行四辺形・台形）
// ==================================================================

function genAreaFigure(): Problem {
  const mode = pick(["triangle", "parallelogram", "trapezoid"] as const);

  if (mode === "triangle") {
    // 面積 = 底辺 × 高さ ÷ 2。整数になるよう積を偶数にする。
    let base = randInt(3, 20);
    let height = randInt(3, 20);
    if ((base * height) % 2 !== 0) height += 1; // 積を偶数化
    const area = (base * height) / 2;
    return {
      unitId: "j2m-area-figure",
      prompt: `底辺 ${base}cm、高さ ${height}cm の三角形の面積は何 cm²？`,
      answer: String(area),
      answerType: "integer",
      // mode: 0=三角形,1=平行四辺形,2=台形。
      meta: { mode: 0, base, height, area },
    };
  }

  if (mode === "parallelogram") {
    // 面積 = 底辺 × 高さ。
    const base = randInt(3, 20);
    const height = randInt(3, 20);
    const area = base * height;
    return {
      unitId: "j2m-area-figure",
      prompt: `底辺 ${base}cm、高さ ${height}cm の平行四辺形の面積は何 cm²？`,
      answer: String(area),
      answerType: "integer",
      meta: { mode: 1, base, height, area },
    };
  }

  // 台形：面積 = (上底 + 下底) × 高さ ÷ 2。整数化。
  let top = randInt(2, 15);
  let bottom = randInt(top + 1, 20);
  let height = randInt(3, 20);
  if (((top + bottom) * height) % 2 !== 0) height += 1;
  const area = ((top + bottom) * height) / 2;
  return {
    unitId: "j2m-area-figure",
    prompt: `上底 ${top}cm、下底 ${bottom}cm、高さ ${height}cm の台形の面積は何 cm²？`,
    answer: String(area),
    answerType: "integer",
    meta: { mode: 2, top, bottom, height, area },
  };
}

function diagAreaFigure(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);
  const mode = mm(meta, "mode");
  if (Number.isNaN(mode)) return null;

  if (mode === 0) {
    // 三角形：÷2 を忘れて 底辺×高さ を答えた。
    const base = mm(meta, "base");
    const height = mm(meta, "height");
    if ([base, height].some(Number.isNaN)) return null;
    if (near(val, base * height)) {
      return "さいごに ÷2 するのを わすれたみたい。三角形の面積は 底辺 × 高さ ÷ 2 だよ。";
    }
    return null;
  }

  if (mode === 1) {
    // 平行四辺形：三角形の公式と取りちがえて ÷2 してしまった。
    const base = mm(meta, "base");
    const height = mm(meta, "height");
    if ([base, height].some(Number.isNaN)) return null;
    if ((base * height) % 2 === 0 && near(val, (base * height) / 2)) {
      return "平行四辺形は ÷2 しないよ。面積は 底辺 × 高さ で 求めるよ（三角形の公式と 取りちがえたみたい）。";
    }
    return null;
  }

  // 台形：(上底+下底)×高さ の ÷2 忘れ／片方の底だけで計算。
  const top = mm(meta, "top");
  const bottom = mm(meta, "bottom");
  const height = mm(meta, "height");
  if ([top, bottom, height].some(Number.isNaN)) return null;
  const correct = ((top + bottom) * height) / 2;
  if (near(val, (top + bottom) * height)) {
    return "さいごに ÷2 するのを わすれたみたい。台形は (上底 + 下底) × 高さ ÷ 2 だよ。";
  }
  // 下底だけ×高さ÷2（上底を足し忘れ）。
  const wrongBottom = (bottom * height) / 2;
  if (wrongBottom !== correct && near(val, wrongBottom)) {
    return "上底を たすのを わすれたみたい。まず (上底 + 下底) を してから × 高さ ÷ 2 だよ。";
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_J2: DiagUnitDef[] = [
  {
    id: "j2m-poly-add",
    grade: "中2",
    title: "式の計算（多項式の加減）",
    lesson:
      "多項式の たし算・ひき算は、同じ文字の 部分（同類項）を まとめます。x は x どうし、y は y どうしを 計算します。ひき算では、うしろの かっこの中の 符号を すべて 反対にしてから たします。",
    hint: "まず 同類項（x どうし・y どうし）を まとめよう。ひき算のときは かっこの中の 符号を 全部 反対にするのを 忘れずにね。",
    answerType: "integer",
    generate: genPolyAdd,
    diagnose: diagPolyAdd,
  },
  {
    id: "j2m-mono-muldiv",
    grade: "中2",
    title: "単項式の乗法・除法",
    lesson:
      "単項式の かけ算は、係数どうしを かけ、同じ文字の 指数は たします（x² × x³ = x⁵）。わり算は、係数どうしを わり、指数は ひきます（x⁵ ÷ x² = x³）。",
    hint: "係数は 係数どうし。文字の 指数は、かけ算なら たす、わり算なら ひくよ。",
    answerType: "integer",
    generate: genMonoMulDiv,
    diagnose: diagMonoMulDiv,
  },
  {
    id: "j2m-linear-eq",
    grade: "中2",
    title: "一次方程式・連立方程式",
    lesson:
      "方程式は、文字の 項を 左に、数の 項を 右に 移項して 解きます。移項すると 符号が 反対に なります。連立方程式は、2つの式から 1つの文字を 消して 解きます。",
    hint: "移項したら 符号を 反対に するよ。連立は 一方の 文字を 消してから 解こう。",
    answerType: "integer",
    generate: genLinearEq,
    diagnose: diagLinearEq,
  },
  {
    id: "j2m-linear-func",
    grade: "中2",
    title: "一次関数",
    lesson:
      "一次関数 y = ax + b では、a が 傾き（変化の割合）、b が 切片です。x の 値を 代入すると y が 求められます。変化の割合は、y の増加量 ÷ x の増加量 で、いつも a に なります。",
    hint: "y = ax + b の a が 傾き、b が 切片だよ。x を 代入するときは a に かけてから b を たそう。",
    answerType: "integer",
    generate: genLinearFunc,
    diagnose: diagLinearFunc,
  },
  {
    id: "j2m-angles",
    grade: "中2",
    title: "平行線と角・多角形の角",
    lesson:
      "平行な 2直線では、同位角・錯角は 等しく なります。多角形の 内角の和は (n − 2) × 180° です。どんな 多角形でも、外角の和は いつも 360° に なります。",
    hint: "平行線の 同位角・錯角は 等しいよ。多角形の 内角の和は (n − 2) × 180、外角の和は 360° だよ。",
    answerType: "integer",
    generate: genAngles,
    diagnose: diagAngles,
  },
  {
    id: "j2m-probability",
    grade: "中2",
    title: "確率",
    lesson:
      "確率は「あてはまる場合の数 ÷ 起こりうる すべての場合の数」で 求めます。まず 全部で 何通り あるかを 数え、次に あてはまる場合を 数えます。答えは 既約分数に します。",
    hint: "先に「全部で 何通りか」を 数えよう。次に「あてはまるのは 何通りか」を 数えて、わり算するよ。",
    answerType: "fraction",
    generate: genProbability,
    diagnose: diagProbability,
  },
  {
    id: "j2m-simeq-word",
    grade: "中2",
    title: "連立方程式の文章題",
    lesson:
      "文章題は、わからない 数を x, y と おいて 2つの式を 作ります。「人数の 関係」と「金額の 関係」のように、2つの ちがう 関係から 式を 立てるのが コツです。",
    hint: "わからない 数を x, y と おこう。人数の 式と 金額の 式、2つ 作ると 解けるよ。",
    answerType: "integer",
    generate: genSimeqWord,
    diagnose: diagSimeqWord,
  },
  {
    id: "j2m-area-figure",
    grade: "中2",
    title: "図形の求積（三角形・平行四辺形・台形）",
    lesson:
      "三角形の 面積は 底辺 × 高さ ÷ 2、平行四辺形は 底辺 × 高さ です。台形は (上底 + 下底) × 高さ ÷ 2 で 求めます。図形ごとに 公式が ちがうので 気をつけましょう。",
    hint: "三角形は ÷2 を 忘れずに。平行四辺形は ÷2 しないよ。台形は (上底 + 下底) × 高さ ÷ 2 だよ。",
    answerType: "integer",
    generate: genAreaFigure,
    diagnose: diagAreaFigure,
  },
];
