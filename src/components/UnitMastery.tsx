"use client";

import { masteryView, masteryHint, type UnitStat } from "@/lib/unit-mastery";

/**
 * 単元カードに出す「マスター度」表示。
 * 制覇バッジ＋正答率＋のべ問題数＋（制覇まで）の補足。
 * マウント前（stat=null）は何も出さない＝SSR とハイドレーションを一致させる。
 */
export function UnitMastery({ stat }: { stat: UnitStat | null }) {
  if (!stat) return null;
  const v = masteryView(stat);

  if (v.attempts === 0) {
    return (
      <span className="mt-2 block text-[12px] text-faint">
        まだ挑戦していないよ
      </span>
    );
  }

  const hint = masteryHint(v);
  return (
    <span className="mt-2 block">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
        {v.mastered && (
          <span className="inline-flex items-center rounded-full bg-sky/10 px-2 py-0.5 font-bold text-sky">
            ✅ 制覇
          </span>
        )}
        <span className="font-bold text-ink-soft">正答率 {v.percent}%</span>
        <span className="text-faint">・ {v.attempts}問</span>
      </span>
      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-paper2">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(100, v.percent))}%`,
            background: v.mastered ? "#2f6fb0" : "#c9622f",
          }}
        />
      </span>
      {hint && (
        <span className="mt-1 block text-[11px] text-faint">{hint}</span>
      )}
    </span>
  );
}
