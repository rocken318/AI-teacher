"use client";

import Link from "next/link";
import { groupTodayBySubject } from "@/lib/progress-view";
import type { TodayResponse } from "@/lib/progress-client-types";

/** DayBreakdown が使うコピー（TODAY_COPY の一部・構造的に受け取る）。 */
export interface DayBreakdownCopy {
  solved: string;
  accuracy: string;
  testPrefix: string;
  unitsTitle: string;
  mistakesTitle: string;
  noMistakes: string;
}

/**
 * 1日の内訳（問数・正答率タイル＋教科別バー＋テスト＋単元別＋その日のまちがい）。
 * `/today`（今日）と `/progress/day/[date]`（過去日）で共有する。答えは出さない。
 */
export function DayBreakdown({
  data,
  copy,
}: {
  data: TodayResponse;
  copy: DayBreakdownCopy;
}) {
  const pct = data.total > 0 ? Math.round(data.rate * 100) : 0;
  const bySubject = groupTodayBySubject(data.bySubject);

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
          <div className="font-serif text-sky" style={{ fontSize: 40 }}>{data.total}</div>
          <div className="text-xs text-faint">{copy.solved}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
          <div className="font-serif text-sky" style={{ fontSize: 40 }}>{pct}<span className="text-lg">%</span></div>
          <div className="text-xs text-faint">{copy.accuracy}</div>
        </div>
      </div>

      {/* 教科別バー（全体表示と同じ5教科に集約） */}
      {bySubject.length > 0 && (
        <section className="mt-6 space-y-2">
          {bySubject.map((g) => (
            <div key={g.key} className="rounded-xl border border-line bg-white/60 p-3">
              <div className="flex justify-between text-sm text-ink">
                <span>{g.emoji}{g.label}</span><span>{g.correct}/{g.attempts}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper2">
                <div className="h-full rounded-full bg-sky"
                  style={{ width: `${g.attempts ? Math.round((g.correct / g.attempts) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}

      {data.testCount > 0 && (
        <p className="mt-6 text-sm text-ink-soft">{copy.testPrefix} {data.testCount}回。
          {data.tests.map((t, i) => <span key={`${t.subject}-${i}`} className="ml-2 text-terra">{t.score}/{t.total}</span>)}
        </p>
      )}

      {/* やった単元（単元別の内訳） */}
      {data.byUnit.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-serif text-lg text-ink">{copy.unitsTitle}</h2>
          <ul className="space-y-2">
            {data.byUnit.map((u) => (
              <li
                key={`${u.subject}-${u.unitId}`}
                className="flex items-center justify-between rounded-xl border border-line bg-white/60 px-3 py-2 text-sm"
              >
                <span className="text-ink">{u.title}</span>
                <span className="text-ink-soft">{u.correct}/{u.attempts}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* まちがえた問題（問題文つき・答えは出さない） */}
      {data.total > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-serif text-lg text-ink">{copy.mistakesTitle}</h2>
          {data.todayMistakes.length === 0 ? (
            <p className="text-sm text-faint">{copy.noMistakes}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {data.todayMistakes.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-terra/30 bg-terra/5 px-3 py-2 text-sm text-ink"
                  >
                    {m.preview || "（問題を表示できません）"}
                  </li>
                ))}
              </ul>
              <Link href="/review" className="mt-3 inline-block text-sm text-terra underline">
                まちがいノートで やり直す →
              </Link>
            </>
          )}
        </section>
      )}
    </>
  );
}
