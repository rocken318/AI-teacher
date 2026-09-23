"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Subject, QuizGrade, QuizUnit } from "@/lib/quiz";
import {
  recordAttempt,
  getChildId,
  getActiveChild,
  getUnitProgress,
} from "@/lib/progress";
import { pickUnitStat, bumpUnit, type UnitStat } from "@/lib/unit-mastery";
import { UnitMastery } from "@/components/UnitMastery";

/** question API のレスポンス（answerIndex は含まない）。 */
type QuestionDTO = {
  itemId: string;
  question: string;
  choices: string[];
  token: string;
  /** 単元の全問を出し切った合図（seen をこの1問に戻す）。 */
  reset?: boolean;
};

/** grade API のレスポンス。 */
type GradeDTO = {
  correct: boolean;
  answerIndex: number;
  explanation: string;
  /** 選んだ誤答に刺さる一言（未設定・正解時は null）。 */
  hint?: string | null;
};

type Props = {
  subject: Subject;
  units: QuizUnit[];
  grades: QuizGrade[];
  /** トップで学年を選んでいるとき、その学年。指定時は学年タブを出さない。 */
  lockedGrade?: QuizGrade;
};

type Phase = "answering" | "graded";

export function QuizPractice({ subject, units, grades, lockedGrade }: Props) {
  const [activeGrade, setActiveGrade] = useState<QuizGrade>(
    lockedGrade ?? grades[0] ?? "小4",
  );
  const [selectedUnit, setSelectedUnit] = useState<QuizUnit | null>(null);

  // ランダムモード（全単元プールから毎問ランダムに単元を選ぶ）。
  const [randomMode, setRandomMode] = useState(false);
  // ランダムモードで実際に出題中の単元id（採点・記録に使う）。
  const [currentUnitId, setCurrentUnitId] = useState<string>("");
  // 既に出した問題id（同一単元で重複を避ける＝全問出し切るまで再登場させない）。
  const [seenItemIds, setSeenItemIds] = useState<string[]>([]);

  // 出題中の状態
  const [question, setQuestion] = useState<QuestionDTO | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [chosen, setChosen] = useState<number | null>(null);
  const [result, setResult] = useState<GradeDTO | null>(null);

  // スコア
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  // 通信状態
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string>("");

  // 「怪しい」= 正解でもまちがいノートに入れて復習に回す（問題ごとに1回）。
  const [flagged, setFlagged] = useState(false);

  // 単元別マスター度（端末ローカル＋ログイン時はサーバーで上書き）。
  const [mounted, setMounted] = useState(false);
  const [localUnits, setLocalUnits] = useState<Record<string, UnitStat>>({});
  const [serverUnits, setServerUnits] = useState<Record<string, UnitStat> | null>(
    null,
  );

  useEffect(() => {
    let alive = true;
    setMounted(true);
    setLocalUnits(getUnitProgress());
    // ログイン中（アクティブ子あり）はサーバーの単元別集計で上書き＝端末間で正確。
    const active = getActiveChild();
    if (active) {
      fetch(
        `/api/progress/subject?childId=${encodeURIComponent(active)}&subject=${encodeURIComponent(subject)}`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .then(
          (
            d: { units?: { unitId: string; attempts: number; correct: number }[] } | null,
          ) => {
            if (!alive || !d?.units) return;
            const m: Record<string, UnitStat> = {};
            for (const u of d.units) {
              m[u.unitId] = { attempts: u.attempts, correct: u.correct };
            }
            setServerUnits(m);
          },
        )
        .catch(() => {
          /* 未ログイン・非テスト教科などは静かにローカルのみ。 */
        });
    }
    return () => {
      alive = false;
    };
  }, [subject]);

  const activeUnits = useMemo(
    () => units.filter((u) => u.grade === activeGrade),
    [units, activeGrade],
  );

  /**
   * 新しい問題を取得する。
   * seen（既出 itemId）を送り、未出題から出題してもらう（重複回避）。
   * 全問出し切った合図（reset）が来たら seen をこの1問だけに戻して周回を続ける。
   */
  const fetchQuestion = useCallback(async (unitId: string, seen: string[]) => {
    setLoadingQuestion(true);
    setError("");
    setPhase("answering");
    setResult(null);
    setChosen(null);
    setFlagged(false);
    setCurrentUnitId(unitId);
    try {
      const res = await fetch("/api/quiz/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, seen }),
      });
      if (!res.ok) throw new Error(`question ${res.status}`);
      const data = (await res.json()) as QuestionDTO;
      setQuestion(data);
      setSeenItemIds(data.reset ? [data.itemId] : [...seen, data.itemId]);
    } catch {
      setError("もんだいの よみこみに しっぱいしました。もういちど ためしてね。");
      setQuestion(null);
    } finally {
      setLoadingQuestion(false);
    }
  }, []);

  /** 単元を選ぶ → スコアをリセットして1問目を出す。 */
  const chooseUnit = useCallback(
    (unit: QuizUnit) => {
      setRandomMode(false);
      setSelectedUnit(unit);
      setCorrectCount(0);
      setAttemptCount(0);
      setSeenItemIds([]);
      void fetchQuestion(unit.id, []);
    },
    [fetchQuestion],
  );

  /** 現在学年の全単元からランダムに1つ選んで unitId を返す（無ければ空文字）。 */
  const pickRandomUnitId = useCallback(() => {
    if (activeUnits.length === 0) return "";
    const u = activeUnits[Math.floor(Math.random() * activeUnits.length)];
    return u.id;
  }, [activeUnits]);

  /** ランダム（全単元）モードを開始する。 */
  const startRandom = useCallback(() => {
    const id = pickRandomUnitId();
    if (!id) return;
    setRandomMode(true);
    // 表示用のダミー単元（実際に出た単元は currentUnitId で追う）。
    setSelectedUnit({
      id: "__random__",
      subject,
      grade: activeGrade,
      title: "ランダム（全単元）",
      lesson: "この学年の いろいろな 単元から ランダムに 出題します。",
      items: [],
    });
    setCorrectCount(0);
    setAttemptCount(0);
    // ランダムモードは毎問ちがう単元なので、重複回避の seen は使わない。
    setSeenItemIds([]);
    void fetchQuestion(id, []);
  }, [pickRandomUnitId, activeGrade, fetchQuestion]);

  /** 選択肢を選ぶ → 採点する。 */
  const submit = useCallback(
    async (choiceIndex: number) => {
      if (!selectedUnit || !question || phase === "graded" || grading) return;
      setChosen(choiceIndex);
      setGrading(true);
      setError("");
      try {
        const res = await fetch("/api/quiz/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: question.token,
            choiceIndex,
            childId: getChildId(),
          }),
        });
        if (!res.ok) throw new Error(`grade ${res.status}`);
        const data = (await res.json()) as GradeDTO;
        setResult(data);
        setPhase("graded");
        setAttemptCount((n) => n + 1);
        if (data.correct) setCorrectCount((n) => n + 1);

        // 進捗記録（別チームの localStorage 実装／未実装でも落ちないように）。
        // 実際に出た単元id で記録する（ランダムモードでも診断が正しく効く）。
        const uid = currentUnitId || selectedUnit.id;
        try {
          recordAttempt(subject, uid, data.correct);
        } catch {
          // 進捗記録の失敗はサイレントに（採点は成立している）。
        }
        // 単元選択に戻ったときの表示を最新化（楽観更新）。
        // ログイン中は表示がサーバー優先なので、両方を更新する。
        if (uid && uid !== "__random__") {
          setLocalUnits((prev) => bumpUnit(prev, uid, data.correct));
          setServerUnits((prev) => (prev ? bumpUnit(prev, uid, data.correct) : prev));
        }
      } catch {
        setError("さいてんに しっぱいしました。もういちど ためしてね。");
        setChosen(null);
      } finally {
        setGrading(false);
      }
    },
    [selectedUnit, question, phase, grading, subject, currentUnitId],
  );

  /** わからない → choiceIndex=-1, unknown:true で採点し、不正解として表示する。 */
  const submitUnknown = useCallback(async () => {
    if (!selectedUnit || !question || phase === "graded" || grading) return;
    setChosen(null);
    setGrading(true);
    setError("");
    try {
      const res = await fetch("/api/quiz/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: question.token,
          choiceIndex: -1,
          unknown: true,
          childId: getChildId(),
        }),
      });
      if (!res.ok) throw new Error(`grade ${res.status}`);
      const data = (await res.json()) as GradeDTO;
      setResult(data);
      setPhase("graded");
      setAttemptCount((n) => n + 1);
      // わからない = 不正解扱い（正解数には加算しない）。
      const uid = currentUnitId || selectedUnit.id;
      try {
        recordAttempt(subject, uid, false);
      } catch {
        /* noop */
      }
      if (uid && uid !== "__random__") {
        setLocalUnits((prev) => bumpUnit(prev, uid, false));
        setServerUnits((prev) => (prev ? bumpUnit(prev, uid, false) : prev));
      }
    } catch {
      setError("さいてんに しっぱいしました。もういちど ためしてね。");
    } finally {
      setGrading(false);
    }
  }, [selectedUnit, question, phase, grading, subject, currentUnitId]);

  /** つぎのもんだい。ランダムモードでは また別のランダム単元を出す。 */
  const next = useCallback(() => {
    if (!selectedUnit) return;
    if (randomMode) {
      const id = pickRandomUnitId();
      // ランダムは毎問ちがう単元なので seen は空でよい。
      if (id) void fetchQuestion(id, []);
      return;
    }
    // 同一単元は既出を避けて出題（全問出し切るまで重複なし）。
    void fetchQuestion(selectedUnit.id, seenItemIds);
  }, [selectedUnit, randomMode, pickRandomUnitId, fetchQuestion, seenItemIds]);

  /**
   * もう一回（同じ問題を解き直す）。
   * token は維持し、選択と採点結果だけをクリアして再解答できるようにする。
   * 新しく通信はしない（AIも使わない）。
   */
  const retry = useCallback(() => {
    if (!question) return;
    setResult(null);
    setChosen(null);
    setPhase("answering");
    setError("");
  }, [question]);

  /**
   * 「怪しい」= 正解でも自信がないとき、この問題をまちがいノートに入れて復習に回す。
   * token をサーバーに送り、サーバーが item を特定してノートに追加（答えは触らない）。
   * 楽観的に flagged 表示にし、失敗したら戻す。重複はサーバー側で防ぐ。
   */
  const flagSuspicious = useCallback(async () => {
    if (!question || flagged) return;
    setFlagged(true);
    try {
      const res = await fetch("/api/review/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: question.token, childId: getChildId() }),
      });
      if (!res.ok) throw new Error(`flag ${res.status}`);
    } catch {
      setFlagged(false);
    }
  }, [question, flagged]);

  const backToUnits = useCallback(() => {
    setRandomMode(false);
    setCurrentUnitId("");
    setSeenItemIds([]);
    setSelectedUnit(null);
    setQuestion(null);
    setResult(null);
    setChosen(null);
    setPhase("answering");
  }, []);

  // ============ 単元選択ビュー ============
  if (!selectedUnit) {
    return (
      <div>
        {/* 学年タブ（トップで学年を選んでいるときは出さない） */}
        {!lockedGrade && (
          <div role="tablist" aria-label="学年" className="mb-5 flex flex-wrap gap-2">
            {grades.map((g) => {
              const active = g === activeGrade;
              return (
                <button
                  key={g}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveGrade(g)}
                  className={
                    "rounded-full border px-4 py-1.5 text-sm font-bold transition " +
                    (active
                      ? "border-sky bg-sky text-white shadow-soft"
                      : "border-line bg-paper text-ink-soft hover:text-ink")
                  }
                >
                  {g}
                </button>
              );
            })}
          </div>
        )}

        {/* ランダム（全単元）で始める */}
        {activeUnits.length > 0 && (
          <div className="mb-4">
            <button
              onClick={startRandom}
              className="w-full rounded-2xl border border-terra/40 bg-terra/5 px-4 py-3 text-left font-bold text-terra shadow-soft transition hover:border-terra/60 hover:bg-terra/10 sm:w-auto"
            >
              🎲 ランダム（全単元）
              <span className="ml-2 text-[12px] font-normal text-ink-soft">
                この学年の いろいろな 単元から 出します
              </span>
            </button>
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
                  <UnitMastery
                    stat={mounted ? pickUnitStat(u.id, localUnits, serverUnits) : null}
                  />
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
        {loadingQuestion || !question ? (
          <p className="py-6 text-center text-sm text-faint">
            もんだいを よみこみ中…
          </p>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider text-terra">
              もんだい
            </p>
            <p className="mt-2 font-serif text-2xl font-extrabold leading-snug text-ink">
              {question.question}
            </p>

            {/* 選択肢 */}
            <ul className="mt-5 grid gap-2.5">
              {question.choices.map((choice, i) => {
                const isChosen = chosen === i;
                const isAnswer =
                  phase === "graded" && result != null && result.answerIndex === i;
                const isWrongChosen =
                  phase === "graded" && isChosen && result != null && !result.correct;

                let cls =
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-serif text-[15px] transition ";
                if (isAnswer) {
                  cls += "border-sky bg-sky-soft/70 text-ink";
                } else if (isWrongChosen) {
                  cls += "border-terra/60 bg-white/70 text-ink";
                } else if (phase === "graded") {
                  cls += "border-line bg-paper text-ink-soft opacity-70";
                } else {
                  cls +=
                    "border-line bg-paper text-ink hover:border-sky/60 hover:bg-white";
                }

                return (
                  <li key={i}>
                    <button
                      onClick={() => submit(i)}
                      disabled={phase === "graded" || grading}
                      aria-pressed={isChosen}
                      className={cls + " disabled:cursor-default"}
                    >
                      <span
                        className={
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold " +
                          (isAnswer
                            ? "border-sky bg-sky text-white"
                            : "border-line bg-white text-ink-soft")
                        }
                        aria-hidden="true"
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{choice}</span>
                      {isAnswer && (
                        <span aria-hidden="true" className="text-lg">
                          ⭕
                        </span>
                      )}
                      {isWrongChosen && (
                        <span aria-hidden="true" className="text-lg">
                          ❌
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* わからない ボタン（answering フェーズのみ） */}
            {phase === "answering" && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={submitUnknown}
                  disabled={grading}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-terra/50 hover:text-terra disabled:opacity-50"
                >
                  わからない
                </button>
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
                  <span aria-hidden="true" className="anim-pop inline-block text-2xl">
                    {result.correct ? "⭕" : "❌"}
                  </span>
                  <span className="font-bold text-ink">
                    {result.correct ? "せいかい！" : "ざんねん…"}
                  </span>
                </div>

                {/* 誤答ヒント（不正解で hint があるときだけ）。まず勘違いを指摘する。 */}
                {!result.correct && result.hint && (
                  <div className="mt-3 rounded-xl border border-terra/50 bg-terra/5 px-4 py-3 text-[14px] font-bold leading-relaxed text-ink">
                    <span className="mr-1 text-terra">ヒント:</span>
                    {result.hint}
                  </div>
                )}

                {/* 正しい理解（かいせつ）。hint の有無にかかわらず出す。 */}
                <div className="mt-3 rounded-xl border border-line bg-paper px-4 py-3 text-[14px] leading-relaxed text-ink">
                  <span className="mr-1 font-bold text-terra">かいせつ:</span>
                  {result.explanation}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!result.correct && (
                    <button
                      onClick={retry}
                      className="rounded-full border border-terra bg-white px-5 py-2 text-sm font-bold text-terra shadow-soft transition hover:bg-terra/5"
                    >
                      ↻ もう一回
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
                  >
                    次の問題 →
                  </button>
                  {/* 怪しい: 正解でも自信がないときは復習に回す（正解時のみ表示）。 */}
                  {result.correct && (
                    <button
                      type="button"
                      onClick={flagSuspicious}
                      disabled={flagged}
                      title="正解したけど自信がないとき。まちがいノートに入れて あとで やり直せます。"
                      className={
                        flagged
                          ? "rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-faint"
                          : "rounded-full border border-terra/50 bg-white px-5 py-2 text-sm font-bold text-terra shadow-soft transition hover:bg-terra/5"
                      }
                    >
                      {flagged ? "✓ 怪しいに入れた" : "怪しい"}
                    </button>
                  )}
                  <a
                    href="/"
                    className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft shadow-soft transition hover:text-ink"
                  >
                    学習を止める
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
