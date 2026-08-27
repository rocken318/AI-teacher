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
    meta: { dividend, divisor, quotient },
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
      // op: 1=たし算, 0=ひき算。a/b は 1/10 単位の整数で保持。
      meta: { aTenths, bTenths, op: 1 },
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
    meta: { aTenths: hi, bTenths: lo, op: 0 },
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
      // mode: 0=百の位まで（factor=100）, 1=上から1桁。
      meta: { value, factor: 100, mode: 0 },
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
    meta: { value, factor, mode: 1 },
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
      // a,b は 1/10 単位の整数。product は 1/100 単位。
      meta: { aTenths, bTenths, decimalsA: 1, decimalsB: 1 },
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
    // aTenths は 1/10 単位、bTenths は整数 b を 1/10 単位に換算して統一。
    meta: { aTenths, bTenths: b * 10, decimalsA: 1, decimalsB: 0 },
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
    // dividendTenths は 1/10 単位、divisor は整数、商は 1/10 単位。
    meta: { dividendTenths, divisor, quotientTenths },
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
      // dir: 1=「AのX%はいくつ」（量を答える）, 0=「BはAの何%」（%を答える）。
      meta: { base, percent, part: value, dir: 1 },
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
    meta: { base, percent, part, dir: 0 },
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
    meta: { sum: avg * count, count, avg },
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
    meta: { n1, d1, n2, d2 },
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
    meta: { n1, d1, n2, d2 },
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
    meta: { a, b },
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
    hint: "わり算は「同じ数ずつ分ける」を思い出そう。「わる数 ×□＝わられる数」の□をさがしてみて。",
    answerType: "integer",
    generate: genDivBasic,
  },
  {
    id: "dec-addsub",
    grade: "小4",
    title: "小数のたし算・ひき算",
    lesson:
      "小数のたし算とひき算は、小数点の位置をそろえて計算します。位ごとにきちんとそろえるのが大切です。答えの小数点も、上の数とまっすぐそろえて書きましょう。",
    hint: "まず小数点の位置をまっすぐそろえよう。位ごとにたてにならべてから計算するよ。",
    answerType: "decimal",
    generate: genDecAddSub,
  },
  {
    id: "rounding",
    grade: "小4",
    title: "がい数（四捨五入）",
    lesson:
      "がい数は、だいたいの数を表すときに使います。四捨五入では、求めたい位の一つ下の数字を見ます。その数字が0〜4なら切り捨て、5〜9なら切り上げます。",
    hint: "まず「どの位まで」かをたしかめて、そのすぐ下の位の数字を見よう。0〜4なら切り捨て、5〜9なら切り上げだよ。",
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
    hint: "まず小数点を消して整数のようにかけ算しよう。さいごに、2つの数の小数点以下のけた数をたした分だけ、答えに小数点をうつよ。",
    answerType: "decimal",
    generate: genDecMul,
  },
  {
    id: "dec-div",
    grade: "小5",
    title: "小数のわり算",
    lesson:
      "小数のわり算は、わる数が整数になるように小数点を動かして計算します。わられる数の小数点も同じだけ動かします。商の小数点は、動かしたあとの位置にそろえてうちます。",
    hint: "わる数を整数にするように小数点を動かそう。わられる数も同じだけ動かすのを忘れずにね。",
    answerType: "decimal",
    generate: genDecDiv,
  },
  {
    id: "percent",
    grade: "小5",
    title: "割合・百分率",
    lesson:
      "割合は、くらべる量がもとにする量のどれだけにあたるかを表します。百分率(%)は、割合を100倍した表し方です。「割合＝くらべる量÷もとにする量」で求められます。",
    hint: "「もとにする量」がどれかをまず見つけよう。%は100でわって小数の割合に直してから計算するとまちがえにくいよ。",
    answerType: "integer",
    generate: genPercent,
  },
  {
    id: "average",
    grade: "小5",
    title: "平均",
    lesson:
      "平均は、いくつかの数をならして同じ大きさにしたときの1つ分の値です。「平均＝合計÷個数」で求めます。ちがう大きさのものを、ならすイメージを持つとわかりやすいです。",
    hint: "まず全部の数をたして合計を出そう。そのあと個数でわると平均になるよ。合計のままにしないでね。",
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
    hint: "分子どうし・分母どうしをそれぞれかけよう。さいごに約分できないかたしかめてね。",
    answerType: "fraction",
    generate: genFracMul,
  },
  {
    id: "frac-div",
    grade: "小6",
    title: "分数のわり算",
    lesson:
      "分数のわり算は、わる数の分母と分子を入れかえた数（逆数）をかけます。つまり「÷」を「×逆数」に直して計算します。答えは既約分数にしましょう。",
    hint: "わり算はまず「÷」を「×逆数」に直そう。うしろの分数の分母と分子を入れかえてからかけるよ。",
    answerType: "fraction",
    generate: genFracDiv,
  },
  {
    id: "ratio",
    grade: "小6",
    title: "比を簡単にする",
    lesson:
      "比は、2つの量の関係を「a:b」で表したものです。両方を同じ数でわると、もっとも簡単な整数の比にできます。分数の約分と同じ考え方で、公約数でわっていきます。",
    hint: "2つの数の公約数をさがそう。両方を同じ数でわっていくと、いちばん簡単な比になるよ。",
    answerType: "text",
    generate: genRatio,
  },
];

