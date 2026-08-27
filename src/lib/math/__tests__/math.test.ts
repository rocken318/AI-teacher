import { describe, it, expect } from "vitest";
import {
  UNITS,
  unitsForGrade,
  getUnit,
  generateProblem,
  gradeAnswer,
} from "@/lib/math";
import { gcd, reduceFraction } from "@/lib/math/units";

// ------------------------------------------------------------------
// 補助：問題文から独立に正解を再計算する（＝答えが必ず正しいことの検証）
// ------------------------------------------------------------------

/** 分数文字列を既約表記に。 */
function reduceStr(num: number, den: number): string {
  const r = reduceFraction(num, den);
  return r.den === 1 ? String(r.num) : `${r.num}/${r.den}`;
}

/** 小数を末尾ゼロなしの正規化文字列に。 */
function dec(n: number): string {
  return String(Number.parseFloat(n.toFixed(6)));
}

/** promptから独立に正解を計算する。 */
function recomputeAnswer(unitId: string, prompt: string): string {
  switch (unitId) {
    case "div-basic": {
      const m = prompt.match(/(\d+) ÷ (\d+)/)!;
      return String(Number(m[1]) / Number(m[2]));
    }
    case "dec-addsub": {
      const m = prompt.match(/([\d.]+) ([+\-]) ([\d.]+)/)!;
      const a = Number(m[1]);
      const b = Number(m[3]);
      // 誤差回避のため 1/10 単位で整数演算。
      const at = Math.round(a * 10);
      const bt = Math.round(b * 10);
      const r = m[2] === "+" ? at + bt : at - bt;
      return dec(r / 10);
    }
    case "rounding": {
      const value = Number(prompt.match(/^(\d+)/)![1]);
      if (prompt.includes("百の位")) return String(Math.round(value / 100) * 100);
      const digits = String(value).length;
      const factor = Math.pow(10, digits - 1);
      return String(Math.round(value / factor) * factor);
    }
    case "dec-mul": {
      const m = prompt.match(/([\d.]+) × ([\d.]+)/)!;
      const a = Math.round(Number(m[1]) * 10);
      const b = Number(m[2]);
      const bIsDecimal = m[2].includes(".");
      if (bIsDecimal) {
        const bt = Math.round(Number(m[2]) * 10);
        return dec((a * bt) / 100);
      }
      return dec((a * b) / 10);
    }
    case "dec-div": {
      const m = prompt.match(/([\d.]+) ÷ (\d+)/)!;
      return dec(Number(m[1]) / Number(m[2]));
    }
    case "percent": {
      if (prompt.includes("何%")) {
        const m = prompt.match(/^([\d.]+) は ([\d.]+) の何%/)!;
        return String((Number(m[1]) / Number(m[2])) * 100);
      }
      const m = prompt.match(/^([\d.]+) の ([\d.]+)%/)!;
      return String((Number(m[1]) * Number(m[2])) / 100);
    }
    case "average": {
      const nums = prompt
        .match(/^([\d, ]+) の平均/)![1]
        .split(",")
        .map((s) => Number(s.trim()));
      const sum = nums.reduce((a, b) => a + b, 0);
      return String(sum / nums.length);
    }
    case "frac-mul": {
      const m = prompt.match(/(\d+)\/(\d+) × (\d+)\/(\d+)/)!;
      return reduceStr(Number(m[1]) * Number(m[3]), Number(m[2]) * Number(m[4]));
    }
    case "frac-div": {
      const m = prompt.match(/(\d+)\/(\d+) ÷ (\d+)\/(\d+)/)!;
      return reduceStr(Number(m[1]) * Number(m[4]), Number(m[2]) * Number(m[3]));
    }
    case "ratio": {
      const m = prompt.match(/(\d+):(\d+)/)!;
      const a = Number(m[1]);
      const b = Number(m[2]);
      const g = gcd(a, b) || 1;
      return `${a / g}:${b / g}`;
    }
    default:
      throw new Error(`未知の単元: ${unitId}`);
  }
}

const ALL_IDS = UNITS.map((u) => u.id);

// recomputeAnswer が独立再計算をサポートする既存10単元。
// 増設分（b-*/c-*）は各ジェネレータ側で meta から自己検証済みのため、
// ここでは下の「自己整合」テストで全単元を担保する。
const RECOMPUTE_IDS = [
  "div-basic",
  "dec-addsub",
  "rounding",
  "dec-mul",
  "dec-div",
  "percent",
  "average",
  "frac-mul",
  "frac-div",
  "ratio",
];

// ------------------------------------------------------------------
// 生成された答えが常に正しい
// ------------------------------------------------------------------

describe("generateProblem: 生成された答えは独立再計算と一致する（既存単元）", () => {
  for (const id of RECOMPUTE_IDS) {
    it(`${id} は50回とも答えが正しい`, () => {
      for (let i = 0; i < 50; i++) {
        const p = generateProblem(id);
        expect(p.unitId).toBe(id);
        expect(recomputeAnswer(id, p.prompt)).toBe(p.answer);
        expect(gradeAnswer(id, p, p.answer).correct).toBe(true);
      }
    });
  }
});

describe("全単元の自己整合（増設分ふくむ）", () => {
  for (const id of ALL_IDS) {
    it(`${id}: 生成→自分の答えで採点すると必ず正解`, () => {
      for (let i = 0; i < 30; i++) {
        const p = generateProblem(id);
        expect(p.unitId).toBe(id);
        expect(p.answer.length).toBeGreaterThan(0);
        expect(gradeAnswer(id, p, p.answer).correct).toBe(true);
      }
    });
  }
});

