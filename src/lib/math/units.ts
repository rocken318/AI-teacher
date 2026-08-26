// 単元＝問題ジェネレータ群。
// すべての答えはコードで計算して確定させる（生成AIは使わない）。

import type { Problem, UnitDef } from "./types";

// ------------------------------------------------------------------
// 数値ユーティリティ
// ------------------------------------------------------------------

/** min〜max（両端含む）の整数を返す。 */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 配列からランダムに1つ選ぶ。 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 最大公約数（ユークリッドの互除法）。負や0にも耐える。 */
export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * 分数を既約化する。分母は必ず正にそろえる。
 * 分子が0なら 0/1 を返す。
 */
export function reduceFraction(num: number, den: number): { num: number; den: number } {
  if (den === 0) throw new Error("分母が0です");
  if (num === 0) return { num: 0, den: 1 };
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

/**
 * 分数を正規化済み文字列にする。
 * 分母が1なら整数文字列（"4"）、それ以外は "a/b"。
 */
export function formatFraction(num: number, den: number): string {
  const r = reduceFraction(num, den);
  if (r.den === 1) return String(r.num);
  return `${r.num}/${r.den}`;
}

/**
 * 小数を正規化済み文字列にする。
 * 浮動小数点の誤差を丸めてから末尾の余分なゼロを除去する。
 * 整数値になった場合も整数文字列を返す（decimal型の許容）。
 */
export function formatDecimal(value: number, maxDecimals = 6): string {
  // 丸め誤差対策：一度固定小数に丸めてから parseFloat で末尾ゼロ除去。
  const rounded = Number.parseFloat(value.toFixed(maxDecimals));
  // -0 を 0 に。
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  return String(safe);
}

/** 比を既約化して "a:b" にする。両方0は不正。 */
export function formatRatio(a: number, b: number): string {
  if (a === 0 && b === 0) throw new Error("比が 0:0 です");
  const g = gcd(a, b) || 1;
  return `${a / g}:${b / g}`;
}

// ------------------------------------------------------------------
// 小4
// ------------------------------------------------------------------

/** わり算（割り切れる商のみ）。 */
function genDivBasic(): Problem {
  const divisor = randInt(2, 9);
  const quotient = randInt(2, 12);
  const dividend = divisor * quotient;
  return {
    unitId: "div-basic",
    prompt: `${dividend} ÷ ${divisor} = ?`,
    answer: String(quotient),
    answerType: "integer",
  };
}

/** 小数のたし算・ひき算（小数第1位）。 */
function genDecAddSub(): Problem {
  // 0.1 刻みの値で整数演算し、誤差を避ける。
  const aTenths = randInt(11, 199); // 1.1〜19.9
  const bTenths = randInt(11, 199);
  const isAdd = Math.random() < 0.5;
  if (isAdd) {
    const sum = aTenths + bTenths;
    return {
      unitId: "dec-addsub",
      prompt: `${formatDecimal(aTenths / 10)} + ${formatDecimal(bTenths / 10)} = ?`,
      answer: formatDecimal(sum / 10),
      answerType: "decimal",
    };
  }
  // ひき算は必ず正になるよう大小を並べ替える。
  const hi = Math.max(aTenths, bTenths);
  const lo = Math.min(aTenths, bTenths);
  const diff = hi - lo;
  return {
    unitId: "dec-addsub",
    prompt: `${formatDecimal(hi / 10)} - ${formatDecimal(lo / 10)} = ?`,
    answer: formatDecimal(diff / 10),
    answerType: "decimal",
  };
}

/** がい数・四捨五入（百の位まで／上から1桁）。 */
function genRounding(): Problem {
  const value = randInt(1000, 99999);
  const mode = pick(["hundreds", "top1"] as const);
  if (mode === "hundreds") {
    // 百の位までのがい数＝十の位を四捨五入。
    const rounded = Math.round(value / 100) * 100;
    return {
      unitId: "rounding",
      prompt: `${value} を四捨五入して百の位までのがい数にすると？`,
      answer: String(rounded),
      answerType: "integer",
    };
  }
  // 上から1桁のがい数＝上から2桁目を四捨五入。
  const digits = String(value).length;
  const factor = Math.pow(10, digits - 1);
  const rounded = Math.round(value / factor) * factor;
  return {
    unitId: "rounding",
    prompt: `${value} を四捨五入して上から1桁のがい数にすると？`,
    answer: String(rounded),
    answerType: "integer",
  };
}

// ------------------------------------------------------------------
// 小5
// ------------------------------------------------------------------

/** 小数のかけ算（小数第1位 × 整数 または 小数第1位 × 小数第1位）。 */
function genDecMul(): Problem {
  // 誤差回避のため十分の一単位の整数で計算する。
  const useDecimalMultiplier = Math.random() < 0.5;
  if (useDecimalMultiplier) {
    const aTenths = randInt(11, 99); // 1.1〜9.9
    const bTenths = randInt(11, 99);
    const productHundredths = aTenths * bTenths; // 1/100 単位
    return {
      unitId: "dec-mul",
      prompt: `${formatDecimal(aTenths / 10)} × ${formatDecimal(bTenths / 10)} = ?`,
      answer: formatDecimal(productHundredths / 100),
      answerType: "decimal",
    };
  }
  const aTenths = randInt(11, 199); // 1.1〜19.9
  const b = randInt(2, 9);
  const productTenths = aTenths * b;
  return {
    unitId: "dec-mul",
    prompt: `${formatDecimal(aTenths / 10)} × ${b} = ?`,
    answer: formatDecimal(productTenths / 10),
    answerType: "decimal",
  };
}

/** 小数のわり算（割り切れる範囲）。答えは小数第1位まで。 */
function genDecDiv(): Problem {
  // 商を先に「きれいな小数（0.1刻み）」で決め、割る数を掛けて割られる数を作る。
  const divisor = randInt(2, 9);
  const quotientTenths = randInt(11, 99); // 商 = 1.1〜9.9（1/10単位）
  // 割られる数 = 割る数 × 商。商が1/10単位なので dividend も 1/10単位で保持し誤差を避ける。
  const dividendTenths = divisor * quotientTenths; // 割られる数 ×10
  const dividend = dividendTenths / 10; // 割り切れる小数
  return {
    unitId: "dec-div",
    prompt: `${formatDecimal(dividend)} ÷ ${divisor} = ?`,
    answer: formatDecimal(quotientTenths / 10),
    answerType: "decimal",
  };
}

/** 割合・百分率。 */
function genPercent(): Problem {
  // きれいな整数になる組み合わせを選ぶ。
  const percent = pick([5, 10, 15, 20, 25, 40, 50, 60, 75, 80] as const);
  const forward = Math.random() < 0.5;
  if (forward) {
    // 「Aの◯%はいくつ」。A は percent で割り切れる値にする。
    const step = 100 / gcd(percent, 100); // A をこの倍数にすると結果が整数
    const base = step * randInt(1, 20);
    const value = (base * percent) / 100;
    return {
      unitId: "percent",
      prompt: `${base} の ${percent}% はいくつ？`,
      answer: String(value),
      answerType: "integer",
    };
  }
  // 「B は A の何%」。part/base*100 が整数になるよう作る。
  const base = pick([20, 25, 40, 50, 80, 100, 200] as const);
  const part = (base * percent) / 100;
  return {
    unitId: "percent",
    prompt: `${part} は ${base} の何%？`,
    answer: String(percent),
    answerType: "integer",
  };
}

/** 平均（割り切れるよう合計を個数の倍数にする）。 */
function genAverage(): Problem {
  const count = randInt(3, 5);
  const avg = randInt(2, 30);
  // 平均が avg ちょうどになるよう、合計 = avg*count を保ちつつ数を散らす。
  let remaining = avg * count;
  const values: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    // 各値は最低1、残りが後続に配れる範囲で選ぶ。
    const slotsLeft = count - i - 1;
    const maxHere = remaining - slotsLeft; // 後続に最低1ずつ残す
    const v = randInt(1, Math.max(1, Math.min(maxHere, avg * 2)));
    values.push(v);
    remaining -= v;
  }
  values.push(remaining); // 最後で帳尻を合わせる
  return {
    unitId: "average",
    prompt: `${values.join(", ")} の平均は？`,
    answer: String(avg),
    answerType: "integer",
  };
}

