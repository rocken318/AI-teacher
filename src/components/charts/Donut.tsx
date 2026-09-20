import { donutDash, clampPercent } from "@/lib/charts";

/**
 * パーセント表示のドーナツ（手書きSVG・依存なし）。
 * 色は意味トークン（--c-primary / --c-accent 等）を使い、学齢テーマに追従する。
 */
export function Donut({
  percent,
  size = 120,
  stroke = 14,
  color = "rgb(var(--c-primary))",
  track = "rgb(var(--c-line))",
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  label?: string;
  sublabel?: string;
}) {
  const p = clampPercent(percent);
  const r = (size - stroke) / 2;
  const { circumference, dash, gap } = donutDash(p, r);
  const c = size / 2;
  return (
    <div className="inline-flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img"
        aria-label={label ? `${label} ${p}%` : `${p}%`}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`}
        />
        <text x={c} y={c} textAnchor="middle" dominantBaseline="central"
          className="font-serif" style={{ fill: "rgb(var(--c-ink))", fontSize: size * 0.26 }}>
          {p}%
        </text>
      </svg>
      {label && <span className="mt-1 text-sm text-ink">{label}</span>}
      {sublabel && <span className="text-xs text-faint">{sublabel}</span>}
    </div>
  );
}
