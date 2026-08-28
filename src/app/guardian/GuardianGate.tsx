"use client";

import { useState } from "react";

/**
 * 見守りダッシュボードの入口（クライアント）。
 * - 未設定（configured=false）: 保護者パスコードを「設定」するフォーム。
 * - 設定済み（configured=true）: パスコードを「入力」して解錠するフォーム。
 * 成功したら Cookie が張られるので、ページを再読み込みして中身を表示する。
 */
export function GuardianGate({
  configured,
  managedByEnv,
}: {
  configured: boolean;
  managedByEnv: boolean;
}) {
  if (configured) {
    return <LoginForm managedByEnv={managedByEnv} />;
  }
  return <SetupForm />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-sky-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="font-serif text-xl font-bold text-sky-700">
          見守りダッシュボード
        </h1>
        {children}
      </div>
    </main>
  );
}

function LoginForm({ managedByEnv }: { managedByEnv: boolean }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
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
    <Shell>
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
      {managedByEnv && (
        <p className="mt-4 text-xs text-slate-400">
          ※ このパスコードは環境変数（GUARDIAN_PASSCODE）で管理されています。
        </p>
      )}
    </Shell>
  );
}

function SetupForm() {
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (code.trim().length < 4) {
      setError("パスコードは4文字以上にしてください。");
      return;
    }
    if (code !== confirm) {
      setError("確認用のパスコードが一致しません。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guardian/passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", newCode: code }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(
        data.error === "no-store"
          ? "保存先が見つかりませんでした（データベース未接続）。"
          : data.error === "env-managed"
            ? "環境変数で管理されているため、ここでは設定できません。"
            : (data.error ?? "設定に失敗しました。"),
      );
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <p className="mt-2 text-sm text-slate-600">
        はじめに、保護者用のパスコードを決めてください。
        次回からはこのパスコードで見守りページを開けます。
      </p>
      <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
        お子さんの会話ログを守るためのカギです。忘れないもの・推測されにくいものにしてください。
      </div>
      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
        <input
          type="password"
          autoComplete="new-password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="新しいパスコード（4文字以上）"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="確認のためもう一度"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-1 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {busy ? "設定中…" : "このパスコードで設定する"}
        </button>
      </form>
    </Shell>
  );
}
