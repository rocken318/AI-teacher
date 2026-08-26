"use client";

import { useRef, useState } from "react";

interface Turn {
  role: "child" | "ai";
  text: string;
  rewritten?: boolean;
}

const GREETING: Turn = {
  role: "ai",
  text: "こんにちは！きょうは「なぜ そらは あおいの？」を いっしょに かんがえよう。きみは どうして あおいと おもう？",
};

export function Chat({ apiKeyConfigured }: { apiKeyConfigured: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | undefined>(undefined);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;

    setError(null);
    setInput("");
    const nextTurns: Turn[] = [...turns, { role: "child", text: message }];
    setTurns(nextTurns);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          // AIの挨拶は履歴から除いて送る（対話生成の文脈用）
          history: turns
            .filter((t, i) => !(i === 0 && t === GREETING))
            .map((t) => ({ role: t.role, text: t.text })),
          sessionId: sessionId.current,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      sessionId.current = data.sessionId;
      setTurns((prev) => [
        ...prev,
        { role: "ai", text: data.reply, rewritten: data.moderation?.rewritten },
      ]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "うまく おへんじ できなかったよ。もういちど ためしてね。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-sky-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {turns.map((t, i) => (
          <div
            key={i}
            className={t.role === "child" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                t.role === "child"
                  ? "max-w-[80%] rounded-2xl rounded-br-sm bg-sky-500 px-4 py-2 text-white"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm bg-sky-100 px-4 py-2 text-slate-800"
              }
            >
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{t.text}</p>
              {t.rewritten && (
                <p className="mt-1 text-[11px] text-sky-600">
                  ↑ 出力モデレーションが「直答」を検知し、問い返しに変換しました
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-sky-100 px-4 py-2 text-slate-500">
              かんがえちゅう…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="px-4 pb-1 text-xs text-red-600">エラー：{error}</p>
      )}

      <div className="flex gap-2 border-t border-sky-100 p-3">
        <input
          className="flex-1 rounded-full border border-sky-200 px-4 py-2 text-[15px] outline-none focus:border-sky-400"
          placeholder={apiKeyConfigured ? "おもったことを かいてね" : "（練習モード）かいてみてね"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
          }}
          disabled={loading}
        />
        <button
          className="rounded-full bg-sky-500 px-5 py-2 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
          onClick={send}
          disabled={loading || !input.trim()}
        >
          おくる
        </button>
      </div>
    </section>
  );
}
