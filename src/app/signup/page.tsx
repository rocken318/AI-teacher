"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, pickPostAuthDestination } from "@/lib/account-client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await signup(email, password);
    if (r.ok) {
      const dest = await pickPostAuthDestination();
      setBusy(false);
      router.push(dest);
    } else {
      setBusy(false);
      setError(r.error ?? "登録に失敗しました。");
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line px-4 py-3">
        <Link href="/" className="font-serif text-lg text-ink">AI先生</Link>
      </header>
      <div className="mx-auto max-w-sm px-4 py-10">
        <h1 className="font-serif text-2xl text-ink">アカウントを作る</h1>
        <p className="mt-1 text-sm text-ink-soft">おうちの方のメールとパスワードで登録します。</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-2xl border border-line bg-white/70 p-5 shadow-card">
          <label className="block">
            <span className="text-sm text-ink-soft">メールアドレス</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />
          </label>
          <label className="block">
            <span className="text-sm text-ink-soft">パスワード（8文字以上）</span>
            <input type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-ink" />
          </label>
          {error && <p className="text-sm text-terra">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-lg bg-sky px-4 py-2 font-medium text-white disabled:opacity-60">
            {busy ? "作成中…" : "アカウントを作る"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-soft">
          すでにアカウントがある方は <Link href="/login" className="text-sky underline">ログイン</Link>
        </p>
      </div>
    </main>
  );
}
