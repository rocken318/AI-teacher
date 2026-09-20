import { expect, test } from "vitest";
import { donutDash, sparklinePoints, clampPercent } from "@/lib/charts";

test("clampPercent は 0..100 に丸める", () => {
  expect(clampPercent(-5)).toBe(0);
  expect(clampPercent(150)).toBe(100);
  expect(clampPercent(47.6)).toBe(48);
});

test("donutDash は円周に対する dash 長を返す（percentに比例）", () => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const d0 = donutDash(0, r);
  const d100 = donutDash(100, r);
  const d50 = donutDash(50, r);
  expect(d0.dash).toBeCloseTo(0);
  expect(d0.gap).toBeCloseTo(circ);
  expect(d100.dash).toBeCloseTo(circ);
  expect(d50.dash).toBeCloseTo(circ / 2);
  expect(d50.circumference).toBeCloseTo(circ);
  expect(d50.dash + d50.gap).toBeCloseTo(d50.circumference);
});

test("sparklinePoints は 0..1 の系列を w×h 内の座標へ写像（左→右、上下反転）", () => {
  const pts = sparklinePoints([0, 1], 100, 20);
  // 2点: x=0 と x=100、y は rate=0→下端(h)、rate=1→上端(0)
  expect(pts).toEqual([
    { x: 0, y: 20 },
    { x: 100, y: 0 },
  ]);
});

test("sparklinePoints は1点でも中央に置き壊れない", () => {
  const pts = sparklinePoints([0.5], 100, 20);
  expect(pts.length).toBe(1);
  expect(pts[0].y).toBeCloseTo(10);
});

test("sparklinePoints は空系列で空配列", () => {
  expect(sparklinePoints([], 100, 20)).toEqual([]);
});