// ------------------------------------------------------------------
// 誤答診断（ルールベース・計算で確実に。生成AIは使わない）
// ------------------------------------------------------------------

/** 全角→半角の最低限の変換（診断用の軽量版）。 */
function toHalfWidthLite(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[／]/g, "/")
    .replace(/[．。]/g, ".")
    .replace(/[：]/g, ":")
    .replace(/[－―ー−]/g, "-");
}

/** 診断用に入力から数式文字だけを取り出す。 */
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

/** meta を安全に取り出す（欠損時は既定値）。 */
function m(meta: Record<string, number> | undefined, key: string, fallback = NaN): number {
  const v = meta?.[key];
  return typeof v === "number" ? v : fallback;
}

/**
 * 誤答をルールで診断する。
 * ユーザー入力（正規化後）が「ありがちな誤答」と一致したら、その原因メッセージを返す。
 * 一致しなければ null（＝計算ミス等、特定できない）。ハルシネーションはしない。
 */
export function diagnoseUnit(
  unitId: string,
  problem: Problem,
  userInput: string,
): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const val = toNumber(cleaned);

  switch (unitId) {
    case "frac-div": {
      const n1 = m(meta, "n1");
      const d1 = m(meta, "d1");
      const n2 = m(meta, "n2");
      const d2 = m(meta, "d2");
      if ([n1, d1, n2, d2].some(Number.isNaN)) return null;
      // 逆数にし忘れ＝そのまま分子どうし・分母どうしをかけた a*c/(b*d)。
      const wrong = normFrac(formatFraction(n1 * n2, d1 * d2));
      const user = normFrac(cleaned);
      if (user !== null && user === wrong) {
        return "わり算を「そのまま かける」にしちゃったみたい。÷は、うしろの分数を逆数（分母と分子を入れかえ）にして×だよ。";
      }
      return null;
    }
    case "frac-mul": {
      const n1 = m(meta, "n1");
      const d1 = m(meta, "d1");
      const n2 = m(meta, "n2");
      const d2 = m(meta, "d2");
      if ([n1, d1, n2, d2].some(Number.isNaN)) return null;
      const user = normFrac(cleaned);
      // 分母をかけ忘れ＝分子だけかけて分母は左の分母のまま（a*c/b）。
      const wrongDen = normFrac(formatFraction(n1 * n2, d1));
      if (user !== null && user === wrongDen) {
        return "分子どうしはかけられたね。でも分母どうしをかけるのを わすれてるみたい。分母 × 分母 もするよ。";
      }
      // たすき掛けミス＝分子と分母をたし算してしまう等はまれなので、
      // もう1パターン：分子と分母を取りちがえて d1*d2/(n1*n2)。
      const wrongSwap = normFrac(formatFraction(d1 * d2, n1 * n2));
      if (user !== null && user === wrongSwap) {
        return "分子と分母が逆になっているみたい。上（分子）どうし・下（分母）どうしをかけてね。";
      }
      return null;
    }
    case "percent": {
      const base = m(meta, "base");
      const percent = m(meta, "percent");
      const part = m(meta, "part");
      const dir = m(meta, "dir");
      if ([base, percent, part, dir].some(Number.isNaN)) return null;
      if (dir === 1) {
        // 「AのX%はいくつ」。正解は part。
        // ミス1：100でわり忘れ＝base×percent（100倍ずれ）。
        if (near(val, base * percent)) {
          return "100でわるのを わすれたみたい。%は「÷100」してから かけるよ（" +
            `${base} × ${percent} ÷ 100`
            + "）。";
        }
        // ミス2：%と量の取りちがえ＝percent をそのまま答えた。
        if (near(val, percent)) {
          return "%の数字をそのまま答えちゃったみたい。きかれているのは「いくつ分」の量だよ。";
        }
        return null;
      }
      // dir === 0：「B は A の何%」。正解は percent。
      // ミス1：100をかけ忘れ＝part/base（割合の小数のまま）。
      if (near(val, part / base)) {
        return "わり算まではできてるね。%にするには さいごに ×100 するのを わすれずに。";
      }
      // ミス2：%と量の取りちがえ＝part をそのまま答えた。
      if (near(val, part)) {
        return "量の数字をそのまま答えちゃったみたい。きかれているのは「何%」かだよ。";
      }
      return null;
    }
    case "dec-mul": {
      const aTenths = m(meta, "aTenths");
      const bTenths = m(meta, "bTenths");
      if ([aTenths, bTenths].some(Number.isNaN)) return null;
      const correct = (aTenths * bTenths) / 100;
      // 小数点が1つずれ（10倍／1/10）。
      if (near(val, correct * 10)) {
        return "小数点の位置がずれたみたい。答えが10倍大きくなってるよ。小数点以下のけた数を数えなおしてね。";
      }
      if (near(val, correct / 10)) {
        return "小数点の位置がずれたみたい。答えが10分の1小さくなってるよ。小数点以下のけた数を数えなおしてね。";
      }
      return null;
    }
    case "dec-div": {
      const dividendTenths = m(meta, "dividendTenths");
      const divisor = m(meta, "divisor");
      if ([dividendTenths, divisor].some(Number.isNaN)) return null;
      const correct = dividendTenths / 10 / divisor;
      if (near(val, correct * 10)) {
        return "小数点の位置がずれたみたい。答えが10倍大きくなってるよ。小数点を動かした分をたしかめてね。";
      }
      if (near(val, correct / 10)) {
        return "小数点の位置がずれたみたい。答えが10分の1小さくなってるよ。小数点を動かした分をたしかめてね。";
      }
      return null;
    }
    case "rounding": {
      const value = m(meta, "value");
      const factor = m(meta, "factor");
      if ([value, factor].some(Number.isNaN)) return null;
      // 切り捨て・切り上げの取りちがえ。
      const floor = Math.floor(value / factor) * factor;
      const ceil = Math.ceil(value / factor) * factor;
      const round = Math.round(value / factor) * factor;
      if (floor !== round && near(val, floor)) {
        return "切り捨てちゃったみたい。四捨五入は、下の位が5以上なら切り上げるよ。";
      }
      if (ceil !== round && near(val, ceil)) {
        return "切り上げちゃったみたい。四捨五入は、下の位が4以下なら切り捨てるよ。";
      }
      // 桁の取りちがえ（1つ上／下の位で四捨五入した値に一致）。
      const up = Math.round(value / (factor * 10)) * (factor * 10);
      const down = Math.round(value / (factor / 10)) * (factor / 10);
      if (near(val, up)) {
        return "四捨五入する位がひとつ上になってるみたい。どの位までのがい数か、もう一度たしかめてね。";
      }
      if (factor >= 10 && near(val, down)) {
        return "四捨五入する位がひとつ下になってるみたい。どの位までのがい数か、もう一度たしかめてね。";
      }
      return null;
    }
    case "average": {
      const sum = m(meta, "sum");
      const count = m(meta, "count");
      if ([sum, count].some(Number.isNaN)) return null;
      // 合計と平均の取りちがえ（合計を答えた）。
      if (near(val, sum)) {
        return "それは「合計」の数だね。平均は そのあと 個数（" + `${count}` + "）で わるよ。";
      }
      return null;
    }
    case "div-basic": {
      const dividend = m(meta, "dividend");
      const divisor = m(meta, "divisor");
      if ([dividend, divisor].some(Number.isNaN)) return null;
      // わられる数とわる数を逆にした（divisor ÷ dividend ではなく、逆の商）。
      // ここでは割り切れる問題なので、あまり誤答より「かけ算してしまった」を見る。
      if (near(val, dividend * divisor)) {
        return "かけ算しちゃったみたい。これはわり算だから「同じ数ずつ分ける」を思い出してね。";
      }
      return null;
    }
    default:
      return null;
  }
}
