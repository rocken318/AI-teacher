"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchOverall } from "@/lib/account-client";
import type { OverallResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { groupSubjects } from "@/lib/progress-view";
import { Donut } from "@/components/charts/Donut";
import { StatTile } from "@/components/charts/StatTile";

export default function ProgressPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<OverallResponse | null | "loading">("loading");

  useEffect(() => {
    let alive = true;
    setMounted(true);
    const id = getChildId();
    if (!id) { router.replace("/login"); return; }
    fetchOverall(id).then((d) => {
      if (!alive) return;
      if (d === "unauth") { router.replace("/login"); return; }
      if (d === "forbidden") { router.replace("/family"); return; }
      setData(d);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || data === "loading" || data === null) return <div className="min-h-[50vh]" />;
  const groups = groupSubjects(data.bySubject);
  const mastered = data.overall.masteredUnits;
  const target = data.overall.targetUnits;
  const overallSublabel = target === 0 ? "まだ記録なし" : `${mastered}/${target} 単元 制覇`;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        <div className="flex gap-4 text-sm text-ink-soft">
          <Link href="/today" className="underline">今日</Link>
          <Link href="/family" className="underline">おうちの人</Link>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-8">
        <h1 className="font-serif text-2xl text-ink">全体の進捗</h1>
        <div className="mt-6 flex justify-center">
          <Donut percent={data.overall.percent} size={180} stroke={20}
            sublabel={overallSublabel} />
        </div>
        <div className="mt-8 grid grid-cols-5 gap-2">
          {groups.map((g) => (
            <Link key={g.key} href={`/progress/${g.key}`} className="flex flex-col items-center">
              <Donut percent={g.percent} size={64} stroke={8} />
              <span className="mt-1 text-xs text-ink">{g.emoji}{g.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          <StatTile value={data.totalAttempts} unit="問" label="のべ 問題数" />
          <StatTile value={`Lv${data.level.level}`} label={`次のLvまであと${data.level.toNext}問`} accent />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <StatTile value={data.streak.current} unit="日" label="連続" accent />
          <StatTile value={data.streak.thisMonth} unit="日" label="今月の学習日" />
          <StatTile value={data.streak.totalDays} unit="日" label="のべ学習日" />
        </div>
      </div>
    </main>
  );
}
