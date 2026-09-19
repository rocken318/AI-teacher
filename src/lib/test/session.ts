/**
 * テストセッションの純ロジック（教科非依存・生成AI不使用）。
 * - buildTestKey: 「前回・自己ベスト」比較のためのキー。subject＋選択単元集合。
 * - buildRandomTestKey: 「全単元からランダム」用の比較キー。教科×学年で固定。
 * - distributeCount: 出題数を選択単元へラウンドロビンで均等配分（端数は先頭単元から）。
 * - pickRandomSlots: 全単元プールから各スロットの単元を無作為抽出。
 */

/** 「全単元からランダム」の比較キー。実際に出た単元に依らず 教科×学年 で固定。 */
export function buildRandomTestKey(subject: string, grade: string): string {
  return `${subject}|${grade}|__ALL__`;
}

/**
 * 全単元プールから count 個のスロットに単元を無作為抽出する。
 * 戻り値の長さ＝count（pool が空 or count<=0 なら空）。単元の重複は許す
 * （プールが小さいときも count 問を満たすため）。
 */
export function pickRandomSlots(pool: string[], count: number): string[] {
  const units = Array.from(new Set(pool));
  if (units.length === 0 || count <= 0) return [];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(units[Math.floor(Math.random() * units.length)]);
  }
  return out;
}

/** 重複除去・ソートした単元集合から比較キーを作る。 */
export function buildTestKey(subject: string, unitIds: string[]): string {
  const sorted = Array.from(new Set(unitIds)).sort();
  return `${subject}|${sorted.join(",")}`;
}

/** count 問を単元へラウンドロビン配分。戻り値の長さ＝count（unitIds が空なら空）。 */
export function distributeCount(unitIds: string[], count: number): string[] {
  const units = Array.from(new Set(unitIds));
  if (units.length === 0 || count <= 0) return [];
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(units[i % units.length]);
  return out;
}
