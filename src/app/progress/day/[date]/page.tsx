"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchDay } from "@/lib/account-client";
import type { TodayResponse } from "@/lib/progress-client-types";
import { getChildId } from "@/lib/progress";
import { getStage } from "@/lib/stage";
import type { Stage } from "@/lib/stage";
import { DayBreakdown } from "@/components/DayBreakdown";
import { TODAY_COPY } from "@/lib/today-copy";

/** "YYYY-MM-DD" → "M月D日"。不正なら素の文字列。 */
function jaDate(key: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  return `${Number(m[1])}月${Number(m[2])}日`;
}

export default function DayDetailPage() {
  const router = useRouter();
  const params = useParams<{ date: string }>();
  const date = String(params?.date ?? "");
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TodayResponse | null | "loading">("loading");

  useEffect(() => {
    let alive = true;
    setMounted(true);
    const id = getChildId();
    if (!id) { router.replace("/login"); return; }
    fetchDay(id, date).then((d) => {
      if (!alive) return;
      if (d === "unauth") { router.replace("/login"); return; }
      if (d === "forbidden") { router.replace("/family"); return; }
      setData(d);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (!mounted || data === "loading" || data === null) return <div className="min-h-[50vh]" />;

  const stage: Stage = getStage() ?? "elementary";
  const copy = TODAY_COPY[stage];

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/progress" className="text-sm text-sky underline">← もどる</Link>
        <Link href="/family" className="text-sm text-ink-soft underline">{copy.parentLink}</Link>
      </header>
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="font-serif text-2xl text-ink">{jaDate(date)}のがんばり</h1>
        {data.total === 0 ? (
          <p className="mt-6 text-sm text-faint">この日は学習していません。</p>
        ) : (
          <DayBreakdown data={data} copy={copy} />
        )}
      </div>
    </main>
  );
}
