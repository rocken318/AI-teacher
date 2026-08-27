// 追加単元群（Cチーム）＝問題ジェネレータ＋誤答診断。
// すべての答えはコードで計算して確定させる（生成AIは使わない）。
// 図形・単位量あたり・速さ・比例・場合の数などの文章題を中心にそろえる。

import type { Problem, UnitDef } from "@/lib/math/types";
import {
  reduceFraction,
  formatFraction,
  formatDecimal,
  formatRatio,
  gcd,
} from "@/lib/math/units";

// ------------------------------------------------------------------
// 型：診断関数を内蔵した単元定義
// ------------------------------------------------------------------

type DiagUnitDef = UnitDef & {
  /** meta から誤答値を再計算して原因を一言返す。特定できなければ null。 */
  diagnose: (problem: Problem, userInput: string) => string | null;
};

// ------------------------------------------------------------------
// 数値ユーティリティ（units.ts と重複させず、この中で完結させる）
// ------------------------------------------------------------------

/** min〜max（両端含む）の整数を返す。 */
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** 配列からランダムに1つ選ぶ。 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// reduceFraction / formatFraction は約分・既約化に使う（unused-import 回避のため参照）。
void reduceFraction;
void formatFraction;

// ------------------------------------------------------------------
// 診断用の入力パース（units.ts と同じ作法をこのファイル内で再実装）
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

/** 比入力を既約 "a:b" に正規化。失敗時 null。 */
function normRatio(s: string): string | null {
  const parts = s.split(":");
  if (parts.length !== 2) return null;
  if (!/^-?\d+$/.test(parts[0]) || !/^-?\d+$/.test(parts[1])) return null;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  if (a === 0 && b === 0) return null;
  const g = gcd(a, b) || 1;
  return `${a / g}:${b / g}`;
}

/** 数値の近似一致（分数・小数の丸め誤差に耐える）。 */
function near(a: number | null, b: number): boolean {
  return a !== null && Math.abs(a - b) < 1e-9;
}

/** meta を安全に取り出す（欠損時は既定値）。 */
function m(meta: Record<string, number> | undefined, key: string, fallback = NaN): number {
  const v = meta?.[key];
  return typeof v === "number" ? v : fallback;
}

// ==================================================================
// 生成関数
// ==================================================================

// ------------------------------------------------------------------
// c-frac-addsub：異分母分数のたし算・ひき算（小5）
// ------------------------------------------------------------------

/** 異分母分数のたし算・ひき算（通分）。答えは既約分数。 */
function genFracAddSub(): Problem {
  // 分母は 2〜9 から異なる2つを選ぶ。
  const d1 = randInt(2, 9);
  let d2 = randInt(2, 9);
  while (d2 === d1) d2 = randInt(2, 9);
  const n1 = randInt(1, d1 - 1); // 真分数（1未満）にして扱いやすく
  const n2 = randInt(1, d2 - 1);
  const isAdd = Math.random() < 0.5;
  // 通分：共通分母は d1*d2（最小公倍数でなくてもよい。約分で既約化）。
  const commonNum1 = n1 * d2;
  const commonNum2 = n2 * d1;
  const den = d1 * d2;
  if (isAdd) {
    const num = commonNum1 + commonNum2;
    return {
      unitId: "c-frac-addsub",
      prompt: `${n1}/${d1} + ${n2}/${d2} = ?`,
      answer: formatFraction(num, den),
      answerType: "fraction",
      // op: 1=たし算, 0=ひき算。
      meta: { n1, d1, n2, d2, op: 1 },
    };
  }
  // ひき算は必ず正になるよう大小を並べ替える（値 n/d で比較）。
  let an1 = n1, ad1 = d1, an2 = n2, ad2 = d2;
  if (n1 * d2 < n2 * d1) {
    // 左が小さいなら入れ替え。
    an1 = n2; ad1 = d2; an2 = n1; ad2 = d1;
  }
  const num = an1 * ad2 - an2 * ad1;
  return {
    unitId: "c-frac-addsub",
    prompt: `${an1}/${ad1} - ${an2}/${ad2} = ?`,
    answer: formatFraction(num, ad1 * ad2),
    answerType: "fraction",
    meta: { n1: an1, d1: ad1, n2: an2, d2: ad2, op: 0 },
  };
}

