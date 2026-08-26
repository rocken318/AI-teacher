"use client";

import { useEffect, useRef, useState } from "react";
import type { Topic } from "@/lib/topics";
import type { GradeBand } from "@/lib/grade/gradeProfiles";
import {
  isTtsSupported,
  speak,
  stopSpeaking,
  isSttSupported,
  listenOnce,
} from "@/lib/speech";

interface Turn {
  role: "child" | "ai";
  text: string;
  rewritten?: boolean;
}

/** テーマ・学年に応じたAIの挨拶を作る */
function buildGreeting(topic: Topic): Turn {
  return {
    role: "ai",
    text: `こんにちは！きょうは「${topic.title}」を いっしょに かんがえよう。${topic.seedQuestion}`,
  };
}

export function Chat({
  apiKeyConfigured,
  topics,
  gradeBands,
}: {
  apiKeyConfigured: boolean;
  topics: Topic[];
  gradeBands: GradeBand[];
}) {
  const [gradeBand, setGradeBand] = useState<GradeBand>(gradeBands[0]);

  // 選択中の学年帯で出せるテーマだけを候補にする
  const availableTopics = topics.filter((t) => t.gradeBands.includes(gradeBand));
  const [topicId, setTopicId] = useState<string>(
    (availableTopics[0] ?? topics[0]).id,
  );

  const currentTopic =
    topics.find((t) => t.id === topicId) ?? availableTopics[0] ?? topics[0];

  const [turns, setTurns] = useState<Turn[]>([buildGreeting(currentTopic)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useRef<string | undefined>(undefined);

  // 低学年(小1-3)かどうか。文字拡大・自動読み上げ既定に使う。
  const isLowerGrade = gradeBand === "小1-3";

  // 音声機能のフィーチャーディテクション（SSRでは false、マウント後に確定）
  const [ttsSupported, setTtsSupported] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  useEffect(() => {
    setTtsSupported(isTtsSupported());
    setSttSupported(isSttSupported());
  }, []);

  // 自動読み上げ ON/OFF（既定は小1-3のみON）
  const [autoRead, setAutoRead] = useState(false);
  useEffect(() => {
    setAutoRead(gradeBand === "小1-3");
  }, [gradeBand]);

  // 録音中の状態と、録音停止関数
  const [listening, setListening] = useState(false);
  const stopListenRef = useRef<null | (() => void)>(null);

  // 直近で自動読み上げした返答インデックスを覚え、二重読み上げを防ぐ。
  // 初期値 0 = 先頭の「挨拶」は自動読み上げの対象外（テーマ/学年の連打で
  // cancel()→speak() が高速に競合し無音化するのを避けるため）。挨拶は🔊で再生可。
  const lastSpokenRef = useRef<number>(0);

  // 新しいAIの返答（＝送信への応答）だけを自動で読み上げる（autoRead ON かつ TTS対応時）
  useEffect(() => {
    if (!autoRead || !ttsSupported) return;
    const lastIndex = turns.length - 1;
    const last = turns[lastIndex];
    if (!last || last.role !== "ai") return;
    if (lastSpokenRef.current >= lastIndex) return; // 挨拶(0)や既読は読まない
    lastSpokenRef.current = lastIndex;
    speak(last.text, { rate: 0.9 });
    // turns/autoRead/ttsSupported の変化時のみ評価する
  }, [turns, autoRead, ttsSupported]);

  // アンマウント時に読み上げ・録音を止める
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListenRef.current?.();
    };
  }, []);

  /** バブルの🔊ボタン：そのテキストを読み上げる */
  function handleSpeak(text: string) {
    speak(text, { rate: 0.9 });
  }

  /** 🎤ボタン：音声入力を開始/停止する */
  function handleMic() {
    if (listening) {
      stopListenRef.current?.();
      return;
    }
    setListening(true);
    stopListenRef.current = listenOnce({
      onResult: (text) => {
        // 送信はせず、入力欄に入れて子どもに確認させる
        setInput((prev) => (prev ? `${prev} ${text}` : text));
      },
      onError: () => {
        setListening(false);
        stopListenRef.current = null;
      },
      onEnd: () => {
        setListening(false);
        stopListenRef.current = null;
      },
    });
  }

  /** テーマ/学年を変えたら会話をリセットして新しい挨拶から始める */
  function resetConversation(topic: Topic) {
    sessionId.current = undefined;
    setError(null);
    setInput("");
    // 進行中の読み上げ・録音を止め、読み上げ済みマーカーもリセット
    stopSpeaking();
    stopListenRef.current?.();
    lastSpokenRef.current = 0; // 新しい挨拶(index 0)は自動読み上げしない
    setTurns([buildGreeting(topic)]);
  }

  function handleSelectTopic(id: string) {
    if (id === topicId || loading) return;
    const topic = topics.find((t) => t.id === id);
    if (!topic) return;
    setTopicId(id);
    resetConversation(topic);
  }

  function handleSelectGrade(band: GradeBand) {
    if (band === gradeBand || loading) return;
    setGradeBand(band);
    // 新しい学年帯で今のテーマが出せない場合は、出せる先頭テーマに切替
    const stillAvailable = currentTopic.gradeBands.includes(band);
    const nextTopic = stillAvailable
      ? currentTopic
      : topics.find((t) => t.gradeBands.includes(band)) ?? currentTopic;
    setTopicId(nextTopic.id);
    resetConversation(nextTopic);
  }

  async function send() {
    const message = input.trim();
    if (!message || loading) return;

    // 送信するなら音声入力は終える（録音が裏で続くのを防ぐ, S-1）
    stopListenRef.current?.();

    setError(null);
    setInput("");
    const greeting = turns[0];
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
            .filter((t, i) => !(i === 0 && t === greeting))
            .map((t) => ({ role: t.role, text: t.text })),
          sessionId: sessionId.current,
          topicId,
          gradeBand,
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
        e instanceof Error
          ? e.message
          : "うまく おへんじ できなかったよ。もういちど ためしてね。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-3">
      {/* 学年帯セレクタ */}
      <div className="rounded-2xl border border-sky-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-500">がくねん</p>
          {ttsSupported && (
            <button
              type="button"
              onClick={() => {
                const next = !autoRead;
                setAutoRead(next);
                if (!next) stopSpeaking();
              }}
              aria-label="じどうよみあげの ON/OFF"
              aria-pressed={autoRead}
              className={
                autoRead
                  ? "rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold text-white transition"
                  : "rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700 transition hover:bg-sky-100"
              }
            >
              🔊 じどうよみあげ {autoRead ? "ON" : "OFF"}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {gradeBands.map((band) => (
            <button
              key={band}
              onClick={() => handleSelectGrade(band)}
              disabled={loading}
              className={
                band === gradeBand
                  ? "rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white transition disabled:opacity-50"
                  : "rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
              }
            >
              {band}
            </button>
          ))}
        </div>

        {/* テーマセレクタ（学年帯で出し分け） */}
        <p className="mb-2 mt-3 text-xs font-semibold text-slate-500">テーマ</p>
        <div className="flex flex-wrap gap-2">
          {availableTopics.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTopic(t.id)}
              disabled={loading}
              className={
                t.id === topicId
                  ? "rounded-full bg-sky-500 px-4 py-1.5 text-sm font-semibold text-white transition disabled:opacity-50"
                  : "rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
              }
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* チャット本体 */}
      <div className="flex flex-1 flex-col rounded-2xl border border-sky-200 bg-white shadow-sm">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {turns.map((t, i) => (
            <div
              key={i}
              className={
                t.role === "child" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  t.role === "child"
                    ? "max-w-[80%] rounded-2xl rounded-br-sm bg-sky-500 px-4 py-2 text-white"
                    : "max-w-[80%] rounded-2xl rounded-bl-sm bg-sky-100 px-4 py-2 text-slate-800"
                }
              >
                <div className="flex items-start gap-2">
                  <p
                    className={
                      isLowerGrade
                        ? "whitespace-pre-wrap text-lg leading-relaxed"
                        : "whitespace-pre-wrap text-[15px] leading-relaxed"
                    }
                  >
                    {t.text}
                  </p>
                  {t.role === "ai" && ttsSupported && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(t.text)}
                      aria-label="このぶんを よみあげる"
                      className="mt-0.5 shrink-0 rounded-full px-1 text-sky-600 transition hover:bg-sky-200"
                    >
                      🔊
                    </button>
                  )}
                </div>
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

        {error && <p className="px-4 pb-1 text-xs text-red-600">エラー：{error}</p>}

        <div className="flex gap-2 border-t border-sky-100 p-3">
          {sttSupported && (
            <button
              type="button"
              onClick={handleMic}
              aria-label={listening ? "ろくおんを とめる" : "こえで こたえる"}
              aria-pressed={listening}
              disabled={loading}
              className={
                listening
                  ? "shrink-0 animate-pulse rounded-full bg-red-500 px-4 py-2 text-white transition disabled:opacity-50"
                  : "shrink-0 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sky-700 transition hover:bg-sky-100 disabled:opacity-50"
              }
            >
              🎤
            </button>
          )}
          <input
            className={
              isLowerGrade
                ? "flex-1 rounded-full border border-sky-200 px-4 py-2 text-lg outline-none focus:border-sky-400"
                : "flex-1 rounded-full border border-sky-200 px-4 py-2 text-[15px] outline-none focus:border-sky-400"
            }
            placeholder={
              apiKeyConfigured ? "おもったことを かいてね" : "（練習モード）かいてみてね"
            }
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
      </div>
    </section>
  );
}
