"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchToday } from "@/lib/account-client";
import type { TodayResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { apiSubjectLabel } from "@/lib/progress-view";

export default function TodayPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TodayResponse | null | "loading">("loading");

  useEffect(() => {
    let alive = true;
    setMounted(true);
    const id = getChildId();
    if (!id) { router.replace("/login"); return; }
    fetchToday(id).then((d) => {
      if (!alive) return;
      if (d === null) { router.replace("/login"); return; }
      setData(d);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || data === "loading") return <div className="min-h-[50vh]" />;
  if (data === null) return <div className="min-h-[50vh]" />;

  const praise = data.total === 0 ? "きょうも いつでも どうぞ"
    : data.rate >= 0.8 ? "すごい！よくできてるね"
    : "いいちょうし！つづけよう";
  const pct = data.total > 0 ? Math.round(data.rate * 100) : 0;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        <Link href="/family" className="text-sm text-ink-soft underline">おうちの人のページ</Link>
      </header>
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="font-serif text-2xl text-terra">{praise}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
            <div className="font-serif text-sky" style={{ fontSize: 40 }}>{data.total}</div>
            <div className="text-xs text-faint">きょう といた もんだい</div>
          </div>
          <div className="rounded-2xl border border-line bg-white/70 p-4 text-center shadow-card">
            <div className="font-serif text-sky" style={{ fontSize: 40 }}>{pct}<span className="text-lg">%</span></div>
            <div className="text-xs text-faint">せいかい率</div>
          </div>
        </div>
        {/* 教科別バー */}
        <section className="mt-6 space-y-2">
          {Object.entries(data.bySubject).map(([subj, v]) => (
            <div key={subj} className="rounded-xl border border-line bg-white/60 p-3">
              <div className="flex justify-between text-sm text-ink">
                <span>{apiSubjectLabel(subj)}</span><span>{v.correct}/{v.attempts}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper2">
                <div className="h-full rounded-full bg-sky"
                  style={{ width: `${v.attempts ? Math.round((v.correct / v.attempts) * 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </section>
        {data.testCount > 0 && (
          <p className="mt-6 text-sm text-ink-soft">きょうは テストを {data.testCount}回。
            {data.tests.map((t, i) => <span key={`${t.subject}-${i}`} className="ml-2 text-terra">{t.score}/{t.total}</span>)}
          </p>
        )}
      </div>
    </main>
  );
}
