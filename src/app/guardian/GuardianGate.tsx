"use client";

import { useState } from "react";

/**
 * 見守りダッシュボードの入口（クライアント・ログイン専用）。
 * パスコードが設定済みのときだけ表示される。
 * 成功したら Cookie が張られるので、ページを再読み込みして中身を表示する。
 * （初回の「設定」はダッシュボード内の「パスコードを設定」から行う。）
 */
export function GuardianGate({ wrong = false }: { wrong?: boolean }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(
    wrong ? "パスコードが違います。もう一度お試しください。" : null,
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guardian/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", code }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError(
        res.status === 401
          ? "パスコードが違います。もう一度お試しください。"
          : "解錠に失敗しました。",
      );
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-sky-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="font-serif text-xl font-bold text-sky-700">
          見守りダッシュボード
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          保護者用のパスコードを入力してください。
        </p>
        {error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            type="password"
            autoComplete="current-password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="パスコード"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={busy || !code.trim()}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            {busy ? "…" : "開く"}
          </button>
        </form>
      </div>
    </main>
  );
}
