// 高1「数A」 数値生成単元（生成AI不使用・答えはコードで確定）。
// すべての答えはコードで計算して確定させ、数値系（integer/fraction）でのみ答える。
// 各 def は generate と diagnose を内包し、監督が index で束ねる（このファイルは index.ts を編集しない）。

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

/** 配列からランダムに1つ選ぶ。 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** n の階乗（n ≥ 0）。 */
function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** 順列 nPr = n·(n-1)···(n-r+1)。r 個の連続積で計算（誤差なし）。 */
function nPr(n: number, r: number): number {
  let r0 = 1;
  for (let i = 0; i < r; i++) r0 *= n - i;
  return r0;
}

/** 組合せ nCr = nPr(n, r) / r!。 */
function nCr(n: number, r: number): number {
  return nPr(n, r) / fact(r);
}

/** 最大公約数（ユークリッド互除法）。 */
function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/** 最小公倍数。 */
function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a / gcd(a, b) * b);
}

/**
 * 分数を既約化して正規化済み文字列にする。分母は必ず正。
 * 分母が1なら整数文字列（"3"）、それ以外は "a/b"。
 * index.ts の formatFraction / normalizeFractionString と同一の規約。
 */
function reduceFraction(num: number, den: number): string {
  if (den === 0) throw new Error("分母が0です");
  if (num === 0) return "0";
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  const rn = num / g;
  const rd = den / g;
  if (rd === 1) return String(rn);
  return `${rn}/${rd}`;
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

/** 整数として一致するか（診断用）。 */
function eqInt(cleaned: string, target: number): boolean {
  if (!/^-?\d+$/.test(cleaned)) return false;
  return Number(cleaned) === target;
}

// ==================================================================
// h1a-perm : 順列（nPr）
// ==================================================================
//
// 異なる n 個から r 個を取り出して並べる並べ方。答えは nPr(n, r)（integer）。

function genPerm(): Problem {
  const n = randInt(4, 8);
  const r = randInt(2, Math.min(4, n));
  const value = nPr(n, r);
  return {
    unitId: "h1a-perm",
    prompt: `異なる ${n} 個から ${r} 個を取り出して1列に並べる並べ方は何通りか。`,
    answer: String(value),
    answerType: "integer",
    meta: { n, r, value },
  };
}

function diagPerm(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const n = meta.n;
  const r = meta.r;
  if (typeof n !== "number" || typeof r !== "number") return null;
  // 組合せ nCr を答えてしまった（順序を区別していない）。
  if (eqInt(cleaned, nCr(n, r))) {
    return "それは組合せ（順番を区別しない）だよ。順列は並び順も数えるから、もっと多くなるよ。";
  }
  return null;
}

// ==================================================================
// h1a-comb : 組合せ（nCr）
// ==================================================================
//
// 異なる n 個から r 個を選ぶ選び方。答えは nCr(n, r)（integer）。

function genComb(): Problem {
  const n = randInt(4, 8);
  const r = randInt(2, Math.min(4, n));
  const value = nCr(n, r);
  return {
    unitId: "h1a-comb",
    prompt: `異なる ${n} 個から ${r} 個を選ぶ選び方は何通りか。`,
    answer: String(value),
    answerType: "integer",
    meta: { n, r, value },
  };
}

function diagComb(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const n = meta.n;
  const r = meta.r;
  if (typeof n !== "number" || typeof r !== "number") return null;
  // 順列 nPr を答えてしまった（並び順を区別してしまった）。
  if (eqInt(cleaned, nPr(n, r))) {
    return "それは順列（並び順を区別）だよ。組合せは選ぶだけだから、r! で割って小さくなるよ。";
  }
  return null;
}

// ==================================================================
// h1a-prob-dice : 確率（2つのさいころ）
// ==================================================================
//
// 大小2つのさいころの目の和が k になる確率。答えは reduceFraction(fav, 36)（fraction）。

/** 目の和が k になる (a, b)（1..6 × 1..6）の場合の数。 */
function diceFav(k: number): number {
  let count = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      if (a + b === k) count++;
    }
  }
  return count;
}

function genProbDice(): Problem {
  const k = randInt(2, 12);
  const fav = diceFav(k);
  return {
    unitId: "h1a-prob-dice",
    prompt: `大小2つのさいころを同時に投げるとき、目の和が ${k} になる確率を求めよ。`,
    answer: reduceFraction(fav, 36),
    answerType: "fraction",
    meta: { k, fav },
  };
}

function diagProbDice(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const fav = meta.fav;
  if (typeof fav !== "number") return null;
  // 未約分の fav/36 を答えた。
  if (cleaned === `${fav}/36` && reduceFraction(fav, 36) !== `${fav}/36`) {
    return "約分しよう。分子と分母を最大公約数でわると、これ以上約分できない形になるよ。";
  }
  return null;
}

