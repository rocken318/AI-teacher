"use client";

import { useState } from "react";

/**
 * 見守りダッシュボードの閲覧 UI（client component）。
 * - 左: セッション一覧（テーマ・学年・日時・メッセージ数）
 * - 1件クリックで /api/guardian?id=... を fetch し、
 *   会話ログ・モデレーション記録・気づき／つまずき／サマリを表示。
 * データが無い場合も安全に空状態を扱う。
 */

type SessionSummary = {
  id: string;
  topic: string;
  gradeBand: string;
  topicId: string | null;
  startedAt: string;
  messageCount: number;
};

type Message = {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
};

type Moderation = {
  id: string;
  messageId: string | null;
  stage: string;
  verdict: string;
  reason: string | null;
  createdAt: string;
};

type SessionDetail = {
  session: SessionSummary;
  messages: Message[];
  moderations: Moderation[];
};

type Insights = {
  summary: string;
  noticed: string[];
  struggles: string[];
};

type DetailResponse = {
  detail: SessionDetail;
  insights: Insights;
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GuardianView({
  sessions,
  authCode,
}: {
  sessions: SessionSummary[];
  authCode?: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openSession(id: string) {
    setSelectedId(id);
    setData(null);
    setError(null);
    setLoading(true);
    try {
      // 認証コードはヘッダで渡す（ブラウザURL・履歴に残さない）
      const res = await fetch(`/api/guardian?id=${encodeURIComponent(id)}`, {
        headers: authCode ? { "x-guardian-code": authCode } : undefined,
      });
      if (!res.ok) {
        setError(
          res.status === 404
            ? "この対話は見つかりませんでした。"
            : "読み込みに失敗しました。",
        );
        return;
      }
      const json = (await res.json()) as DetailResponse;
      setData(json);
    } catch {
      setError("読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        まだ保存された対話がありません。
        <br />
        お子さんが探究対話を始めると、ここに記録が並びます。
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* 一覧 */}
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => {
          const active = s.id === selectedId;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => openSession(s.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  active
                    ? "border-sky-400 bg-sky-50 ring-2 ring-sky-100"
                    : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-slate-800">
                    {s.topic}
                  </span>
                  <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                    {s.gradeBand}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{formatDate(s.startedAt)}</span>
                  <span>{s.messageCount} メッセージ</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 詳細 */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        {!selectedId && (
          <p className="text-sm text-slate-500">
            左の一覧から対話を選ぶと、ここに会話ログと要約が表示されます。
          </p>
        )}

        {selectedId && loading && (
          <p className="text-sm text-slate-500">読み込み中…</p>
        )}

        {selectedId && error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        {selectedId && !loading && !error && data && (
          <DetailPanel data={data} />
        )}
      </div>
    </div>
  );
}

function DetailPanel({ data }: { data: DetailResponse }) {
  const { detail, insights } = data;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-lg font-bold text-sky-700">
          {detail.session.topic}
        </h2>
        <p className="text-xs text-slate-500">
          {detail.session.gradeBand} ・ {formatDate(detail.session.startedAt)}
        </p>
      </div>

      {/* 要約（気づき／つまずき） */}
      <section className="rounded-lg bg-sky-50 px-3 py-3">
        <h3 className="text-sm font-semibold text-sky-800">まとめ</h3>
        <p className="mt-1 text-sm text-slate-700">{insights.summary}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-semibold text-emerald-700">
              気づき
            </h4>
            {insights.noticed.length > 0 ? (
              <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                {insights.noticed.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-slate-400">—</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-amber-700">
              つまずき
            </h4>
            {insights.struggles.length > 0 ? (
              <ul className="mt-1 list-disc pl-4 text-sm text-slate-700">
                {insights.struggles.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-slate-400">—</p>
            )}
          </div>
        </div>
      </section>

      {/* 会話ログ */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          会話ログ
        </h3>
        {detail.messages.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {detail.messages.map((m) => {
              const isChild = m.sender === "child";
              return (
                <li
                  key={m.id}
                  className={`flex ${isChild ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      isChild
                        ? "bg-sky-600 text-white"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div
                      className={`mb-0.5 text-[10px] font-semibold ${
                        isChild ? "text-sky-100" : "text-slate-500"
                      }`}
                    >
                      {isChild ? "お子さん" : "AI先生"}
                    </div>
                    <div className="whitespace-pre-wrap">{m.text}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">メッセージはありません。</p>
        )}
      </section>

      {/* モデレーション記録 */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          安全モデレーションの記録
        </h3>
        {detail.moderations.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {detail.moderations.map((mod) => {
              const flagged = mod.verdict === "flagged";
              return (
                <li
                  key={mod.id}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-xs"
                >
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-slate-600">
                    {mod.stage === "in" ? "入力" : "出力"}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-semibold ${
                      flagged
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {flagged ? "flagged" : "ok"}
                  </span>
                  {mod.reason && (
                    <span className="text-slate-500">{mod.reason}</span>
                  )}
                  <span className="ml-auto text-slate-400">
                    {formatDate(mod.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">
            モデレーションの記録はありません。
          </p>
        )}
      </section>
    </div>
  );
}
