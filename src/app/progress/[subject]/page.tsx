"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSubject } from "@/lib/account-client";
import type { SubjectResponse, UnitProgressResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { DISPLAY_SUBJECTS, displaySubjectMeta } from "@/lib/progress-view";
import { Donut } from "@/components/charts/Donut";
import { Sparkline } from "@/components/charts/Sparkline";

export default function SubjectProgressPage() {
  const router = useRouter();
  const params = useParams<{ subject: string }>();
  const rawSubject = params?.subject ?? "";
  const [mounted, setMounted] = useState(false);
  const [units, setUnits] = useState<UnitProgressResponse[]>([]);
  const [mastered, setMastered] = useState(0);
  const [target, setTarget] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    setMounted(true);
    const id = getChildId();
    if (!id) { router.replace("/login"); return; }
    const isValid = DISPLAY_SUBJECTS.some((d) => d.key === rawSubject);
    if (!isValid) { setReady(true); return; }
    const sources = displaySubjectMeta(rawSubject).sources;
    Promise.all(sources.map((s) => fetchSubject(id, s))).then((results) => {
      if (!alive) return;
      if (results.some((r) => r === null)) { router.replace("/login"); return; }
      const ok = results.filter((r): r is SubjectResponse => !!r);
      setUnits(ok.flatMap((r) => r.units));
      setMastered(ok.reduce((n, r) => n + r.masteredUnits, 0));
      setTarget(ok.reduce((n, r) => n + r.targetUnits, 0));
      setReady(true);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || !ready) return <div className="min-h-[50vh]" />;

  if (!DISPLAY_SUBJECTS.some((d) => d.key === rawSubject)) {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-ink-soft">
          ページが見つかりません。<Link href="/progress" className="text-sky underline">全体の進捗へ</Link>
        </div>
      </main>
    );
  }

  const meta = displaySubjectMeta(rawSubject);
  const pct = target > 0 ? Math.round((mastered / target) * 100) : 0;
  const sublabel = target === 0 ? "まだ記録なし" : `${mastered}/${target} 単元 制覇`;
  const arrow = (d: string) => (d === "up" ? "↑" : d === "down" ? "↓" : "→");

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/progress" className="text-sm text-ink-soft underline">← 全体の進捗</Link>
        <Link href="/family" className="text-sm text-ink-soft underline">おうちの人</Link>
      </header>
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-serif text-2xl text-ink"><span aria-hidden="true">{meta.emoji}</span>{meta.label}の進捗</h1>
        <div className="mt-6 flex justify-center">
          <Donut percent={pct} size={140} stroke={16}
            sublabel={sublabel} />
        </div>
        <ul className="mt-8 space-y-2">
          {units.length === 0 && <li className="text-sm text-faint">まだ記録がありません。</li>}
          {units.map((u) => (
            <li key={u.unitId} className="rounded-xl border border-line bg-white/70 p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink">{u.unitId}</span>
                <span className="flex items-center gap-2">
                  {u.mastered && <span className="rounded bg-terra/15 px-1.5 py-0.5 text-xs text-terra">制覇</span>}
                  <span className="text-sm text-ink-soft">{Math.round(u.rate * 100)}% {arrow(u.trend.direction)}</span>
                  <Sparkline series={u.trend.spark} />
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper2">
                <div className="h-full rounded-full bg-sky" style={{ width: `${Math.round(u.rate * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