// ==================================================================
// h1a-expect : 期待値（カード）
// ==================================================================
//
// 1〜N の数が書かれた N 枚から1枚引くときの数の期待値。
// 答えは reduceFraction(N+1, 2) = 平均 (N+1)/2（fraction）。

function genExpect(): Problem {
  const N = randInt(4, 10);
  return {
    unitId: "h1a-expect",
    prompt: `1から${N}までの数が1つずつ書かれた${N}枚のカードから1枚引くとき、書かれた数の期待値を求めよ。`,
    answer: reduceFraction(N + 1, 2),
    answerType: "fraction",
    meta: { N },
  };
}

function diagExpect(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const N = meta.N;
  if (typeof N !== "number") return null;
  // 最大値 N を答えてしまった。
  if (eqInt(cleaned, N)) {
    return "それは最大値だね。期待値は平均 (N+1)/2 で求めるよ（等間隔の値の平均）。";
  }
  return null;
}

// ==================================================================
// h1a-gcd : 最大公約数（互除法）
// ==================================================================
//
// a と b の最大公約数。答えは gcd(a, b)（integer）。

function genGcd(): Problem {
  const a = randInt(12, 200);
  const b = randInt(12, 200);
  return {
    unitId: "h1a-gcd",
    prompt: `${a} と ${b} の最大公約数を求めよ。`,
    answer: String(gcd(a, b)),
    answerType: "integer",
    meta: { a, b, value: gcd(a, b) },
  };
}

function diagGcd(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const a = meta.a;
  const b = meta.b;
  if (typeof a !== "number" || typeof b !== "number") return null;
  // 最小公倍数を答えてしまった。
  if (gcd(a, b) !== lcm(a, b) && eqInt(cleaned, lcm(a, b))) {
    return "それは最小公倍数だよ。最大公約数は両方をわり切る最大の数だから、もっと小さくなるよ。";
  }
  return null;
}

// ==================================================================
// h1a-lcm : 最小公倍数
// ==================================================================
//
// a と b の最小公倍数。答えは lcm(a, b)（integer）。

function genLcm(): Problem {
  const a = randInt(6, 60);
  const b = randInt(6, 60);
  return {
    unitId: "h1a-lcm",
    prompt: `${a} と ${b} の最小公倍数を求めよ。`,
    answer: String(lcm(a, b)),
    answerType: "integer",
    meta: { a, b, value: lcm(a, b) },
  };
}

function diagLcm(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const a = meta.a;
  const b = meta.b;
  if (typeof a !== "number" || typeof b !== "number") return null;
  // 最大公約数を答えてしまった。
  if (lcm(a, b) !== gcd(a, b) && eqInt(cleaned, gcd(a, b))) {
    return "それは最大公約数だよ。最小公倍数は両方の倍数になる最小の数だから、もっと大きくなるよ。";
  }
  return null;
}

// ==================================================================
// h1a-divisor-count : 約数の個数
// ==================================================================
//
// {2,3,5,7} から相異なる素因数を 2〜3 個選び、各指数 1〜3 で n = Π p^e。
// 正の約数の個数は Π(e_i + 1)。答えは integer。n ≤ 2000 程度に抑える。

const DIVISOR_PRIMES = [2, 3, 5, 7] as const;

function genDivisorCount(): Problem {
  // n が大きくなりすぎない（≲2000）組を得るまで再抽選。
  let primes: number[] = [];
  let exps: number[] = [];
  let n = 1;
  let guard = 0;
  do {
    const count = randInt(2, 3);
    // 相異なる素因数を count 個選ぶ。
    const pool = [...DIVISOR_PRIMES];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    primes = pool.slice(0, count).sort((a, b) => a - b);
    exps = primes.map(() => randInt(1, 3));
    n = 1;
    for (let i = 0; i < primes.length; i++) n *= primes[i] ** exps[i];
    guard++;
  } while (n > 2000 && guard < 200);

  const divisorCount = exps.reduce((acc, e) => acc * (e + 1), 1);

  // meta に n と各素因数の指数（キーは e2/e3/e5/e7）を入れる。
  const meta: Record<string, number> = { n, value: divisorCount, primeKinds: primes.length };
  for (let i = 0; i < primes.length; i++) meta[`e${primes[i]}`] = exps[i];

  return {
    unitId: "h1a-divisor-count",
    prompt: `${n} の正の約数は何個あるか。`,
    answer: String(divisorCount),
    answerType: "integer",
    meta,
  };
}

