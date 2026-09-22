/**
 * 直近N日の日別学習量（努力量）を棒グラフで描く。色は意味トークン（学齢テーマ追従）。
 * - 高さ ∝ その日の問題数 / maxCount。0問の日は薄いベースライン。
 * - 末尾（今日）はアクセント色で強調。
 * - width="100%" で親幅にフィット（preserveAspectRatio="none" で横に伸縮）。
 * データ無し（days空）は何も描かない＝SSR/未取得時に安全。
 */
export function DailyBars({
  days,
  maxCount,
  compact = false,
}: {
  days: { date: string; count: number }[];
  maxCount: number;
  compact?: boolean;
}) {
  const n = days.length;
  if (n === 0) return null;

  const H = compact ? 22 : 56;
  const barW = 3;
  const gap = 1;
  const W = n * (barW + gap);
  const minBar = compact ? 1 : 1.5; // 0問の日の薄いベースライン高さ

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
      role="img"
      aria-label={`直近${n}日の日別 学習量`}
    >
      {days.map((d, i) => {
        const isToday = i === n - 1;
        const ratio = maxCount > 0 ? d.count / maxCount : 0;
        const h = d.count > 0 ? Math.max(minBar, ratio * (H - 2)) : minBar;
        const fill =
          d.count === 0
            ? "rgb(var(--c-line))"
            : isToday
              ? "rgb(var(--c-accent))"
              : "rgb(var(--c-primary))";
        return (
          <rect
            key={d.date}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            fill={fill}
            opacity={d.count === 0 ? 0.55 : 1}
          />
        );
      })}
    </svg>
  );
}
