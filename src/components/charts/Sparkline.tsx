import { sparklinePoints } from "@/lib/charts";

/** 0..1 の系列を小さな折れ線で描く（推移表示）。色は意味トークン。 */
export function Sparkline({
  series,
  width = 80,
  height = 24,
  color = "rgb(var(--c-primary))",
}: {
  series: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const pts = sparklinePoints(series, width, height);
  if (pts.length === 0) {
    return <svg width={width} height={height} aria-hidden="true" />;
  }
  if (pts.length === 1) {
    return (
      <svg width={width} height={height} role="img" aria-label="推移データ1件">
        <circle cx={pts[0].x + 2} cy={pts[0].y} r={2.5} fill={color} />
      </svg>
    );
  }
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg width={width} height={height} role="img" aria-label="正答率の推移">
      <path d={d} fill="none" stroke={color} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
