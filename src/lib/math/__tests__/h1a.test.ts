// 高1「数A」単元（UNIT_DEFS_H1）の自己検証テスト。
// generate とは独立に実装した式で answer を再計算し、一致を検証する。
// gradeAnswer / index を経由せず、UNIT_DEFS_H1 を直接 import する（登録前でも通る）。

import { describe, it, expect } from "vitest";
import { UNIT_DEFS_H1 } from "@/lib/math/units_h1";
import type { UnitDef } from "@/lib/math/types";

const CASES = 2000;

function unitById(id: string): UnitDef {
  const u = UNIT_DEFS_H1.find((d) => d.id === id);
  if (!u) throw new Error(`unit not found: ${id}`);
  return u;
}

// ------------------------------------------------------------------
// 独立実装（units_h1.ts の実装を参照しない別実装）
// ------------------------------------------------------------------

/** 独立: 階乗。 */
function ifact(n: number): number {
  let r = 1;
  for (let i = 1; i <= n; i++) r *= i;
  return r;
}

/** 独立: 順列 nPr = n! / (n-r)!。 */
function iPerm(n: number, r: number): number {
  return ifact(n) / ifact(n - r);
}

/** 独立: 組合せ nCr = n! / (r!(n-r)!)。 */
function iComb(n: number, r: number): number {
  return ifact(n) / (ifact(r) * ifact(n - r));
}

/** 独立: 最大公約数（引き算法）。 */
function iGcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (a === 0) return b;
  if (b === 0) return a;
  while (a !== b) {
    if (a > b) a -= b;
    else b -= a;
  }
  return a;
}

/** 独立: 最小公倍数。 */
function iLcm(a: number, b: number): number {
  return Math.abs(a * b) / iGcd(a, b);
}

/** 独立: 既約分数の文字列（分母1なら整数）。 */
function iReduce(num: number, den: number): string {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  if (num === 0) return "0";
  const g = iGcd(num, den);
  const rn = num / g;
  const rd = den / g;
  return rd === 1 ? String(rn) : `${rn}/${rd}`;
}

/** 独立: 目の和が k になる (a,b) の数（総当たり）。 */
function iDiceFav(k: number): number {
  let c = 0;
  for (let a = 1; a <= 6; a++) {
    for (let b = 1; b <= 6; b++) {
      if (a + b === k) c++;
    }
  }
  return c;
}

/** 独立: n の正の約数の個数（試し割りで全数え上げ）。 */
function iDivisorCount(n: number): number {
  let c = 0;
  for (let d = 1; d <= n; d++) {
    if (n % d === 0) c++;
  }
  return c;
}

/** integer 答えを数値化。 */
function asInt(s: string): number {
  expect(/^-?\d+$/.test(s)).toBe(true);
  return Number(s);
}

// ------------------------------------------------------------------
// テスト本体
// ------------------------------------------------------------------

describe("h1a-perm 順列（nPr）", () => {
  const u = unitById("h1a-perm");
  it("独立式で answer を再計算し一致", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-perm");
      expect(p.answerType).toBe("integer");
      const n = p.meta!.n;
      const r = p.meta!.r;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(8);
      expect(r).toBeGreaterThanOrEqual(2);
      expect(r).toBeLessThanOrEqual(Math.min(4, n));
      expect(asInt(p.answer)).toBe(iPerm(n, r));
      expect(p.meta!.value).toBe(iPerm(n, r));
      expect(p.prompt).toContain(String(n));
      expect(p.prompt).toContain(String(r));
    }
  });
});

describe("h1a-comb 組合せ（nCr）", () => {
  const u = unitById("h1a-comb");
  it("独立式で answer を再計算し一致", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-comb");
      expect(p.answerType).toBe("integer");
      const n = p.meta!.n;
      const r = p.meta!.r;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(8);
      expect(r).toBeGreaterThanOrEqual(2);
      expect(r).toBeLessThanOrEqual(Math.min(4, n));
      expect(asInt(p.answer)).toBe(iComb(n, r));
      expect(p.meta!.value).toBe(iComb(n, r));
      expect(p.prompt).toContain(String(n));
      expect(p.prompt).toContain(String(r));
    }
  });
});

