"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchChildren, createChild, claim, logout } from "@/lib/account-client";
import type { Child } from "@/lib/progress-client-types";
import { setActiveChild, clearActiveChild, getActiveChild } from "@/lib/progress";
import { setStage } from "@/lib/stage";
import { STAGES } from "@/lib/stage";

export default function FamilyPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState("");
  const [stage, setStageSel] = useState("elementary");
  const [inherit, setInherit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fix 5: notice state for non-blocking claim failure message
  const [notice, setNotice] = useState<string | null>(null);
  const active = mounted ? getActiveChild() : "";

  async function load() {
    const list = await fetchChildren();
    if (list === null) {
      router.replace("/login");
      return;
    }
    setChildren(list);
  }

  // Fix 6: guard mount load against unmount
  useEffect(() => {
    let cancelled = false;
    setMounted(true);
    fetchChildren().then((list) => {
      if (cancelled) return;
      if (list === null) {
        router.replace("/login");
        return;
      }
      setChildren(list);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(c: Child) {
    setActiveChild(c.id);
    if (c.stage === "elementary" || c.stage === "junior" || c.stage === "senior") {
      setStage(c.stage);
    }
    router.push("/");
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Fix 5: clear notice at start
    setNotice(null);
    // Fix 4: snapshot values before first await
    const trimmedName = name.trim();
    const chosenStage = stage;
    // 引き継ぎ用に、現在の（アクティブ未設定なら匿名）childId を控える。
    const prevAnon = getActiveChild() ? "" : localStorageAnonId();
    const r = await createChild(trimmedName, chosenStage);
    if (r.error || !r.id) {
      setBusy(false);
      setError(r.error ?? "作成に失敗しました。");
      return;
    }
    if (inherit && prevAnon) {
      // Fix 5: capture claim result and surface failure
      const claimed = await claim(prevAnon, r.id);
      if (!claimed) {
        setNotice("記録の引き継ぎに失敗しました。あとで再試行できます。");
      }
    }
    setActiveChild(r.id);
    setBusy(false);
    setName("");
    setInherit(false);
    await load();
  }

  async function onLogout() {
    await logout();
    clearActiveChild();
    router.replace("/login");
  }

  if (!mounted) return <div className="min-h-[40vh]" />;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
        {/* Fix 1: explicit type="button" on logout */}
        <button type="button" onClick={onLogout} className="text-sm text-ink-soft underline">ログアウト</button>
      </header>
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="font-serif text-2xl text-ink">おうちの人のページ</h1>
        <p className="mt-1 text-sm text-ink-soft">お子さんを選んで学習、またはがんばりを見られます。</p>

        <section className="mt-6 space-y-3">
          {children.length === 0 && <p className="text-sm text-faint">まだプロフィールがありません。下から追加してください。</p>}
          {children.map((c) => (
            <div key={c.id} className={`flex items-center justify-between rounded-2xl border p-4 shadow-card ${active === c.id ? "border-sky bg-white" : "border-line bg-white/70"}`}>
              <div>
                <div className="font-serif text-lg text-ink">{c.name}</div>
                <div className="text-xs text-faint">{stageLabel(c.stage)}</div>
              </div>
              <div className="flex gap-2">
                {/* Fix 1: explicit type="button" */}
                <button type="button" onClick={() => choose(c)} className="rounded-lg bg-sky px-3 py-1.5 text-sm text-white">この子で学習</button>
                {/* Fix 2: replace Link+onClick with button that sets-then-navigates */}
                <button type="button" onClick={() => { setActiveChild(c.id); router.push("/today"); }} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink">今日</button>
                <button type="button" onClick={() => { setActiveChild(c.id); router.push("/progress"); }} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink">全体</button>
              </div>
            </div>
          ))}
        </section>

        <form onSubmit={onAdd} className="mt-8 space-y-3 rounded-2xl border border-line bg-white/70 p-5 shadow-card">
          <h2 className="font-serif text-lg text-ink">プロフィールを追加</h2>
          {/* Fix 3: wrap inputs in labels with visible text */}
          <label className="block">
            <span className="text-sm text-ink-soft">なまえ（20文字まで）</span>
            {/* Fix 4: disabled={busy} added */}
            <input value={name} onChange={(e) => setName(e.target.value)}
              required maxLength={20} disabled={busy}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">学齢</span>
            {/* Fix 4: disabled={busy} added */}
            <select value={stage} onChange={(e) => setStageSel(e.target.value)} disabled={busy}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink">
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}（{s.range}）</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            {/* Fix 4: disabled={busy} added to checkbox */}
            <input type="checkbox" checked={inherit} onChange={(e) => setInherit(e.target.checked)} disabled={busy} />
            この端末のこれまでの記録を引き継ぐ
          </label>
          {error && <p className="text-sm text-terra">{error}</p>}
          {/* Fix 5: render notice near error line */}
          {notice && <p className="text-sm text-terra">{notice}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-sky px-4 py-2 text-white disabled:opacity-60">
            {busy ? "追加中…" : "追加する"}
          </button>
        </form>
      </div>
    </main>
  );
}

function stageLabel(stage: string): string {
  return STAGES.find((s) => s.key === stage)?.label ?? stage;
}
/** progress.ts の匿名 childId キーを直接読む（アクティブ未設定時の引き継ぎ元）。 */
function localStorageAnonId(): string {
  try {
    return window.localStorage.getItem("ai-sensei-child-id-v1") ?? "";
  } catch {
    return "";
  }
}
