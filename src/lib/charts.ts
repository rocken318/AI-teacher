/**
 * チャート描画の純粋な幾何ヘルパー（依存追加なし・SVG 用）。
 * コンポーネントはこの結果を SVG 属性に流し込むだけにして、ロジックをテスト可能にする。
 */

export interface DonutDash {
  circumference: number;
  dash: number; // 塗る長さ
  gap: number; // 残り
}

/** percent(0..100) を丸める。 */
export function clampPercent(p: number): number {
  return Math.max(0, Math.min(100, Math.round(p)));
}

/** 半径 r の円で percent 分だけ塗る stroke-dasharray 用の長さ。 */
export function donutDash(percent: number, r: number): DonutDash {
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(100, percent)) / 100;
  const dash = circumference * ratio;
  return { circumference, dash, gap: circumference - dash };
}

export interface Point {
  x: number;
  y: number;
}

/**
 * 0..1 の系列を w×h の矩形内の座標に写像する。
 * x は等間隔（左→右）、y は上下反転（rate=1 が上端 y=0、rate=0 が下端 y=h）。
 * 1点のときは x=0（描画側で単点マーカーにする）。空系列は空配列。
 */
export function sparklinePoints(series: number[], w: number, h: number): Point[] {
  const n = series.length;
  if (n === 0) return [];
  if (n === 1) {
    const v = Math.max(0, Math.min(1, series[0]));
    return [{ x: 0, y: h - v * h }];
  }
  return series.map((raw, i) => {
    const v = Math.max(0, Math.min(1, raw));
    return { x: (i / (n - 1)) * w, y: h - v * h };
  });
}