describe("h1a-prob-dice 確率（2つのさいころ）", () => {
  const u = unitById("h1a-prob-dice");
  it("独立式で answer を再計算し一致（既約分数）", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-prob-dice");
      expect(p.answerType).toBe("fraction");
      const k = p.meta!.k;
      const fav = p.meta!.fav;
      expect(k).toBeGreaterThanOrEqual(2);
      expect(k).toBeLessThanOrEqual(12);
      expect(fav).toBe(iDiceFav(k));
      expect(fav).toBeGreaterThanOrEqual(1); // k∈[2,12] は必ず fav≥1
      expect(p.answer).toBe(iReduce(fav, 36));
      expect(p.prompt).toContain(String(k));
    }
  });
});

describe("h1a-expect 期待値（カード）", () => {
  const u = unitById("h1a-expect");
  it("独立式で answer を再計算し一致（既約分数）", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-expect");
      expect(p.answerType).toBe("fraction");
      const N = p.meta!.N;
      expect(N).toBeGreaterThanOrEqual(4);
      expect(N).toBeLessThanOrEqual(10);
      // 独立に平均を全列挙で計算し (N+1)/2 と突き合わせ。
      let sum = 0;
      for (let v = 1; v <= N; v++) sum += v;
      expect(p.answer).toBe(iReduce(sum, N));
      expect(p.answer).toBe(iReduce(N + 1, 2));
      expect(p.prompt).toContain(String(N));
    }
  });
});

describe("h1a-gcd 最大公約数", () => {
  const u = unitById("h1a-gcd");
  it("独立式で answer を再計算し一致", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-gcd");
      expect(p.answerType).toBe("integer");
      const a = p.meta!.a;
      const b = p.meta!.b;
      expect(a).toBeGreaterThanOrEqual(12);
      expect(a).toBeLessThanOrEqual(200);
      expect(b).toBeGreaterThanOrEqual(12);
      expect(b).toBeLessThanOrEqual(200);
      expect(asInt(p.answer)).toBe(iGcd(a, b));
      expect(p.meta!.value).toBe(iGcd(a, b));
      expect(p.prompt).toContain(String(a));
      expect(p.prompt).toContain(String(b));
    }
  });
});

describe("h1a-lcm 最小公倍数", () => {
  const u = unitById("h1a-lcm");
  it("独立式で answer を再計算し一致", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-lcm");
      expect(p.answerType).toBe("integer");
      const a = p.meta!.a;
      const b = p.meta!.b;
      expect(a).toBeGreaterThanOrEqual(6);
      expect(a).toBeLessThanOrEqual(60);
      expect(b).toBeGreaterThanOrEqual(6);
      expect(b).toBeLessThanOrEqual(60);
      expect(asInt(p.answer)).toBe(iLcm(a, b));
      expect(p.meta!.value).toBe(iLcm(a, b));
      expect(p.prompt).toContain(String(a));
      expect(p.prompt).toContain(String(b));
    }
  });
});

describe("h1a-divisor-count 約数の個数", () => {
  const u = unitById("h1a-divisor-count");
  it("独立の全数え上げで answer を再計算し一致", () => {
    for (let i = 0; i < CASES; i++) {
      const p = u.generate();
      expect(p.unitId).toBe("h1a-divisor-count");
      expect(p.answerType).toBe("integer");
      const n = p.meta!.n;
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(2000);
      // 独立: 試し割りで実際の約数個数を数える。
      expect(asInt(p.answer)).toBe(iDivisorCount(n));
      expect(p.meta!.value).toBe(iDivisorCount(n));
      // 素因数の指数（e2/e3/e5/e7）から Π(e+1) でも一致すること。
      let prod = 1;
      for (const prime of [2, 3, 5, 7]) {
        const e = p.meta![`e${prime}`];
        if (typeof e === "number") prod *= e + 1;
      }
      expect(prod).toBe(iDivisorCount(n));
      expect(p.prompt).toContain(String(n));
      // primeKinds は 2〜3。
      expect(p.meta!.primeKinds).toBeGreaterThanOrEqual(2);
      expect(p.meta!.primeKinds).toBeLessThanOrEqual(3);
    }
  });
});

describe("共通契約", () => {
  it("全単元 grade=高1, answerType 整合, prompt 非空", () => {
    expect(UNIT_DEFS_H1).toHaveLength(7);
    for (const d of UNIT_DEFS_H1) {
      expect(d.grade).toBe("高1");
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.hint.length).toBeGreaterThan(0);
      expect(d.lesson.length).toBeGreaterThan(0);
      const p = d.generate();
      // 単元の answerType と生成問題の answerType が一致。
      expect(p.answerType).toBe(d.answerType);
      expect(p.prompt.length).toBeGreaterThan(0);
      expect(p.meta).toBeDefined();
    }
  });
});