describe("分数・比の答えは既約になっている", () => {
  it("frac-mul / frac-div の答えは既約分数", () => {
    for (const id of ["frac-mul", "frac-div"]) {
      for (let i = 0; i < 100; i++) {
        const p = generateProblem(id);
        const m = p.answer.match(/^(\d+)\/(\d+)$/);
        if (m) {
          expect(gcd(Number(m[1]), Number(m[2]))).toBe(1);
          expect(Number(m[2])).toBeGreaterThan(0);
        } else {
          expect(p.answer).toMatch(/^\d+$/); // 整数化された場合
        }
      }
    }
  });

  it("ratio の答えは既約の a:b", () => {
    for (let i = 0; i < 100; i++) {
      const p = generateProblem("ratio");
      const m = p.answer.match(/^(\d+):(\d+)$/)!;
      expect(gcd(Number(m[1]), Number(m[2]))).toBe(1);
    }
  });
});

// ------------------------------------------------------------------
// 採点：正解・不正解・表記ゆれ
// ------------------------------------------------------------------

describe("gradeAnswer: 整数・小数", () => {
  const intProblem = {
    unitId: "div-basic",
    prompt: "56 ÷ 7 = ?",
    answer: "8",
    answerType: "integer" as const,
  };

  it("正しい入力は correct", () => {
    expect(gradeAnswer("div-basic", intProblem, "8").correct).toBe(true);
  });
  it("ずれた入力は not correct", () => {
    expect(gradeAnswer("div-basic", intProblem, "9").correct).toBe(false);
  });
  it("全角数字を正規化して correct", () => {
    expect(gradeAnswer("div-basic", intProblem, "８").correct).toBe(true);
  });
  it("前後の空白・日本語混入に強い", () => {
    expect(gradeAnswer("div-basic", intProblem, "  こたえは 8 です ").correct).toBe(true);
  });

  const decProblem = {
    unitId: "dec-addsub",
    prompt: "1.5 + 2.0 = ?",
    answer: "3.5",
    answerType: "decimal" as const,
  };
  it("小数の正解", () => {
    expect(gradeAnswer("dec-addsub", decProblem, "3.5").correct).toBe(true);
  });
  it("小数の全角＋空白", () => {
    expect(gradeAnswer("dec-addsub", decProblem, "３．５").correct).toBe(true);
  });
  it("小数のずれは不正解", () => {
    expect(gradeAnswer("dec-addsub", decProblem, "3.6").correct).toBe(false);
  });
});

describe("gradeAnswer: 分数の表記ゆれ", () => {
  const fp = {
    unitId: "frac-mul",
    prompt: "1/2 × 3/4 = ?",
    answer: "3/8",
    answerType: "fraction" as const,
  };
  it("既約一致", () => {
    expect(gradeAnswer("frac-mul", fp, "3/8").correct).toBe(true);
  });
  it("未約分 6/16 → 3/8 を正解にする", () => {
    expect(gradeAnswer("frac-mul", fp, "6/16").correct).toBe(true);
  });
  it("全角分数線", () => {
    expect(gradeAnswer("frac-mul", fp, "３／８").correct).toBe(true);
  });
  it("ちがう分数は不正解", () => {
    expect(gradeAnswer("frac-mul", fp, "1/2").correct).toBe(false);
  });

  it("整数答えの分数単元で整数入力を許容（4/1 → 4）", () => {
    const p = {
      unitId: "frac-mul",
      prompt: "8/2 × 1/1 = ?",
      answer: "4",
      answerType: "fraction" as const,
    };
    expect(gradeAnswer("frac-mul", p, "4").correct).toBe(true);
    expect(gradeAnswer("frac-mul", p, "4/1").correct).toBe(true);
    expect(gradeAnswer("frac-mul", p, "8/2").correct).toBe(true);
  });
});

describe("gradeAnswer: 比(text)の正規化", () => {
  const rp = {
    unitId: "ratio",
    prompt: "4:6 をもっとも簡単な整数の比にすると？",
    answer: "2:3",
    answerType: "text" as const,
  };
  it("既約一致", () => {
    expect(gradeAnswer("ratio", rp, "2:3").correct).toBe(true);
  });
  it("未約分 4:6 → 2:3 を正解にする", () => {
    expect(gradeAnswer("ratio", rp, "4:6").correct).toBe(true);
  });
  it("全角コロン・空白", () => {
    expect(gradeAnswer("ratio", rp, " ２：３ ").correct).toBe(true);
  });
  it("ちがう比は不正解", () => {
    expect(gradeAnswer("ratio", rp, "3:2").correct).toBe(false);
  });
});

// ------------------------------------------------------------------
// メタ情報の整合
// ------------------------------------------------------------------

describe("unitsForGrade / getUnit の整合", () => {
  it("学年別の件数が全体と一致", () => {
    const g4 = unitsForGrade("小4");
    const g5 = unitsForGrade("小5");
    const g6 = unitsForGrade("小6");
    expect(g4.length + g5.length + g6.length).toBe(UNITS.length);
    expect(g4.every((u) => u.grade === "小4")).toBe(true);
    expect(g5.every((u) => u.grade === "小5")).toBe(true);
    expect(g6.every((u) => u.grade === "小6")).toBe(true);
  });

  it("getUnit は各IDを引ける／未知はundefined", () => {
    for (const id of ALL_IDS) {
      expect(getUnit(id)?.id).toBe(id);
    }
    expect(getUnit("nope")).toBeUndefined();
  });

  it("各単元は lesson を持ち answerType が有効", () => {
    for (const u of UNITS) {
      expect(u.lesson.length).toBeGreaterThan(10);
      expect(["integer", "decimal", "fraction", "text"]).toContain(u.answerType);
    }
  });

  it("generateProblem は未知IDでthrow", () => {
    expect(() => generateProblem("nope")).toThrow();
  });
});
