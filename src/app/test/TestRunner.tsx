"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { AnswerType } from "@/lib/math";
import { getChildId } from "@/lib/progress";

// ------------------------------------------------------------------
// 親（page.tsx）から渡されるメタ。答え / answerIndex は一切含まれない。
// ------------------------------------------------------------------
type UnitMeta = { id: string; title: string; answerType?: AnswerType };
type GradeGroup = { grade: string; units: UnitMeta[] };
export type SubjectMetaDTO = {
  subject: string;
  label: string;
  emoji: string;
  kind: "math" | "quiz";
  grades: GradeGroup[];
};

// ------------------------------------------------------------------
// start API のアイテム（kind で形が変わる）。
// ------------------------------------------------------------------
type MathItemDTO = {
  index: number;
  unitId: string;
  prompt: string;
  answerType: AnswerType;
  answerToken: string;
};
type QuizItemDTO = {
  index: number;
  unitId: string;
  itemId: string;
  question: string;
  choices: string[];
  token: string;
};
type ItemDTO = MathItemDTO | QuizItemDTO;

function isQuizItem(it: ItemDTO): it is QuizItemDTO {
  return "choices" in it;
}

// ------------------------------------------------------------------
// grade API の結果アイテム（kind で形が変わる）。
// ------------------------------------------------------------------
type MathResultItem = {
  unitId: string;
  prompt: string;
  userInput: string;
  correct: boolean;
  expected: string;
  diagnosis: string | null;
};
type QuizResultItem = {
  unitId: string;
  itemId: string;
  choiceIndex: number;
  correct: boolean;
  answerIndex: number;
  explanation: string;
};
type ResultItem = MathResultItem | QuizResultItem;

function isQuizResult(it: ResultItem): it is QuizResultItem {
  return "answerIndex" in it;
}

type GradeDTO = {
  score: number;
  total: number;
  testKey: string;
  kind: "math" | "quiz";
  items: ResultItem[];
  prevScore: number | null;
  prevTotal: number | null;
  bestScore: number | null;
  bestTotal: number | null;
  isBest: boolean;
};

type Phase = "setup" | "running" | "result";
const COUNTS = [5, 10, 20];

