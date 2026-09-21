"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getChildId } from "@/lib/progress";

// ------------------------------------------------------------------
// 型定義
// ------------------------------------------------------------------

/** /api/review/list レスポンスの1件。 */
type MistakeItem = {
  id: string;
  subject: string;
  unitId: string;
  kind: "quiz" | "math";
  preview: string;
};

/** /api/review/next レスポンス（quiz）。 */
type NextQuiz = {
  mistakeId: string;
  kind: "quiz";
  subject: string;
  unitId: string;
  question: string;
  choices: string[];
  token: string;
};

/** /api/review/next レスポンス（math）。 */
type NextMath = {
  mistakeId: string;
  kind: "math";
  subject: string;
  unitId: string;
  prompt: string;
  answerToken: string;
};

type NextQuestion = NextQuiz | NextMath | { done: true };

/** クイズ採点レスポンス。 */
type QuizGradeResult = {
  correct: boolean;
  answerIndex: number;
  explanation: string;
  hint?: string | null;
};

/** 算数採点レスポンス。 */
type MathGradeResult = {
  correct: boolean;
  expected: string;
  diagnosis?: string | null;
};

type GradeResult = QuizGradeResult | MathGradeResult;

function isQuizGrade(r: GradeResult): r is QuizGradeResult {
  return "answerIndex" in r;
}

// ------------------------------------------------------------------
// 主要コンポーネント
// ------------------------------------------------------------------