function diagFracAddSub(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const cleaned = cleanInput(userInput);
  if (cleaned === "") return null;
  const n1 = m(meta, "n1");
  const d1 = m(meta, "d1");
  const n2 = m(meta, "n2");
  const d2 = m(meta, "d2");
  const op = m(meta, "op");
  if ([n1, d1, n2, d2, op].some(Number.isNaN)) return null;
  const user = normFrac(cleaned);
  if (user === null) return null;
  // 誤答：通分せず分子どうし・分母どうしをそのまま計算した。
  const wrongNum = op === 1 ? n1 + n2 : n1 - n2;
  const wrongDen = op === 1 ? d1 + d2 : d1 - d2;
  if (wrongDen !== 0) {
    const wrong = normFrac(formatFraction(wrongNum, wrongDen));
    if (wrong !== null && user === wrong) {
      return "通分しないで、分子どうし・分母どうしをそのまま計算しちゃったみたい。まず分母をそろえて（通分して）からね。";
    }
  }
  return null;
}

// ------------------------------------------------------------------
// c-tri-area：三角形の面積（小5）
// ------------------------------------------------------------------

/** 三角形の面積（底辺×高さ÷2）。底辺×高さを偶数にして整数解に。 */
function genTriArea(): Problem {
  const base = randInt(2, 20);
  // 底辺×高さが偶数になるよう高さを選ぶ（どちらか偶数）。
  let height = randInt(2, 20);
  if ((base * height) % 2 !== 0) height += 1; // 奇×奇 → +1で偶に
  if (height > 21) height -= 2;
  const area = (base * height) / 2;
  return {
    unitId: "c-tri-area",
    prompt: `底辺 ${base}cm、高さ ${height}cm の三角形の面積は？（cm²）`,
    answer: String(area),
    answerType: "integer",
    meta: { base, height, area },
  };
}

