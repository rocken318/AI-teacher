"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchToday } from "@/lib/account-client";
import type { TodayResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { groupTodayBySubject } from "@/lib/progress-view";
import { getStage } from "@/lib/stage";
import type { Stage } from "@/lib/stage";

/** 学齢別のコピー（小=ひらがな親しみ／中=標準／高=簡潔な敬体）。 */
interface TodayCopy {
  praiseZero: string;
  praiseHigh: string;
  praiseMid: string;
  solved: string;
  accuracy: string;
  testPrefix: string;
  parentLink: string;
}
const TODAY_COPY: Record<Stage, TodayCopy> = {
  elementary: {
    praiseZero: "きょうも いつでも どうぞ",
    praiseHigh: "すごい！よくできてるね",
    praiseMid: "いいちょうし！つづけよう",
    solved: "きょう といた もんだい",
    accuracy: "せいかい率",
    testPrefix: "きょうは テストを",
    parentLink: "おうちの人のページ",
  },
  junior: {
    praiseZero: "今日はいつでもどうぞ",
    praiseHigh: "よくできています",
    praiseMid: "この調子で続けよう",
    solved: "今日解いた問題",
    accuracy: "正答率",
    testPrefix: "今日はテストを",
    parentLink: "保護者ページ",
  },
  senior: {
    praiseZero: "今日の学習を始めましょう",
    praiseHigh: "好調です",
    praiseMid: "この調子で続けましょう",
    solved: "今日解いた問題数",
    accuracy: "正答率",
    testPrefix: "今日のテスト",
    parentLink: "保護者ページ",
  },
};

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
      if (d === "unauth") { router.replace("/login"); return; }
      if (d === "forbidden") { router.replace("/family"); return; }
      setData(d);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted || data === "loading") return <div className="min-h-[50vh]" />;
  if (data === null) return <div className="min-h-[50vh]" />;

  const stage: Stage = getStage() ?? "elementary";
  const copy = TODAY_COPY[stage];
  const praise = data.total === 0 ? copy.praiseZero
    : data.rate >= 0.8 ? copy.praiseHigh
    : copy.praiseMid;
  const pct = data.total > 0 ? Math.round(data.rate * 100) : 0;
  const bySubject = groupTodayBySubject(data.bySubject);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        <Link href="/family" className="text-sm text-ink-soft underline">{copy.parentLink}</Link>
      </header>
      <div className="mx-auto max-w-md px-4 py-8">
        <p className="font-serif text-2xl text-terra">{praise}</p>
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
      </div>
    </main>
  );
}