export function TestRunner({
  subjects,
  initialSubject,
}: {
  subjects: SubjectMetaDTO[];
  initialSubject: string;
}) {
  const [activeSubject, setActiveSubject] = useState<string>(
    subjects.some((s) => s.subject === initialSubject)
      ? initialSubject
      : (subjects[0]?.subject ?? "math"),
  );

  const subjectMeta = useMemo(
    () => subjects.find((s) => s.subject === activeSubject) ?? subjects[0],
    [subjects, activeSubject],
  );
  const kind = subjectMeta?.kind ?? "math";
  const grades = useMemo(
    () => subjectMeta?.grades.map((g) => g.grade) ?? [],
    [subjectMeta],
  );

  const [activeGrade, setActiveGrade] = useState<string>(grades[0] ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(10);

  const [phase, setPhase] = useState<Phase>("setup");
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [inputs, setInputs] = useState<string[]>([]); // math: テキスト / quiz: choiceIndex(文字列)
  const [unknowns, setUnknowns] = useState<boolean[]>([]); // わからない フラグ（項目単位）
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState<GradeDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // 採点リクエスト時に使う「送信済みの選択」を保持（random かどうか / grade も）。
  const [sentSelection, setSentSelection] = useState<{
    random: boolean;
    grade: string;
    unitIds: string[];
  }>({ random: false, grade: "", unitIds: [] });

  const gradeUnits = useMemo(
    () => subjectMeta?.grades.find((g) => g.grade === activeGrade)?.units ?? [],
    [subjectMeta, activeGrade],
  );

  // 進行中の state を全リセット（教科・学年切替時など）。
  const resetRun = useCallback(() => {
    setPhase("setup");
    setItems([]);
    setInputs([]);
    setUnknowns([]);
    setCursor(0);
    setResult(null);
    setError("");
  }, []);

  const switchSubject = useCallback(
    (key: string) => {
      if (key === activeSubject) return;
      const meta = subjects.find((s) => s.subject === key);
      setActiveSubject(key);
      setActiveGrade(meta?.grades[0]?.grade ?? "");
      setSelected(new Set());
      resetRun();
    },
    [activeSubject, subjects, resetRun],
  );

  const switchGrade = useCallback(
    (g: string) => {
      setActiveGrade(g);
      setSelected(new Set());
      resetRun();
    },
    [resetRun],
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllGrade = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = gradeUnits.map((u) => u.id);
      const allOn = ids.length > 0 && ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, [gradeUnits]);

  // 共通の start 処理。random=true なら単元選択を無視し grade で全単元ランダム。
  const startTest = useCallback(
    async (opts: { random: boolean; unitIds: string[]; grade: string }) => {
      setBusy(true);
      setError("");
      try {
        const body = opts.random
          ? { subject: activeSubject, grade: opts.grade, random: true, count }
          : { subject: activeSubject, unitIds: opts.unitIds, count };
        const res = await fetch("/api/test/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`start ${res.status}`);
        const data = (await res.json()) as { items: ItemDTO[] };
        setItems(data.items);
        setInputs(new Array(data.items.length).fill(""));
        setUnknowns(new Array(data.items.length).fill(false));
        setCursor(0);
        setSentSelection({
          random: opts.random,
          grade: opts.grade,
          unitIds: opts.unitIds,
        });
        setPhase("running");
      } catch {
        setError("テストの開始にしっぱいしました。もう一度ためしてね。");
      } finally {
        setBusy(false);
      }
    },
    [activeSubject, count],
  );

  const startSelected = useCallback(() => {
    const unitIds = Array.from(selected);
    if (unitIds.length === 0) {
      setError("単元を1つ以上えらんでね。");
      return;
    }
    void startTest({ random: false, unitIds, grade: activeGrade });
  }, [selected, activeGrade, startTest]);

  const startRandom = useCallback(() => {
    if (!activeGrade) {
      setError("学年をえらんでね。");
      return;
    }
    void startTest({ random: true, unitIds: [], grade: activeGrade });
  }, [activeGrade, startTest]);

  const setInputAt = useCallback((i: number, v: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  /** わからない を現在の問題にセットし、入力をクリア＋次へ進む（または採点へ）。 */
  const markUnknownAt = useCallback((i: number) => {
    setUnknowns((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
    // 入力もクリアする（quiz: 選択解除、math: 空）。
    setInputs((prev) => {
      const next = [...prev];
      next[i] = "";
      return next;
    });
  }, []);

  const finish = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const answers = items.map((it, i) => {
        const isUnknown = unknowns[i] === true;
        if (isQuizItem(it)) {
          const raw = inputs[i];
          const choiceIndex = raw === "" || raw == null ? -1 : Number(raw);
          return {
            unitId: it.unitId,
            itemId: it.itemId,
            token: it.token,
            choiceIndex,
            ...(isUnknown ? { unknown: true } : {}),
          };
        }
        return {
          unitId: it.unitId,
          answerToken: it.answerToken,
          userInput: inputs[i] ?? "",
          prompt: it.prompt,
          ...(isUnknown ? { unknown: true } : {}),
        };
      });
      const selectionBody = sentSelection.random
        ? { random: true as const, grade: sentSelection.grade }
        : { unitIds: sentSelection.unitIds };
      const res = await fetch("/api/test/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: activeSubject,
          ...selectionBody,
          childId: getChildId(),
          answers,
        }),
      });
      if (!res.ok) throw new Error(`grade ${res.status}`);
      setResult((await res.json()) as GradeDTO);
      setPhase("result");
    } catch {
      setError("さいてんにしっぱいしました。もう一度ためしてね。");
    } finally {
      setBusy(false);
    }
  }, [items, inputs, unknowns, activeSubject, sentSelection]);

  const restart = useCallback(
    (onlyWrongUnits?: string[]) => {
      if (onlyWrongUnits && onlyWrongUnits.length > 0) {
        setSelected(new Set(onlyWrongUnits));
      }
      setPhase("setup");
      setItems([]);
      setInputs([]);
      setUnknowns([]);
      setCursor(0);
      setResult(null);
      setError("");
    },
    [],
  );

  // ============================== setup ==============================
  if (phase === "setup") {
    return (
      <div>
        {/* 教科セレクタ */}
        <div
          role="tablist"
          aria-label="教科"
          className="mb-4 flex flex-wrap gap-2"
        >
          {subjects.map((s) => {
            const active = s.subject === activeSubject;
            return (
              <button
                key={s.subject}
                role="tab"
                aria-selected={active}
                onClick={() => switchSubject(s.subject)}
                className={
                  "rounded-full border px-4 py-1.5 text-sm font-bold transition " +
                  (active
                    ? "border-terra bg-terra text-white shadow-soft"
                    : "border-line bg-paper text-ink-soft hover:text-ink")
                }
              >
                <span className="mr-1" aria-hidden="true">
                  {s.emoji}
                </span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* 学年タブ */}
        <div role="tablist" aria-label="学年" className="mb-4 flex flex-wrap gap-2">
          {grades.map((g) => {
            const active = g === activeGrade;
            return (
              <button
                key={g}
                role="tab"
                aria-selected={active}
                onClick={() => switchGrade(g)}
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

        {/* 全単元からランダム */}
        <div className="mb-4">
          <button
            onClick={startRandom}
            disabled={busy || !activeGrade}
            className="rounded-full border border-terra bg-terra/5 px-5 py-2 text-sm font-bold text-terra transition hover:bg-terra/10 disabled:opacity-50"
          >
            🎲 全単元からランダム（{count}問）
          </button>
          <p className="mt-1 text-[12px] text-faint">
            単元をえらばずに、この学年のぜんぶからランダムに出します。
          </p>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-bold text-ink-soft">
            単元をえらぶ（複数OK）
          </p>
          <button
            onClick={selectAllGrade}
            className="text-[12px] font-bold text-sky hover:underline"
          >
            この学年をぜんぶ
          </button>
        </div>

        {gradeUnits.length === 0 ? (
          <p className="text-sm text-faint">この学年の単元は じゅんび中です。</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {gradeUnits.map((u) => {
              const on = selected.has(u.id);
              return (
                <li key={u.id}>
                  <button
                    onClick={() => toggle(u.id)}
                    aria-pressed={on}
                    className={
                      "w-full rounded-xl border px-4 py-2.5 text-left text-sm font-bold transition " +
                      (on
                        ? "border-sky bg-sky-soft/60 text-ink"
                        : "border-line bg-white/70 text-ink-soft hover:text-ink")
                    }
                  >
                    <span className="mr-2">{on ? "☑" : "☐"}</span>
                    {u.title}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-bold text-ink-soft">問題数</span>
          {COUNTS.map((c) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              aria-pressed={count === c}
              className={
                "rounded-full border px-4 py-1.5 text-sm font-bold transition " +
                (count === c
                  ? "border-terra bg-terra text-white"
                  : "border-line bg-paper text-ink-soft hover:text-ink")
              }
            >
              {c}問
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-[13px] text-terra">{error}</p>}

        <div className="mt-6">
          <button
            onClick={startSelected}
            disabled={busy || selected.size === 0}
            className="rounded-full bg-sky px-6 py-2.5 text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "じゅんび中…" : `テストをはじめる（${selected.size}単元）`}
          </button>
        </div>
      </div>
    );
  }

  // ============================== running ==============================
  if (phase === "running") {
    const it = items[cursor];
    // 契約上 items は必ず 5/10/20 件だが、万一空でも白画面にせず setup へ戻す保険。
    if (!it) {
      return (
        <p className="py-8 text-center text-[13px] text-faint">
          もんだいの よみこみに しっぱいしました。
          <button
            onClick={() => restart()}
            className="ml-2 font-bold text-sky hover:underline"
          >
            もどる
          </button>
        </p>
      );
    }
    const isLast = cursor === items.length - 1;

    return (
      <div>
        <div className="mb-3 flex items-center justify-between text-[13px] font-bold text-ink-soft">
          <span>
            第 {cursor + 1} 問 / {items.length}
          </span>
          <span className="text-faint">とちゅうの答えあわせはありません</span>
        </div>
        <div className="h-2 w-full rounded-full bg-line/50">
          <div
            className="h-2 rounded-full bg-sky transition-all"
            style={{ width: `${((cursor + 1) / items.length) * 100}%` }}
          />
        </div>

        <div className="mt-5 rounded-2xl border border-line bg-white/80 p-5 shadow-soft">
          {isQuizItem(it) ? (
            <QuizChoiceInput
              item={it}
              value={inputs[cursor]}
              onPick={(idx) => setInputAt(cursor, String(idx))}
            />
          ) : (
            <MathAnswerInput
              item={it}
              value={inputs[cursor] ?? ""}
              onChange={(v) => setInputAt(cursor, v)}
              onEnter={() => {
                if (isLast) void finish();
                else setCursor((c) => c + 1);
              }}
            />
          )}

          {/* わからない ボタン（この問題に未フラグのときのみ） */}
          {!unknowns[cursor] && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  markUnknownAt(cursor);
                  if (!isLast) setCursor((c) => c + 1);
                }}
                disabled={busy}
                className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-terra/50 hover:text-terra disabled:opacity-50"
              >
                わからない
              </button>
            </div>
          )}
          {unknowns[cursor] && (
            <div className="mt-3 flex justify-end">
              <span className="rounded-lg border border-terra/40 bg-terra/5 px-3 py-1.5 text-sm text-terra">
                わからない 済
              </span>
            </div>
          )}

          <div className="mt-4 flex justify-between gap-2">
            <button
              onClick={() => setCursor((c) => Math.max(0, c - 1))}
              disabled={cursor === 0}
              className="rounded-full border border-line bg-paper px-4 py-2 text-sm font-bold text-ink-soft transition hover:text-ink disabled:opacity-40"
            >
              ← まえ
            </button>
            {isLast ? (
              <button
                onClick={finish}
                disabled={busy}
                className="rounded-full bg-terra px-6 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "さいてん中…" : "さいてんする"}
              </button>
            ) : (
              <button
                onClick={() => setCursor((c) => c + 1)}
                className="rounded-full bg-sky px-6 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
              >
                つぎ →
              </button>
            )}
          </div>
        </div>
        {error && <p className="mt-3 text-[13px] text-terra">{error}</p>}
      </div>
    );
  }

  // ============================== result ==============================
  // result フェーズだが result 未設定という不整合状態は描画しない（防御）。
  if (!result) return null;
  const r = result;
  const pct = Math.round((r.score / r.total) * 100);
  const wrong = r.items.filter((i) => !i.correct);
  const wrongUnits = Array.from(new Set(wrong.map((w) => w.unitId)));
  // start 時の quiz item を index / itemId で引けるようにする（正解肢テキスト表示用）。
  const quizItemByItemId = new Map<string, QuizItemDTO>();
  for (const it of items) {
    if (isQuizItem(it)) quizItemByItemId.set(it.itemId, it);
  }
  // 前回比。prevTotal>0 を確認し、レガシー 0 件行による NaN を防ぐ。
  const diff =
    r.prevScore != null && r.prevTotal != null && r.prevTotal > 0
      ? r.score - Math.round((r.prevScore / r.prevTotal) * r.total)
      : null;

  return (
    <div className="text-center">
      <p className="text-[13px] font-bold text-ink-soft">けっか</p>
      <p className="mt-1 font-serif text-5xl font-extrabold text-terra">
        {pct}点
      </p>
      <p className="mt-1 text-[13px] text-ink-soft">
        {r.score} / {r.total} もんせいかい
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {r.isBest && (
          <span className="anim-pop rounded-full bg-terra/10 px-3 py-1 text-[13px] font-bold text-terra">
            🎉 自己ベスト更新！
          </span>
        )}
        {diff != null && diff > 0 && (
          <span className="rounded-full bg-sky-soft/70 px-3 py-1 text-[13px] font-bold text-sky">
            前回より +{diff}問 ↑
          </span>
        )}
        {diff != null && diff < 0 && (
          <span className="rounded-full bg-paper px-3 py-1 text-[13px] font-bold text-faint">
            前回より {diff}問
          </span>
        )}
        {diff != null && diff === 0 && (
          <span className="rounded-full bg-paper px-3 py-1 text-[13px] font-bold text-faint">
            前回とおなじ
          </span>
        )}
      </div>

      {wrong.length > 0 && (
        <div className="mt-6 text-left">
          <p className="mb-2 text-[13px] font-bold text-ink-soft">
            まちがえた {wrong.length} 問を なおそう
          </p>
          <ul className="flex flex-col gap-2">
            {wrong.map((w, i) => {
              if (isQuizResult(w)) {
                const src = quizItemByItemId.get(w.itemId);
                const chosenText =
                  src && w.choiceIndex >= 0
                    ? src.choices[w.choiceIndex]
                    : undefined;
                const correctText =
                  src && w.answerIndex >= 0
                    ? src.choices[w.answerIndex]
                    : undefined;
                return (
                  <li
                    key={i}
                    className="rounded-xl border border-terra/40 bg-white/70 px-4 py-3"
                  >
                    <p className="font-serif text-[15px] font-bold text-ink">
                      {src?.question ?? ""}
                    </p>
                    <p className="mt-1 text-[13px] text-ink-soft">
                      きみの答え：
                      <b>{chosenText ?? "（未回答）"}</b> ／ せいかい：
                      <b className="text-ink">{correctText ?? "—"}</b>
                    </p>
                    {w.explanation && (
                      <p className="mt-1 text-[13px] font-bold text-terra">
                        {w.explanation}
                      </p>
                    )}
                  </li>
                );
              }
              return (
                <li
                  key={i}
                  className="rounded-xl border border-terra/40 bg-white/70 px-4 py-3"
                >
                  <p className="font-serif text-[15px] font-bold text-ink">
                    {w.prompt}
                  </p>
                  <p className="mt-1 text-[13px] text-ink-soft">
                    きみの答え：<b>{w.userInput || "（未回答）"}</b> ／ せいかい：
                    <b className="text-ink">{w.expected}</b>
                  </p>
                  {w.diagnosis && (
                    <p className="mt-1 text-[13px] font-bold text-terra">
                      {w.diagnosis}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {wrongUnits.length > 0 && !sentSelection.random && (
          <button
            onClick={() => restart(wrongUnits)}
            className="rounded-full border border-terra bg-paper px-5 py-2 text-sm font-bold text-terra transition hover:bg-terra/5"
          >
            ↺ まちがえた単元でもう一回
          </button>
        )}
        <button
          onClick={() => restart()}
          className="rounded-full bg-sky px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
        >
          単元をえらびなおす
        </button>
        <Link
          href="/"
          className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink"
        >
          ホームへ
        </Link>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 算数：テキスト入力
// ------------------------------------------------------------------
function MathAnswerInput({
  item,
  value,
  onChange,
  onEnter,
}: {
  item: MathItemDTO;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}) {
  return (
    <>
      <p className="font-serif text-2xl font-extrabold leading-snug text-ink">
        {item.prompt}
      </p>
      <input
        type="text"
        inputMode={item.answerType === "text" ? "text" : "decimal"}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onEnter();
        }}
        placeholder="こたえ"
        className="mt-4 w-full rounded-xl border border-line bg-paper px-4 py-2.5 font-serif text-lg text-ink outline-none focus:border-sky focus:ring-2 focus:ring-sky/30"
      />
    </>
  );
}

// ------------------------------------------------------------------
// クイズ：選択肢ボタン（1問1択・途中フィードバックなし）
// ------------------------------------------------------------------
function QuizChoiceInput({
  item,
  value,
  onPick,
}: {
  item: QuizItemDTO;
  value: string | undefined;
  onPick: (index: number) => void;
}) {
  const chosen = value === "" || value == null ? null : Number(value);
  return (
    <>
      <p className="text-[11px] font-bold uppercase tracking-wider text-terra">
        もんだい
      </p>
      <p className="mt-2 font-serif text-2xl font-extrabold leading-snug text-ink">
        {item.question}
      </p>
      <ul className="mt-5 grid gap-2.5">
        {item.choices.map((choice, i) => {
          const isChosen = chosen === i;
          const cls =
            "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-serif text-[15px] transition " +
            (isChosen
              ? "border-sky bg-sky-soft/70 text-ink"
              : "border-line bg-paper text-ink hover:border-sky/60 hover:bg-white");
          return (
            <li key={i}>
              <button
                onClick={() => onPick(i)}
                aria-pressed={isChosen}
                className={cls}
              >
                <span
                  className={
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-bold " +
                    (isChosen
                      ? "border-sky bg-sky text-white"
                      : "border-line bg-white text-ink-soft")
                  }
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{choice}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