function diagTriArea(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const base = m(meta, "base");
  const height = m(meta, "height");
  if ([base, height].some(Number.isNaN)) return null;
  // 誤答：÷2し忘れ（長方形と同じ底辺×高さ）。
  if (near(val, base * height)) {
    return "÷2をわすれたみたい。三角形は長方形の半分だから、底辺×高さ÷2 だよ。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-para-area：平行四辺形の面積（小5）
// ------------------------------------------------------------------

/** 平行四辺形の面積（底辺×高さ）。 */
function genParaArea(): Problem {
  const base = randInt(2, 20);
  const height = randInt(2, 20);
  const area = base * height;
  return {
    unitId: "c-para-area",
    prompt: `底辺 ${base}cm、高さ ${height}cm の平行四辺形の面積は？（cm²）`,
    answer: String(area),
    answerType: "integer",
    meta: { base, height, area },
  };
}

function diagParaArea(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const base = m(meta, "base");
  const height = m(meta, "height");
  if ([base, height].some(Number.isNaN)) return null;
  // 誤答：三角形とまちがえて÷2してしまった（割り切れる時のみ検出）。
  if ((base * height) % 2 === 0 && near(val, (base * height) / 2)) {
    return "÷2してしまったみたい。平行四辺形は 底辺×高さ で、÷2はしないよ（それは三角形だね）。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-trapezoid：台形の面積（小5）
// ------------------------------------------------------------------

/** 台形の面積（(上底+下底)×高さ÷2）。整数解になるよう調整。 */
function genTrapezoid(): Problem {
  const top = randInt(2, 15);
  const bottom = randInt(top + 1, 20); // 下底 > 上底
  let height = randInt(2, 20);
  // (top+bottom)*height が偶数になるよう調整。
  if (((top + bottom) * height) % 2 !== 0) {
    height += 1;
    if (height > 21) height -= 2;
  }
  const area = ((top + bottom) * height) / 2;
  return {
    unitId: "c-trapezoid",
    prompt: `上底 ${top}cm、下底 ${bottom}cm、高さ ${height}cm の台形の面積は？（cm²）`,
    answer: String(area),
    answerType: "integer",
    meta: { top, bottom, height, area },
  };
}

function diagTrapezoid(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const top = m(meta, "top");
  const bottom = m(meta, "bottom");
  const height = m(meta, "height");
  if ([top, bottom, height].some(Number.isNaN)) return null;
  // 誤答1：÷2し忘れ＝(上底+下底)×高さ。
  if (near(val, (top + bottom) * height)) {
    return "÷2をわすれたみたい。台形は (上底＋下底)×高さ÷2 だよ。";
  }
  // 誤答2：上底＋下底のたし忘れ（片方だけ）で下底×高さ÷2 等。
  if (near(val, (bottom * height) / 2) || near(val, (top * height) / 2)) {
    return "上底と下底の、両方をたしてから計算しよう。(上底＋下底)×高さ÷2 だよ。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-volume：直方体の体積（小5）
// ------------------------------------------------------------------

/** 直方体の体積（たて×よこ×高さ）。 */
function genVolume(): Problem {
  const a = randInt(2, 12);
  const b = randInt(2, 12);
  const c = randInt(2, 12);
  const vol = a * b * c;
  return {
    unitId: "c-volume",
    prompt: `たて ${a}cm、よこ ${b}cm、高さ ${c}cm の直方体の体積は？（cm³）`,
    answer: String(vol),
    answerType: "integer",
    meta: { a, b, c, vol },
  };
}

function diagVolume(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const a = m(meta, "a");
  const b = m(meta, "b");
  const c = m(meta, "c");
  if ([a, b, c].some(Number.isNaN)) return null;
  // 誤答：1辺をかけ忘れ＝面積を答えた（2辺だけの積）。
  if (near(val, a * b) || near(val, b * c) || near(val, a * c)) {
    return "2つの辺だけをかけて「面積」になってるみたい。体積は たて×よこ×高さ の3つをかけるよ。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-per-unit：単位量あたり（小5）
// ------------------------------------------------------------------

/** 単位量あたりの大きさ（○個で△円 → 1個いくら）。割り切れる値に。 */
function genPerUnit(): Problem {
  const count = randInt(2, 12);
  const perPrice = randInt(20, 200); // 1個あたり
  const total = count * perPrice;
  return {
    unitId: "c-per-unit",
    prompt: `${count}個で ${total}円のとき、1個あたりのねだんは？（円）`,
    answer: String(perPrice),
    answerType: "integer",
    meta: { count, total, perPrice },
  };
}

function diagPerUnit(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const count = m(meta, "count");
  const total = m(meta, "total");
  if ([count, total].some(Number.isNaN)) return null;
  // 誤答：割る向きが逆（個数÷合計）。割り切れる時のみ検出。
  if (count !== 0 && total !== 0 && count % total === 0 && near(val, count / total)) {
    return "わる向きが逆になってるみたい。1個あたりは 合計 ÷ 個数 だよ。";
  }
  // 誤答：かけてしまった。
  if (near(val, count * total)) {
    return "かけ算になってるみたい。1個あたりは 合計 ÷ 個数 でわり算だよ。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-speed：速さ（小6）
// ------------------------------------------------------------------

/** 速さ（道のり÷時間）。割り切れる値に。 */
function genSpeed(): Problem {
  const time = randInt(2, 8); // 時間
  const speed = randInt(3, 60); // 時速
  const dist = speed * time;
  return {
    unitId: "c-speed",
    prompt: `${dist}km の道のりを ${time}時間で進みました。速さ（時速）は？（km/時）`,
    answer: String(speed),
    answerType: "integer",
    meta: { dist, time, speed },
  };
}

function diagSpeed(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const dist = m(meta, "dist");
  const time = m(meta, "time");
  if ([dist, time].some(Number.isNaN)) return null;
  // 誤答：かけてしまった（道のり×時間）。
  if (near(val, dist * time)) {
    return "かけ算しちゃったみたい。速さは 道のり÷時間 でわり算だよ（「はじき」の は÷じ）。";
  }
  // 誤答：割る向きが逆（時間÷道のり）。割り切れる時のみ。
  if (dist !== 0 && time % dist === 0 && near(val, time / dist)) {
    return "わる向きが逆になってるみたい。速さは 道のり÷時間 だよ。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-circle-area：円の面積（小6）
// ------------------------------------------------------------------

/** 円の面積（半径×半径×3.14）。半径は整数。答えは formatDecimal。 */
function genCircleArea(): Problem {
  const r = randInt(1, 12);
  const area = r * r * 3.14;
  return {
    unitId: "c-circle-area",
    prompt: `半径 ${r}cm の円の面積は？（円周率は3.14、cm²）`,
    answer: formatDecimal(area),
    answerType: "decimal",
    meta: { r, area },
  };
}

function diagCircleArea(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const r = m(meta, "r");
  if (Number.isNaN(r)) return null;
  const correct = r * r * 3.14;
  // 誤答1：直径を半径として使った＝(2r)×(2r)×3.14＝4倍。
  const withDiameter = (2 * r) * (2 * r) * 3.14;
  if (!near(correct, withDiameter) && near(val, withDiameter)) {
    return "直径を使っちゃったみたい。円の面積は「半径×半径×3.14」だよ（直径ではなく半径）。";
  }
  // 誤答2：円周と混同＝半径×2×3.14（＝直径×3.14）。
  // r=2 のとき面積と円周が同値（12.56）になるので、正解と一致する場合は診断しない。
  const circumference = r * 2 * 3.14;
  if (!near(correct, circumference) && near(val, circumference)) {
    return "それは円周の式（直径×3.14）になってるみたい。面積は 半径×半径×3.14 だよ。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-proportion：比例（小6）
// ------------------------------------------------------------------

/** 比例（yはxに比例。1あたり×x）。 */
function genProportion(): Problem {
  const perUnit = randInt(2, 12); // 比例定数（1あたり）
  const x0 = randInt(2, 6); // 分かっている x
  const y0 = perUnit * x0; // そのときの y
  let x1 = randInt(2, 12); // 求めたい x
  while (x1 === x0) x1 = randInt(2, 12);
  const y1 = perUnit * x1;
  return {
    unitId: "c-proportion",
    prompt: `y は x に比例します。x=${x0} のとき y=${y0} です。x=${x1} のとき y は？`,
    answer: String(y1),
    answerType: "integer",
    meta: { perUnit, x0, y0, x1, y1 },
  };
}

function diagProportion(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const y0 = m(meta, "y0");
  const x0 = m(meta, "x0");
  const x1 = m(meta, "x1");
  if ([y0, x0, x1].some(Number.isNaN)) return null;
  // 誤答：たし算した＝y0 + (x1 - x0)。
  if (near(val, y0 + (x1 - x0))) {
    return "たし算になってるみたい。比例は「1あたり×x」でかけ算だよ。まず y÷x で1あたりを出そう。";
  }
  return null;
}

// ------------------------------------------------------------------
// c-combi：場合の数（小6）
// ------------------------------------------------------------------

/** 場合の数（並べ方＝順列 と 選び方＝組み合わせ の基本、小さい数）。 */
function genCombi(): Problem {
  const isPermutation = Math.random() < 0.5;
  if (isPermutation) {
    // n人から r人を選んで1列に並べる（順列）。n=3〜5, r=2〜3。
    const n = randInt(3, 5);
    const r = randInt(2, Math.min(3, n));
    let count = 1;
    for (let i = 0; i < r; i++) count *= n - i; // nPr
    return {
      unitId: "c-combi",
      prompt: `${n}人の中から ${r}人を選んで1列にならべる方法は何通り？`,
      answer: String(count),
      answerType: "integer",
      // kind: 1=順列, 0=組み合わせ。
      meta: { n, r, kind: 1, count },
    };
  }
  // n個から r個を選ぶ（組み合わせ、並び順は区別しない）。nCr。
  const n = randInt(4, 6);
  const r = randInt(2, Math.min(3, n - 1));
  let numer = 1;
  let denom = 1;
  for (let i = 0; i < r; i++) {
    numer *= n - i;
    denom *= i + 1;
  }
  const count = numer / denom; // nCr（整数になる）
  return {
    unitId: "c-combi",
    prompt: `${n}人の中から ${r}人を選ぶ方法は何通り？（並ぶ順番は考えない）`,
    answer: String(count),
    answerType: "integer",
    meta: { n, r, kind: 0, count },
  };
}

function diagCombi(problem: Problem, userInput: string): string | null {
  const meta = problem.meta;
  if (!meta) return null;
  const val = toNumber(cleanInput(userInput));
  const n = m(meta, "n");
  const r = m(meta, "r");
  const kind = m(meta, "kind");
  if ([n, r, kind].some(Number.isNaN)) return null;
  // nPr と nCr を両方計算。
  let nPr = 1;
  for (let i = 0; i < r; i++) nPr *= n - i;
  let rFact = 1;
  for (let i = 0; i < r; i++) rFact *= i + 1;
  const nCr = nPr / rFact;
  if (kind === 0) {
    // 正解は組み合わせ。順列の値を答えたら取り違え。
    if (nPr !== nCr && near(val, nPr)) {
      return "並ぶ順番まで数えちゃったみたい（それは順列）。選ぶだけなら、順番のちがいは同じものとして÷で減らすよ。";
    }
  } else {
    // 正解は順列。組み合わせの値を答えたら取り違え。
    if (nPr !== nCr && near(val, nCr)) {
      return "並ぶ順番を区別するのを わすれてるみたい。1列にならべるので、順番ちがいも別々に数えるよ。";
    }
  }
  return null;
}

// ==================================================================
// 単元定義一覧
// ==================================================================

export const UNIT_DEFS_C: DiagUnitDef[] = [
  {
    id: "c-frac-addsub",
    grade: "小5",
    title: "異分母分数のたし算・ひき算",
    lesson:
      "分母がちがう分数のたし算・ひき算は、まず分母をそろえます（通分）。分母をそろえたら、分子だけをたしたりひいたりします。答えは、これ以上約分できない形（既約分数）にしましょう。",
    hint: "分母がちがうときは、まず通分して分母をそろえよう。そのあと分子だけを計算するよ。",
    answerType: "fraction",
    generate: genFracAddSub,
    diagnose: diagFracAddSub,
  },
  {
    id: "c-tri-area",
    grade: "小5",
    title: "三角形の面積",
    lesson:
      "三角形の面積は「底辺×高さ÷2」で求めます。同じ三角形を2つ合わせると平行四辺形になるので、その半分と考えます。高さは、底辺に垂直な長さを使うのがポイントです。",
    hint: "まず底辺×高さを計算しよう。三角形はそのあと÷2をわすれずにね。",
    answerType: "integer",
    generate: genTriArea,
    diagnose: diagTriArea,
  },
  {
    id: "c-para-area",
    grade: "小5",
    title: "平行四辺形の面積",
    lesson:
      "平行四辺形の面積は「底辺×高さ」で求めます。かたむいていても、底辺に垂直な高さを使えば長方形と同じ考え方で計算できます。三角形とちがって÷2はしません。",
    hint: "底辺×高さでそのまま計算だよ。÷2はしないので注意してね。",
    answerType: "integer",
    generate: genParaArea,
    diagnose: diagParaArea,
  },
  {
    id: "c-trapezoid",
    grade: "小5",
    title: "台形の面積",
    lesson:
      "台形の面積は「(上底＋下底)×高さ÷2」で求めます。上底と下底は、平行になっている2つの辺のことです。まず2つをたしてから高さをかけ、最後に÷2します。",
    hint: "まず上底と下底をたそう。それに高さをかけて、さいごに÷2だよ。",
    answerType: "integer",
    generate: genTrapezoid,
    diagnose: diagTrapezoid,
  },
  {
    id: "c-volume",
    grade: "小5",
    title: "直方体の体積",
    lesson:
      "直方体の体積は「たて×よこ×高さ」で求めます。3つの辺の長さをすべてかけ合わせます。面積は2つの辺の積ですが、体積は3つ目の高さもかけるのがちがいです。",
    hint: "たて×よこ×高さ、と3つの辺を全部かけるよ。2つだけだと面積になっちゃうから注意してね。",
    answerType: "integer",
    generate: genVolume,
    diagnose: diagVolume,
  },
  {
    id: "c-per-unit",
    grade: "小5",
    title: "単位量あたりの大きさ",
    lesson:
      "「1個あたり」「1人あたり」のように、1つ分の大きさをそろえてくらべる考え方です。合計を個数でわると1つ分が求められます。わる向きをまちがえないことが大切です。",
    hint: "1個あたりを出すには「合計 ÷ 個数」だよ。どちらでわるか、向きに気をつけてね。",
    answerType: "integer",
    generate: genPerUnit,
    diagnose: diagPerUnit,
  },
  {
    id: "c-speed",
    grade: "小6",
    title: "速さ",
    lesson:
      "速さは、1時間（や1分）あたりに進む道のりのことです。「速さ＝道のり÷時間」で求めます。「はじき（は＝速さ、じ＝時間、き＝道のり）」の図を使うと、かけ算かわり算かを見分けやすくなります。",
    hint: "速さは 道のり÷時間 だよ。かけ算にしないよう、わる向きにも気をつけてね。",
    answerType: "integer",
    generate: genSpeed,
    diagnose: diagSpeed,
  },
  {
    id: "c-circle-area",
    grade: "小6",
    title: "円の面積",
    lesson:
      "円の面積は「半径×半径×円周率」で求めます。円周率はふつう3.14を使います。直径ではなく半径を使うこと、半径を2回かけることがポイントです。円周（まわりの長さ）の式とまちがえないようにしましょう。",
    hint: "半径×半径×3.14 だよ。直径ではなく半径を、2回かけるのがポイント。",
    answerType: "decimal",
    generate: genCircleArea,
    diagnose: diagCircleArea,
  },
  {
    id: "c-proportion",
    grade: "小6",
    title: "比例",
    lesson:
      "yがxに比例するとき、xが2倍、3倍になると、yも2倍、3倍になります。「y＝きまった数×x」の関係で、この決まった数を比例定数といいます。まず1あたり（y÷x）を求めると、別のxのときのyも計算できます。",
    hint: "まず y÷x で「1あたり（きまった数）」を出そう。あとは それに新しいx をかけるだけだよ。",
    answerType: "integer",
    generate: genProportion,
    diagnose: diagProportion,
  },
  {
    id: "c-combi",
    grade: "小6",
    title: "場合の数",
    lesson:
      "場合の数は、起こり方が何通りあるかを数えることです。ならべ方（順番を区別する）と、選び方（順番を区別しない）では数え方がちがいます。順番を区別しないときは、同じ組を重ねて数えないよう÷で減らします。",
    hint: "「ならべる」のか「選ぶだけ」なのかをまず見分けよう。順番を区別しないときは、数えすぎた分を÷で減らすよ。",
    answerType: "integer",
    generate: genCombi,
    diagnose: diagCombi,
  },
];