export default function ReviewPage() {
  const [mounted, setMounted] = useState(false);

  // 一覧状態
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [count, setCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  // まとめてやり直し状態
  const [mode, setMode] = useState<"list" | "redo">("list");
  const [current, setCurrent] = useState<NextQuestion | null>(null);
  const [redoLoading, setRedoLoading] = useState(false);

  // 解答状態（redo モード）
  const [chosenIdx, setChosenIdx] = useState<number | null>(null);
  const [mathInput, setMathInput] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [answered, setAnswered] = useState(false); // 採点済みフラグ

  const [error, setError] = useState("");

  // マウント後のみ childId を読む（SSR 安全）
  useEffect(() => {
    setMounted(true);
  }, []);

  const childId = mounted ? getChildId() : "";

  // ------------------------------------------------------------------
  // 一覧取得
  // ------------------------------------------------------------------
  const fetchList = useCallback(async () => {
    if (!childId) return;
    setListLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/review/list?childId=${encodeURIComponent(childId)}`);
      if (!res.ok) throw new Error(`list ${res.status}`);
      const data = (await res.json()) as { count: number; mistakes: MistakeItem[] };
      setMistakes(data.mistakes);
      setCount(data.count);
    } catch {
      setError("まちがいリストの よみこみに しっぱいしました。");
    } finally {
      setListLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    if (mounted && childId) void fetchList();
  }, [mounted, childId, fetchList]);

  // ------------------------------------------------------------------
  // もう覚えた（一覧から削除）
  // ------------------------------------------------------------------
  const handleMemorized = useCallback(async (mistakeId: string) => {
    if (!childId) return;
    try {
      await fetch("/api/review/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, mistakeId }),
      });
      void fetchList();
    } catch {
      setError("削除に しっぱいしました。");
    }
  }, [childId, fetchList]);

  // ------------------------------------------------------------------
  // まとめてやり直し — 次の問題を取得
  // ------------------------------------------------------------------
  const fetchNext = useCallback(async () => {
    if (!childId) return;
    setRedoLoading(true);
    setGradeResult(null);
    setAnswered(false);
    setChosenIdx(null);
    setMathInput("");
    setError("");
    try {
      const res = await fetch(`/api/review/next?childId=${encodeURIComponent(childId)}`);
      if (!res.ok) throw new Error(`next ${res.status}`);
      const data = (await res.json()) as NextQuestion;
      setCurrent(data);
      if ("done" in data && data.done) {
        // 完了したら一覧も更新
        void fetchList();
      }
    } catch {
      setError("つぎの もんだいの よみこみに しっぱいしました。");
    } finally {
      setRedoLoading(false);
    }
  }, [childId, fetchList]);

  const startRedo = useCallback(() => {
    setMode("redo");
    void fetchNext();
  }, [fetchNext]);

  // ------------------------------------------------------------------
  // 採点共通ロジック
  // ------------------------------------------------------------------
  const gradeAndAdvance = useCallback(
    async (opts: { unknown?: boolean; choiceIndex?: number; userInput?: string }) => {
      if (!current || "done" in current || grading) return;
      setGrading(true);
      setError("");
      try {
        let result: GradeResult;
        const isUnknown = opts.unknown === true;

        if (current.kind === "quiz") {
          const res = await fetch("/api/quiz/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: current.token,
              choiceIndex: isUnknown ? -1 : (opts.choiceIndex ?? -1),
              childId,
              ...(isUnknown ? { unknown: true } : {}),
            }),
          });
          if (!res.ok) throw new Error(`quiz grade ${res.status}`);
          result = (await res.json()) as QuizGradeResult;
        } else {
          const res = await fetch("/api/math/grade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              unitId: current.unitId,
              answerToken: current.answerToken,
              userInput: isUnknown ? "" : (opts.userInput ?? ""),
              prompt: current.prompt,
              childId,
              ...(isUnknown ? { unknown: true } : {}),
            }),
          });
          if (!res.ok) throw new Error(`math grade ${res.status}`);
          result = (await res.json()) as MathGradeResult;
        }

        setGradeResult(result);
        setAnswered(true);

        // 自力正解（わからない ではない）なら まちがいノートから削除して次へ自動進行。
        if (result.correct && !isUnknown) {
          await fetch("/api/review/remove", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ childId, mistakeId: current.mistakeId }),
          });
          // 件数を1減らす（楽観的更新）。
          setCount((n) => Math.max(0, n - 1));
        }
      } catch {
        setError("さいてんに しっぱいしました。もういちど ためしてね。");
      } finally {
        setGrading(false);
      }
    },
    [current, grading, childId],
  );

  // クイズ選択肢クリック
  const handleChoiceClick = useCallback(
    (idx: number) => {
      if (answered || grading) return;
      setChosenIdx(idx);
      void gradeAndAdvance({ choiceIndex: idx });
    },
    [answered, grading, gradeAndAdvance],
  );

  // わからない
  const handleUnknown = useCallback(() => {
    void gradeAndAdvance({ unknown: true });
  }, [gradeAndAdvance]);

  // 算数こたえあわせ
  const handleMathSubmit = useCallback(() => {
    if (!mathInput.trim() || answered || grading) return;
    void gradeAndAdvance({ userInput: mathInput });
  }, [mathInput, answered, grading, gradeAndAdvance]);

  // 次へ（採点後）
  const handleNext = useCallback(() => {
    void fetchNext();
  }, [fetchNext]);

  // ------------------------------------------------------------------
  // SSR マウントガード
  // ------------------------------------------------------------------
  if (!mounted) return <div className="min-h-[40vh]" />;

  // ------------------------------------------------------------------
  // 教科ラベル
  // ------------------------------------------------------------------
  const subjectLabel = (s: string) => {
    const map: Record<string, string> = {
      math: "算数",
      science: "理科",
      social: "社会",
      japanese: "国語",
      english: "英語",
      history: "歴史",
      geography: "地理",
      eikaiwa: "英会話",
    };
    return map[s] ?? s;
  };

  // ------------------------------------------------------------------
  // redo モード描画
  // ------------------------------------------------------------------
  const renderRedo = () => {
    if (redoLoading || !current) {
      return (
        <p className="py-8 text-center text-sm text-faint">
          もんだいを よみこみ中…
        </p>
      );
    }

    if ("done" in current && current.done) {
      return (
        <div className="rounded-2xl border border-sky/30 bg-sky-soft/40 p-6 text-center">
          <p className="text-2xl">✅</p>
          <p className="mt-2 font-serif text-xl font-extrabold text-ink">
            おつかれさま！
          </p>
          <p className="mt-1 text-[14px] text-ink-soft">
            まちがいはありません。全問 クリアです。
          </p>
          <button
            onClick={() => { setMode("list"); void fetchList(); }}
            className="mt-4 rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink"
          >
            一覧に もどる
          </button>
        </div>
      );
    }

    const isQuiz = !("done" in current) && current.kind === "quiz";
    const isMath = !("done" in current) && current.kind === "math";

    return (
      <div className="space-y-4">
        {/* 残り件数バッジ */}
        <div className="flex items-center justify-between text-[13px] text-ink-soft">
          <button
            onClick={() => { setMode("list"); void fetchList(); }}
            className="font-bold text-sky hover:underline"
          >
            ← 一覧に もどる
          </button>
          <span className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-bold text-ink-soft">
            残り {count} 問
          </span>
        </div>

        <div className="rounded-2xl border border-line bg-white/80 p-5 shadow-soft">
          {/* 教科ラベル */}
          {!("done" in current) && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-terra">
              {subjectLabel(current.subject)} / {current.unitId}
            </p>
          )}

          {/* クイズ問題 */}
          {isQuiz && !("done" in current) && (
            <>
              <p className="font-serif text-2xl font-extrabold leading-snug text-ink">
                {(current as NextQuiz).question}
              </p>
              <ul className="mt-5 grid gap-2.5">
                {(current as NextQuiz).choices.map((choice, i) => {
                  const isChosen = chosenIdx === i;
                  const isAnswer =
                    answered &&
                    gradeResult != null &&
                    isQuizGrade(gradeResult) &&
                    gradeResult.answerIndex === i;
                  const isWrong = answered && isChosen && gradeResult != null && !gradeResult.correct;

                  let cls =
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-serif text-[15px] transition ";
                  if (isAnswer) {
                    cls += "border-sky bg-sky-soft/70 text-ink";
                  } else if (isWrong) {
                    cls += "border-terra/60 bg-white/70 text-ink";
                  } else if (answered) {
                    cls += "border-line bg-paper text-ink-soft opacity-70";
                  } else {
                    cls += "border-line bg-paper text-ink hover:border-sky/60 hover:bg-white";
                  }

                  return (
                    <li key={i}>
                      <button
                        onClick={() => handleChoiceClick(i)}
                        disabled={answered || grading}
                        aria-pressed={isChosen}
                        className={cls + " disabled:cursor-default"}
                      >
                        <span
                          className={
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold " +
                            (isAnswer ? "border-sky bg-sky text-white" : "border-line bg-white text-ink-soft")
                          }
                          aria-hidden="true"
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{choice}</span>
                        {isAnswer && <span aria-hidden="true" className="text-lg">⭕</span>}
                        {isWrong && <span aria-hidden="true" className="text-lg">❌</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* 算数問題 */}
          {isMath && !("done" in current) && (
            <>
              <p className="font-serif text-2xl font-extrabold leading-snug text-ink">
                {(current as NextMath).prompt}
              </p>
              <div className="mt-5">
                <label htmlFor="review-math-answer" className="mb-1 block text-[13px] font-bold text-ink-soft">
                  こたえ
                </label>
                <input
                  id="review-math-answer"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={mathInput}
                  disabled={answered || grading}
                  onChange={(e) => setMathInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleMathSubmit();
                  }}
                  placeholder="すう字を 入れてね"
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 font-serif text-lg text-ink outline-none focus:border-sky focus:ring-2 focus:ring-sky/30 disabled:opacity-60"
                />
              </div>
            </>
          )}

          {/* わからない ボタン（answering 中のみ） */}
          {!answered && (
            <div className="mt-3 flex items-center justify-between gap-2">
              {isMath && (
                <button
                  onClick={handleMathSubmit}
                  disabled={grading || !mathInput.trim()}
                  className="rounded-full bg-sky px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-50"
                >
                  {grading ? "さいてん中…" : "こたえあわせ"}
                </button>
              )}
              {isQuiz && <div />}
              <button
                type="button"
                onClick={handleUnknown}
                disabled={grading}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-terra/50 hover:text-terra disabled:opacity-50"
              >
                わからない
              </button>
            </div>
          )}

          {/* 採点結果 */}
          {answered && gradeResult && (
            <div className="mt-5">
              <div
                className={
                  "flex items-center gap-2 rounded-xl px-4 py-3 " +
                  (gradeResult.correct
                    ? "border border-sky/40 bg-sky-soft/60"
                    : "border border-terra/40 bg-white/70")
                }
              >
                <span aria-hidden="true" className="anim-pop inline-block text-2xl">
                  {gradeResult.correct ? "⭕" : "❌"}
                </span>
                <span className="font-bold text-ink">
                  {gradeResult.correct ? "せいかい！" : "ざんねん…"}
                </span>
                {!gradeResult.correct && !isQuizGrade(gradeResult) && (
                  <span className="ml-auto text-[13px] text-ink-soft">
                    せいかいは{" "}
                    <b className="font-serif text-ink">{gradeResult.expected}</b>
                  </span>
                )}
              </div>

              {/* クイズ: ヒント＋解説 */}
              {isQuizGrade(gradeResult) && !gradeResult.correct && gradeResult.hint && (
                <div className="mt-3 rounded-xl border border-terra/50 bg-terra/5 px-4 py-3 text-[14px] font-bold leading-relaxed text-ink">
                  <span className="mr-1 text-terra">ヒント:</span>
                  {gradeResult.hint}
                </div>
              )}
              {isQuizGrade(gradeResult) && (
                <div className="mt-3 rounded-xl border border-line bg-paper px-4 py-3 text-[14px] leading-relaxed text-ink">
                  <span className="mr-1 font-bold text-terra">かいせつ:</span>
                  {gradeResult.explanation}
                </div>
              )}

              {/* 算数: 診断 */}
              {!isQuizGrade(gradeResult) && !gradeResult.correct && gradeResult.diagnosis && (
                <div className="mt-3 rounded-xl border-2 border-terra/50 bg-terra/5 px-4 py-3 text-[14px] leading-relaxed text-ink">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-terra">
                    どう かんがえたかな？
                  </p>
                  <p className="font-bold">{gradeResult.diagnosis}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleNext}
                  className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
                >
                  つぎへ →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------------
  // メインレンダリング
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-paper">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="group flex items-baseline gap-1.5">
            <span className="font-serif text-xl font-extrabold tracking-wide text-ink">
              AI先生
            </span>
            <span className="text-lg font-extrabold text-terra">.</span>
          </Link>
          <span className="text-[13px] font-bold text-ink-soft">まちがいノート</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-12 pt-8">
        <h1 className="mb-6 font-serif text-2xl font-extrabold text-ink">
          📒 まちがいノート
        </h1>

        {error && (
          <div className="mb-4 rounded-xl border border-terra/40 bg-white/70 px-4 py-2 text-[13px] text-terra">
            {error}
          </div>
        )}

        {mode === "redo" ? (
          renderRedo()
        ) : (
          <>
            {/* 一覧ビュー */}
            {listLoading ? (
              <p className="py-8 text-center text-sm text-faint">よみこみ中…</p>
            ) : count === 0 ? (
              /* 0件：空のstate */
              <div className="rounded-2xl border border-line bg-white/70 p-8 text-center shadow-soft">
                <p className="text-3xl">🎉</p>
                <p className="mt-2 font-serif text-xl font-extrabold text-ink">
                  まちがいはありません！
                </p>
                <p className="mt-1 text-[14px] text-ink-soft">
                  まちがえた もんだいは ここに ためられます。
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-block rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink"
                >
                  ホームに もどる
                </Link>
              </div>
            ) : (
              <>
                {/* まとめてやり直すボタン */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-ink-soft">
                    {count} 問 ためています
                  </span>
                  <button
                    onClick={startRedo}
                    className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
                  >
                    まとめてやり直す →
                  </button>
                </div>

                {/* まちがい一覧 */}
                <ul className="flex flex-col gap-2">
                  {mistakes.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-4 py-3 shadow-soft"
                    >
                      <span className="shrink-0 rounded-full border border-line bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                        {subjectLabel(m.subject)}
                      </span>
                      <p className="flex-1 line-clamp-1 text-[14px] text-ink">
                        {m.preview || m.unitId}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleMemorized(m.id)}
                        className="shrink-0 rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-bold text-ink-soft transition hover:border-sky/50 hover:text-sky"
                      >
                        もう覚えた
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