function diagDivisorCount(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const value = meta.value;
  const primeKinds = meta.primeKinds;
  if (typeof value !== "number" || typeof primeKinds !== "number") return null;
  // 素因数の種類数を答えてしまった（指数+1の積を取っていない）。
  if (value !== primeKinds && eqInt(cleaned, primeKinds)) {
    return "それは素因数の種類の数だね。約数の個数は各指数に1を足して掛け合わせるよ（(e+1) の積）。";
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_H1: UnitDef[] = [
  {
    id: "h1a-perm",
    grade: "高1",
    title: "順列（nPr）",
    lesson:
      "順列は、いくつかのものを 順番をつけて 1列に 並べる 並べ方の 数です。異なる n 個から r 個を 取り出して 並べる とき、並べ方は nPr = n・(n−1)・…・(n−r+1)（r 個の連続積）で 求めます。順列では 並ぶ 順番の ちがいも 別のものとして 数えます。",
    hint: "並べる 場所が r 個 あると 考えよう。最初の 場所は n 通り、次は (n−1) 通り…と かけ合わせていくよ。",
    answerType: "integer",
    generate: genPerm,
    diagnose: diagPerm,
  },
  {
    id: "h1a-comb",
    grade: "高1",
    title: "組合せ（nCr）",
    lesson:
      "組合せは、いくつかのものから 順番を 区別せずに 選ぶ 選び方の 数です。異なる n 個から r 個を 選ぶ とき、選び方は nCr = nPr ÷ r! で 求めます。並び順を 区別しない ぶん、同じものを 選ぶ 順列の 数（r!）で わって 重複を なくします。",
    hint: "まず 順列 nPr を 考えよう。そのあと、並び順の ちがい r! で わると、選ぶだけの 組合せに なるよ。",
    answerType: "integer",
    generate: genComb,
    diagnose: diagComb,
  },
  {
    id: "h1a-prob-dice",
    grade: "高1",
    title: "確率（2つのさいころ）",
    lesson:
      "大小2つの さいころを 投げる とき、目の 出方は 全部で 6×6 = 36 通り あり、どれも 同じ 確からしさです。ある 出来事の 確率は、（その 出来事が おこる 場合の数）÷ 36 で 求めます。最後に 分数は かならず 約分します。",
    hint: "まず 目の 和が その 数に なる (大, 小) の 組を 数えよう。それを 全体の 36 で わって、約分するよ。",
    answerType: "fraction",
    generate: genProbDice,
    diagnose: diagProbDice,
  },
  {
    id: "h1a-expect",
    grade: "高1",
    title: "期待値（カード）",
    lesson:
      "期待値は、それぞれの 値に その 確率を かけて 合計した もので、平均的に 期待できる 値を 表します。1から N までの 数が 1枚ずつ ある とき、どれも 同じ 確率 1/N なので、期待値は 数の 平均 (1+2+…+N)/N = (N+1)/2 に なります。",
    hint: "どのカードも 同じ 確率で 出るね。だから 期待値は 書かれた 数の 平均、(N+1)/2 で 求められるよ。",
    answerType: "fraction",
    generate: genExpect,
    diagnose: diagExpect,
  },
  {
    id: "h1a-gcd",
    grade: "高1",
    title: "最大公約数（互除法）",
    lesson:
      "最大公約数は、2つの 数を どちらも わり切る 最大の 数です。ユークリッドの 互除法では、大きい数を 小さい数で わった あまりを くり返し 使い、あまりが 0に なった ときの わる数が 最大公約数に なります。素因数分解して 共通の 因数を かけても 求められます。",
    hint: "大きい数を 小さい数で わって、あまりを 出そう。次は 「小さい数 と あまり」で 同じことを くり返すよ。",
    answerType: "integer",
    generate: genGcd,
    diagnose: diagGcd,
  },
  {
    id: "h1a-lcm",
    grade: "高1",
    title: "最小公倍数",
    lesson:
      "最小公倍数は、2つの 数の どちらの 倍数にも なる 最小の 正の数です。2数の 積を 最大公約数で わると 求められます（a×b ÷ 最大公約数）。素因数分解して、各 素因数の 指数の 大きい方を とって かけても 求められます。",
    hint: "先に 最大公約数を 求めよう。2つの 数の 積を その 最大公約数で わると、最小公倍数に なるよ。",
    answerType: "integer",
    generate: genLcm,
    diagnose: diagLcm,
  },
  {
    id: "h1a-divisor-count",
    grade: "高1",
    title: "約数の個数",
    lesson:
      "正の 約数の 個数は、素因数分解を 使うと かんたんに 求められます。n = p^a × q^b × … と 分解できる とき、約数の 個数は (a+1)(b+1)… に なります。各 素因数を 0〜その指数 まで 何個 使うか、の 選び方の 積だからです。",
    hint: "まず n を 素因数分解しよう。それぞれの 指数に 1を たして、全部 かけ合わせると 約数の 個数だよ。",
    answerType: "integer",
    generate: genDivisorCount,
    diagnose: diagDivisorCount,
  },
];
