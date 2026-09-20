/** 数値をひとつ大きく見せるタイル（連続日数・のべ問題数など）。 */
export function StatTile({
  value,
  unit,
  label,
  accent = false,
}: {
  value: number | string;
  unit?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
      <div className={`font-serif leading-none ${accent ? "text-terra" : "text-sky"}`}
        style={{ fontSize: 34 }}>
        {value}
        {unit && <span className="ml-0.5 text-base text-ink-soft">{unit}</span>}
      </div>
      <div className="mt-1 text-xs text-faint">{label}</div>
    </div>
  );
}