// ------------------------------------------------------------------
// 小6
// ------------------------------------------------------------------

/** 分数のかけ算（既約で答える）。 */
function genFracMul(): Problem {
  const n1 = randInt(1, 9);
  const d1 = randInt(2, 9);
  const n2 = randInt(1, 9);
  const d2 = randInt(2, 9);
  return {
    unitId: "frac-mul",
    prompt: `${n1}/${d1} × ${n2}/${d2} = ?`,
    answer: formatFraction(n1 * n2, d1 * d2),
    answerType: "fraction",
  };
}

/** 分数のわり算（既約で答える）。 */
function genFracDiv(): Problem {
  const n1 = randInt(1, 9);
  const d1 = randInt(2, 9);
  const n2 = randInt(1, 9); // 割る数の分子は1以上（0除算回避）
  const d2 = randInt(2, 9);
  // a/b ÷ c/d = a*d / (b*c)
  return {
    unitId: "frac-div",
    prompt: `${n1}/${d1} ÷ ${n2}/${d2} = ?`,
    answer: formatFraction(n1 * d2, d1 * n2),
    answerType: "fraction",
  };
}

/** 比を簡単にする。 */
function genRatio(): Problem {
  // 既約の比 p:q に共通倍率 k を掛けた見た目の比を出題。
  let p = randInt(1, 9);
  let q = randInt(1, 9);
  const g0 = gcd(p, q) || 1;
  p = p / g0;
  q = q / g0;
  const k = randInt(2, 6);
  const a = p * k;
  const b = q * k;
  return {
    unitId: "ratio",
    prompt: `${a}:${b} をもっとも簡単な整数の比にすると？`,
    answer: formatRatio(a, b),
    answerType: "text",
  };
}

