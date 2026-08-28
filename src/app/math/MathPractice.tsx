"use client";

import { useCallback, useState } from "react";
import type { AnswerType, Grade } from "@/lib/math";
import { recordAttempt, getChildId } from "@/lib/progress";

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

/** grade API のレスポンス。 */
type GradeDTO = {
  correct: boolean;
  expected: string;
  /** 不正解時のみ。ルール診断による原因（無いこともある）。 */
  diagnosis?: string | null;
};

type Props = {
  grades: GradeGroup[];
  /**
   * API キーの有無。まちがい時の AI解説を出せるかの表示に使う。
   */
  apiKeyConfigured?: boolean;
  /**
   * トップで選んだ学年に固定するとき、その学年。
   * 指定時は学年タブを出さず、この学年の単元だけを見せる。
   */
  lockedGrade?: Grade;
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

export function MathPractice({ grades, apiKeyConfigured, lockedGrade }: Props) {
  const [activeGrade, setActiveGrade] = useState<Grade>(
    lockedGrade ?? grades[0]?.grade ?? "小4",
  );
  const [selectedUnit, setSelectedUnit] = useState<UnitInfo | null>(null);

  // まちがい時の AI解説（生成AI）。答えは言わず、手順に よりそって みちびく。
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  // 出題中の状態
  const [problem, setProblem] = useState<ProblemDTO | null>(null);
  const [answerToken, setAnswerToken] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [result, setResult] = useState<GradeDTO | null>(null);

  // スコア
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // 静的ヒント（生成AI不使用。problem API が返す固定の一文）
  const [hint, setHint] = useState<string>("");
  const [showHint, setShowHint] = useState(false);

  // 通信状態
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [grading, setGrading] = useState(false);
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
    setShowHint(false);
    setAiFeedback("");
    setAiLoading(false);
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
        hint?: string;
      };
      setProblem(data.problem);
      setAnswerToken(data.answerToken);
      setHint(data.hint ?? "");
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

  /**
   * まちがえたときの AI解説を取りにいく（生成AI・失敗しても落とさない）。
   * 正解・問題文はトークンからサーバーが復元するので、ここでは token と誤答を渡す。
   */
  const fetchAiFeedback = useCallback(
    async (token: string, wrongInput: string, grade: Grade) => {
      setAiFeedback("");
      setAiLoading(true);
      try {
        const res = await fetch("/api/math/help", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "feedback",
            answerToken: token,
            userInput: wrongInput,
            grade,
          }),
        });
        if (!res.ok) throw new Error(`help ${res.status}`);
        const data = (await res.json()) as { text?: string };
        setAiFeedback(data.text ?? "");
      } catch {
        // 失敗時は AI枠を出さない（ルール診断・定型文が残る）。
        setAiFeedback("");
      } finally {
        setAiLoading(false);
      }
    },
    [],
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
          childId: getChildId(),
        }),
      });
      if (!res.ok) throw new Error(`grade ${res.status}`);
      const data = (await res.json()) as GradeDTO;
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
        // まちがえたら、AI先生に「その子なりの てほどき」を頼む。
        void fetchAiFeedback(answerToken, userInput, selectedUnit.grade);
      }
    } catch {
      setError("さいてんに しっぱいしました。もういちど ためしてね。");
    } finally {
      setGrading(false);
    }
  }, [selectedUnit, problem, answerToken, userInput, fetchAiFeedback]);

  /** ヒント表示（静的・生成AI不使用。problem API が返した固定文を出す）。 */
  const toggleHint = useCallback(() => {
    setShowHint((v) => !v);
  }, []);

  /** つぎのもんだい。 */
  const next = useCallback(() => {
    if (!selectedUnit) return;
    void fetchProblem(selectedUnit.id);
  }, [selectedUnit, fetchProblem]);

  /**
   * もう一回（解き直し）。
   * 同じ問題（answerToken）をそのまま保ち、入力と採点結果だけをクリアして
   * 「answering」に戻す。新しい問題は取りに行かない。
   */
  const retry = useCallback(() => {
    setResult(null);
    setPhase("answering");
    setUserInput("");
    setShowHint(false);
    setAiFeedback("");
    setAiLoading(false);
  }, []);

  const backToUnits = useCallback(() => {
    setSelectedUnit(null);
    setProblem(null);
    setAnswerToken("");
    setResult(null);
    setPhase("answering");
    setUserInput("");
    setHint("");
    setShowHint(false);
    setAiFeedback("");
    setAiLoading(false);
  }, []);

  // ============ 単元選択ビュー ============
  if (!selectedUnit) {
    return (
      <div>
        {/* 学年タブ（トップで学年を選んでいるときは出さない） */}
        {!lockedGrade && (
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
        )}

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

  // 中1以上（正負の数〜）は答えがマイナスになりうる。
  // このときは「−」を持つ通常キーボードを呼び出す（テンキーには − が無いため）。
  const allowNeg =
    selectedUnit.grade.startsWith("中") || selectedUnit.grade.startsWith("高");

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
                // マイナスが要る学年・比の入力は通常キーボード（− が出る）。
                // 小学の計算はテンキー（decimal）のまま出しやすさを優先。
                inputMode={
                  problem.answerType === "text" || allowNeg ? "text" : "decimal"
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
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <p className="text-[12px] text-faint">
                  {inputHint(problem.answerType)}
                </p>
                {/* マイナス入力ボタン（テンキーに − が無い端末むけ）。比(:)以外で出す。 */}
                {problem.answerType !== "text" && phase === "answering" && (
                  <button
                    type="button"
                    onClick={() =>
                      setUserInput((v) =>
                        v.startsWith("-") ? v.slice(1) : "-" + v,
                      )
                    }
                    disabled={grading}
                    aria-pressed={userInput.startsWith("-")}
                    title="こたえが マイナスの ときに おす"
                    className={
                      "shrink-0 rounded-full border px-3 py-1 text-sm font-bold transition disabled:opacity-50 " +
                      (userInput.startsWith("-")
                        ? "border-sky bg-sky text-white"
                        : "border-line bg-paper text-ink-soft hover:text-ink")
                    }
                  >
                    − マイナス
                  </button>
                )}
              </div>
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
                  onClick={toggleHint}
                  disabled={!hint}
                  className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink disabled:opacity-50"
                >
                  {showHint ? "ヒントを かくす" : "ヒント"}
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={retry}
                  className="rounded-full border border-sky bg-paper px-5 py-2 text-sm font-bold text-sky shadow-soft transition hover:bg-sky-soft/60"
                >
                  ↺ もう一回
                </button>
                <button
                  onClick={next}
                  className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
                >
                  同じジャンルで もう一問 →
                </button>
              </div>
            )}

            {/* ヒント表示（静的・生成AI不使用） */}
            {showHint && hint && phase === "answering" && (
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
                    className="anim-pop inline-block text-2xl"
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

                {/* ① まず、ルール診断で「どう考えたか」をすぐ返す（即時・具体的） */}
                {!result.correct && result.diagnosis && (
                  <div className="mt-3 rounded-xl border-2 border-terra/50 bg-terra/5 px-4 py-3 text-[14px] leading-relaxed text-ink">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-terra">
                      どう かんがえたかな？
                    </p>
                    <p className="font-bold">{result.diagnosis}</p>
                  </div>
                )}

                {/* ② AI先生が、その子に よりそって 手順を みちびく */}
                {!result.correct && aiLoading && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky/30 bg-sky-soft/50 px-4 py-3 text-[14px] text-ink-soft">
                    <span className="anim-pop">💭</span>
                    AI先生が いっしょに 考えています…
                  </div>
                )}
                {!result.correct && !aiLoading && aiFeedback && (
                  <div className="mt-3 rounded-xl border border-sky/40 bg-sky-soft/60 px-4 py-3 text-[14px] leading-relaxed text-ink">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-sky">
                      AI先生の てほどき
                    </p>
                    <p className="whitespace-pre-wrap">{aiFeedback}</p>
                  </div>
                )}

                {/* ③ どちらも無いときだけ、静的ヒントでフォロー */}
                {!result.correct &&
                  !result.diagnosis &&
                  !aiLoading &&
                  !aiFeedback &&
                  hint && (
                    <div className="mt-3 rounded-xl border border-line bg-paper px-4 py-3 text-[14px] leading-relaxed text-ink">
                      <span className="mr-1 font-bold text-terra">先生:</span>
                      {hint}
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-faint">
        採点は サーバーで 行います。まちがえた ときは、AI先生が 手順を いっしょに 考えます
        {apiKeyConfigured ? "" : "（いまは 練習モード：決まった 文で ふぉろーします）"}。
      </p>
    </div>
  );
}
