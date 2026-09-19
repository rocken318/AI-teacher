/**
 * テストセッションの純ロジック（教科非依存・生成AI不使用）。
 * - buildTestKey: 「前回・自己ベスト」比較のためのキー。subject＋選択単元集合。
 * - distributeCount: 出題数を選択単元へラウンドロビンで均等配分（端数は先頭単元から）。
 */

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
