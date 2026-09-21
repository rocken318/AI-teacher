/**
 * 単元別マスター度（制覇度）の純ロジック。
 *
 * - 単元選択画面で「その単元をどれだけマスターしたか」を出すための計算。
 * - 制覇のしきい値は全体ダッシュボードと同じ（progress-stats/stats）を再利用し、
 *   一本化する（正答率 ≥ 0.7 かつ ≥ 5 問）。
 * - すべて副作用の無い純関数（テスト可能・クライアント安全）。
 */
import { MASTERY_RATE, MASTERY_MIN_ATTEMPTS } from "@/lib/progress-stats/stats";

/** 単元1つぶんの集計。 */
export type UnitStat = { attempts: number; correct: number };

/** 表示用に整えた単元のマスター度。 */
export type UnitMasteryView = {
  attempts: number;
  correct: number;
  rate: number; // 0..1
  percent: number; // 0..100 の整数
  mastered: boolean;
};

const EMPTY: UnitStat = { attempts: 0, correct: 0 };

/** 単元集計 → 表示用ビュー（制覇判定つき）。 */
export function masteryView(stat: UnitStat | undefined | null): UnitMasteryView {
  const attempts = stat?.attempts ?? 0;
  const correct = stat?.correct ?? 0;
  const rate = attempts > 0 ? correct / attempts : 0;
  const mastered = attempts >= MASTERY_MIN_ATTEMPTS && rate >= MASTERY_RATE;
  return { attempts, correct, rate, percent: Math.round(rate * 100), mastered };
}

/**
 * 「制覇まで」の補足文。
 * - 制覇済み・未挑戦 → ""（呼び出し側で別表示）
 * - 問題数が足りない（< MIN） → あと N 問で制覇はんてい
 * - 問題数は足りるが正答率が足りない → 制覇まで正答率 70%
 */
export function masteryHint(v: UnitMasteryView): string {
  if (v.mastered || v.attempts === 0) return "";
  if (v.attempts < MASTERY_MIN_ATTEMPTS) {
    return `あと${MASTERY_MIN_ATTEMPTS - v.attempts}問で制覇はんてい`;
  }
  return `制覇まで正答率${Math.round(MASTERY_RATE * 100)}%`;
}

/**
 * 1単元の集計を取り出す（サーバー優先 → ローカル → 空）。
 * ログイン中はサーバー集計が端末間で正確なため、ある単元はそちらを使う。
 */
export function pickUnitStat(
  unitId: string,
  local: Record<string, UnitStat>,
  server: Record<string, UnitStat> | null,
): UnitStat {
  return server?.[unitId] ?? local[unitId] ?? { ...EMPTY };
}

/**
 * 1回の挑戦を加えた新しい集計マップを返す（楽観更新用・不変）。
 * 練習して単元選択に戻ったとき、再取得なしで表示を最新化するのに使う。
 */
export function bumpUnit(
  map: Record<string, UnitStat>,
  unitId: string,
  correct: boolean,
): Record<string, UnitStat> {
  const cur = map[unitId] ?? EMPTY;
  return {
    ...map,
    [unitId]: {
      attempts: cur.attempts + 1,
      correct: cur.correct + (correct ? 1 : 0),
    },
  };
}