// ------------------------------------------------------------------
// 単元定義一覧
// ------------------------------------------------------------------

export const UNIT_DEFS: UnitDef[] = [
  // 小4
  {
    id: "div-basic",
    grade: "小4",
    title: "わり算（割り切れる）",
    lesson:
      "わり算は、同じ数ずつ分けたときいくつになるかを求める計算です。かけ算の九九を思い出すと答えが見つけやすくなります。たとえば「56÷7」は「7×□=56」の□を探すのと同じです。",
    answerType: "integer",
    generate: genDivBasic,
  },
  {
    id: "dec-addsub",
    grade: "小4",
    title: "小数のたし算・ひき算",
    lesson:
      "小数のたし算とひき算は、小数点の位置をそろえて計算します。位ごとにきちんとそろえるのが大切です。答えの小数点も、上の数とまっすぐそろえて書きましょう。",
    answerType: "decimal",
    generate: genDecAddSub,
  },
  {
    id: "rounding",
    grade: "小4",
    title: "がい数（四捨五入）",
    lesson:
      "がい数は、だいたいの数を表すときに使います。四捨五入では、求めたい位の一つ下の数字を見ます。その数字が0〜4なら切り捨て、5〜9なら切り上げます。",
    answerType: "integer",
    generate: genRounding,
  },
  // 小5
  {
    id: "dec-mul",
    grade: "小5",
    title: "小数のかけ算",
    lesson:
      "小数のかけ算は、まず小数点を無視して整数のように計算します。そのあと、かけられる数とかける数の小数点以下のけた数を合計して、答えに小数点をうちます。",
    answerType: "decimal",
    generate: genDecMul,
  },
  {
    id: "dec-div",
    grade: "小5",
    title: "小数のわり算",
    lesson:
      "小数のわり算は、わる数が整数になるように小数点を動かして計算します。わられる数の小数点も同じだけ動かします。商の小数点は、動かしたあとの位置にそろえてうちます。",
    answerType: "decimal",
    generate: genDecDiv,
  },
  {
    id: "percent",
    grade: "小5",
    title: "割合・百分率",
    lesson:
      "割合は、くらべる量がもとにする量のどれだけにあたるかを表します。百分率(%)は、割合を100倍した表し方です。「割合＝くらべる量÷もとにする量」で求められます。",
    answerType: "integer",
    generate: genPercent,
  },
  {
    id: "average",
    grade: "小5",
    title: "平均",
    lesson:
      "平均は、いくつかの数をならして同じ大きさにしたときの1つ分の値です。「平均＝合計÷個数」で求めます。ちがう大きさのものを、ならすイメージを持つとわかりやすいです。",
    answerType: "integer",
    generate: genAverage,
  },
  // 小6
  {
    id: "frac-mul",
    grade: "小6",
    title: "分数のかけ算",
    lesson:
      "分数のかけ算は、分母どうし・分子どうしをかけます。計算のとちゅうで約分できるときは約分すると簡単になります。答えは、これ以上約分できない形（既約分数）にします。",
    answerType: "fraction",
    generate: genFracMul,
  },
  {
    id: "frac-div",
    grade: "小6",
    title: "分数のわり算",
    lesson:
      "分数のわり算は、わる数の分母と分子を入れかえた数（逆数）をかけます。つまり「÷」を「×逆数」に直して計算します。答えは既約分数にしましょう。",
    answerType: "fraction",
    generate: genFracDiv,
  },
  {
    id: "ratio",
    grade: "小6",
    title: "比を簡単にする",
    lesson:
      "比は、2つの量の関係を「a:b」で表したものです。両方を同じ数でわると、もっとも簡単な整数の比にできます。分数の約分と同じ考え方で、公約数でわっていきます。",
    answerType: "text",
    generate: genRatio,
  },
];
