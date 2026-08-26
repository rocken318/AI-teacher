"use client";

import { useCallback, useState } from "react";
import type { AnswerType, Grade } from "@/lib/math";
import { recordAttempt } from "@/lib/progress";

/** クライアントに渡す単元情報（answer は含まない）。 */
type UnitInfo = {
  id: string;
  grade: Grade;
  title: string;
  lesson: string;
  answerType: AnswerType;
};

type GradeGroup = {
  grade: Grade;
  units: UnitInfo[];
};

/** problem API のレスポンス（answer は無い）。 */
type ProblemDTO = {
  unitId: string;
  prompt: string;
  answerType: AnswerType;
  choices?: string[];
};

type Props = {
  grades: GradeGroup[];
  apiKeyConfigured: boolean;
};

type Phase = "answering" | "graded";

/** answerType ごとの入力のヒント文。 */
function inputHint(t: AnswerType): string {
  switch (t) {
    case "fraction":
      return '分数は "3/4" の ように 入れてね。';
    case "decimal":
      return '小数は "3.5" の ように 入れてね。';
    case "text":
      return '比は "3:2" の ように 入れてね。';
    default:
      return "すう字を 入れてね。";
  }
}

export function MathPractice({ grades, apiKeyConfigured }: Props) {
  const [activeGrade, setActiveGrade] = useState<Grade>(
    grades[0]?.grade ?? "小4",
  );
  const [selectedUnit, setSelectedUnit] = useState<UnitInfo | null>(null);

  // 出題中の状態
  const [problem, setProblem] = useState<ProblemDTO | null>(null);
  const [answerToken, setAnswerToken] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [result, setResult] = useState<{ correct: boolean; expected: string } | null>(
    null,
  );

  // スコア
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // AIヒント/解説
  const [hint, setHint] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  // 通信状態
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [grading, setGrading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);
  const [error, setError] = useState<string>("");

  const activeUnits =
    grades.find((g) => g.grade === activeGrade)?.units ?? [];

  /** 新しい問題を取得する。 */
  const fetchProblem = useCallback(async (unitId: string) => {
    setLoadingProblem(true);
    setError("");
    setPhase("answering");
    setResult(null);
    setUserInput("");
    setHint("");
    setFeedback("");
    try {
      const res = await fetch("/api/math/problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId }),
      });
      if (!res.ok) throw new Error(`problem ${res.status}`);
      const data = (await res.json()) as {
        problem: ProblemDTO;
        answerToken: string;
      };
      setProblem(data.problem);
      setAnswerToken(data.answerToken);
    } catch {
      setError("もんだいの よみこみに しっぱいしました。もういちど ためしてね。");
      setProblem(null);
      setAnswerToken("");
    } finally {
      setLoadingProblem(false);
    }
  }, []);

  /** 単元を選ぶ → スコアをリセットして1問目を出す。 */
  const chooseUnit = useCallback(
    (unit: UnitInfo) => {
      setSelectedUnit(unit);
      setCorrectCount(0);
      setAttemptCount(0);
      void fetchProblem(unit.id);
    },
    [fetchProblem],
  );

  /** こたえあわせ。 */
  const submit = useCallback(async () => {
    if (!selectedUnit || !problem || !answerToken) return;
    if (!userInput.trim()) return;
    setGrading(true);
    setError("");
    try {
      const res = await fetch("/api/math/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: selectedUnit.id,
          answerToken,
          userInput,
          prompt: problem.prompt,
        }),
      });
      if (!res.ok) throw new Error(`grade ${res.status}`);
      const data = (await res.json()) as { correct: boolean; expected: string };
      setResult(data);
      setPhase("graded");
      setAttemptCount((n) => n + 1);
      // 進捗を記録（localStorage・失敗しても落とさない）
      try {
        recordAttempt("math", selectedUnit.id, data.correct);
      } catch {
        /* noop */
      }
      if (data.correct) {
        setCorrectCount((n) => n + 1);
      } else {
        // 不正解 → AIの やさしい解説を取りに行く
        void fetchFeedback(userInput);
      }
    } catch {
      setError("さいてんに しっぱいしました。もういちど ためしてね。");
    } finally {
      setGrading(false);
    }
    // fetchFeedback は answerToken にのみ依存し、その answerToken は下の依存に含む
    // （定義順の都合で参照は省略）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, problem, answerToken, userInput]);

  /** AIヒント（答えは言わない）。 */
  const fetchHint = useCallback(async () => {
    if (!problem || !answerToken) return;
    setLoadingHint(true);
    setError("");
    try {
      const res = await fetch("/api/math/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 正解・問題文はトークンからサーバーが復元する
        body: JSON.stringify({ answerToken, kind: "hint" }),
      });
      if (!res.ok) throw new Error(`help ${res.status}`);
      const data = (await res.json()) as { text: string };
      setHint(data.text);
    } catch {
      setError("ヒントの よみこみに しっぱいしました。");
    } finally {
      setLoadingHint(false);
    }
  }, [problem, answerToken]);

  /** AIのやさしい解説（不正解時）。正解・問題文はトークンからサーバーが復元。 */
  const fetchFeedback = useCallback(
    async (wrong: string) => {
      if (!answerToken) return;
      try {
        const res = await fetch("/api/math/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answerToken,
            kind: "feedback",
            userInput: wrong,
          }),
        });
        if (!res.ok) throw new Error(`help ${res.status}`);
        const data = (await res.json()) as { text: string };
        setFeedback(data.text);
      } catch {
        // 解説の失敗はサイレントに（採点結果は表示済み）
      }
    },
    [answerToken],
  );

  /** つぎのもんだい。 */
  const next = useCallback(() => {
    if (!selectedUnit) return;
    void fetchProblem(selectedUnit.id);
  }, [selectedUnit, fetchProblem]);

  const backToUnits = useCallback(() => {
    setSelectedUnit(null);
    setProblem(null);
    setAnswerToken("");
    setResult(null);
    setPhase("answering");
    setUserInput("");
    setHint("");
    setFeedback("");
  }, []);

  // ============ 単元選択ビュー ============
  if (!selectedUnit) {
    return (
      <div>
        {/* 学年タブ */}
        <div
          role="tablist"
          aria-label="学年"
          className="mb-5 flex flex-wrap gap-2"
        >
          {grades.map((g) => {
            const active = g.grade === activeGrade;
            return (
              <button
                key={g.grade}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveGrade(g.grade)}
                className={
                  "rounded-full border px-4 py-1.5 text-sm font-bold transition " +
                  (active
                    ? "border-sky bg-sky text-white shadow-soft"
                    : "border-line bg-paper text-ink-soft hover:text-ink")
                }
              >
                {g.grade}
              </button>
            );
          })}
        </div>

        {/* 単元カード */}
        {activeUnits.length === 0 ? (
          <p className="text-sm text-faint">この学年の単元は じゅんび中です。</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {activeUnits.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => chooseUnit(u)}
                  className="group flex h-full w-full flex-col rounded-2xl border border-line bg-white/70 p-4 text-left shadow-soft transition hover:border-sky/50 hover:shadow-card"
                >
                  <span className="font-serif text-lg font-extrabold text-ink group-hover:text-sky">
                    {u.title}
                  </span>
                  <span className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-ink-soft">
                    {u.lesson}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-terra">
                    はじめる →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // ============ 練習ビュー ============
  const scorePct =
    attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;

  return (
    <div>
      {/* 単元ヘッダ + スコア */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={backToUnits}
            className="mb-1 text-[12px] font-bold text-sky hover:underline"
          >
            ← 単元をえらびなおす
          </button>
          <h2 className="font-serif text-xl font-extrabold text-ink">
            {selectedUnit.title}
          </h2>
          <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-ink-soft">
            {selectedUnit.lesson}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-line bg-paper px-4 py-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
            スコア
          </p>
          <p className="font-serif text-lg font-extrabold text-ink">
            {correctCount}
            <span className="text-faint"> / {attemptCount}</span>
          </p>
          <p className="text-[11px] text-faint">{scorePct}%</p>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-4 rounded-xl border border-terra/40 bg-white/70 px-4 py-2 text-[13px] text-terra">
          {error}
        </div>
      )}

      {/* 問題本体 */}
      <div className="rounded-2xl border border-line bg-white/80 p-5 shadow-soft">
        {loadingProblem || !problem ? (
          <p className="py-6 text-center text-sm text-faint">
            もんだいを よみこみ中…
          </p>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider text-terra">
              もんだい
            </p>
            <p className="mt-2 font-serif text-2xl font-extrabold leading-snug text-ink">
              {problem.prompt}
            </p>

            {/* 答え入力 */}
            <div className="mt-5">
              <label
                htmlFor="math-answer"
                className="mb-1 block text-[13px] font-bold text-ink-soft"
              >
                こたえ
              </label>
              <input
                id="math-answer"
                type="text"
                inputMode={
                  problem.answerType === "text" ? "text" : "decimal"
                }
                autoComplete="off"
                value={userInput}
                disabled={phase === "graded" || grading}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && phase === "answering") submit();
                }}
                placeholder={inputHint(problem.answerType)}
                className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 font-serif text-lg text-ink outline-none focus:border-sky focus:ring-2 focus:ring-sky/30 disabled:opacity-60"
              />
              <p className="mt-1 text-[12px] text-faint">
                {inputHint(problem.answerType)}
              </p>
            </div>

            {/* アクション */}
            {phase === "answering" ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={submit}
                  disabled={grading || !userInput.trim()}
                  className="rounded-full bg-sky px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-50"
                >
                  {grading ? "さいてん中…" : "こたえあわせ"}
                </button>
                <button
                  onClick={fetchHint}
                  disabled={loadingHint}
                  className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink disabled:opacity-50"
                >
                  {loadingHint ? "ヒントを かんがえ中…" : "ヒント"}
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <button
                  onClick={next}
                  className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
                >
                  つぎのもんだい →
                </button>
              </div>
            )}

            {/* ヒント表示 */}
            {hint && phase === "answering" && (
              <div className="mt-4 rounded-xl border border-sky/30 bg-sky-soft/60 px-4 py-3 text-[14px] leading-relaxed text-ink">
                <span className="mr-1 font-bold text-sky">ヒント:</span>
                {hint}
              </div>
            )}

            {/* 採点結果 + 解説 */}
            {phase === "graded" && result && (
              <div className="mt-5">
                <div
                  className={
                    "flex items-center gap-2 rounded-xl px-4 py-3 " +
                    (result.correct
                      ? "border border-sky/40 bg-sky-soft/60"
                      : "border border-terra/40 bg-white/70")
                  }
                >
                  <span
                    aria-hidden="true"
                    className="text-2xl"
                  >
                    {result.correct ? "⭕" : "❌"}
                  </span>
                  <span className="font-bold text-ink">
                    {result.correct ? "せいかい！" : "ざんねん…"}
                  </span>
                  {!result.correct && (
                    <span className="ml-auto text-[13px] text-ink-soft">
                      せいかいは{" "}
                      <b className="font-serif text-ink">{result.expected}</b>
                    </span>
                  )}
                </div>

                {!result.correct && (
                  <div className="mt-3 rounded-xl border border-line bg-paper px-4 py-3 text-[14px] leading-relaxed text-ink">
                    <span className="mr-1 font-bold text-terra">先生:</span>
                    {feedback || "解説を かんがえ中…"}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!apiKeyConfigured && (
        <p className="mt-3 text-center text-[11px] text-faint">
          練習モード：ヒントと解説は 決まった 文が 出ます。
        </p>
      )}
    </div>
  );
}
