"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { AnswerType, Grade } from "@/lib/math";
import { getChildId } from "@/lib/progress";

type UnitInfo = { id: string; grade: Grade; title: string; answerType: AnswerType };

type ItemDTO = {
  index: number;
  unitId: string;
  prompt: string;
  answerType: AnswerType;
  answerToken: string;
};

type GradedItem = {
  unitId: string;
  prompt: string;
  userInput: string;
  correct: boolean;
  expected: string;
  diagnosis: string | null;
};

type GradeDTO = {
  score: number;
  total: number;
  testKey: string;
  items: GradedItem[];
  prevScore: number | null;
  prevTotal: number | null;
  bestScore: number | null;
  bestTotal: number | null;
  isBest: boolean;
};

type Phase = "setup" | "running" | "result";
const COUNTS = [5, 10, 20];

export function TestRunner({ units }: { units: UnitInfo[] }) {
  const grades = useMemo(() => {
    const seen: Grade[] = [];
    for (const u of units) if (!seen.includes(u.grade)) seen.push(u.grade);
    return seen;
  }, [units]);

  const [activeGrade, setActiveGrade] = useState<Grade>(grades[0] ?? "小4");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(10);

  const [phase, setPhase] = useState<Phase>("setup");
  const [items, setItems] = useState<ItemDTO[]>([]);
  const [inputs, setInputs] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [result, setResult] = useState<GradeDTO | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const gradeUnits = units.filter((u) => u.grade === activeGrade);

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
      const allOn = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, [gradeUnits]);

  const start = useCallback(async () => {
    const unitIds = Array.from(selected);
    if (unitIds.length === 0) {
      setError("単元を1つ以上えらんでね。");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "math", unitIds, count }),
      });
      if (!res.ok) throw new Error(`start ${res.status}`);
      const data = (await res.json()) as { items: ItemDTO[] };
      setItems(data.items);
      setInputs(new Array(data.items.length).fill(""));
      setCursor(0);
      setPhase("running");
    } catch {
      setError("テストの開始にしっぱいしました。もう一度ためしてね。");
    } finally {
      setBusy(false);
    }
  }, [selected, count]);

  const setInputAt = useCallback((i: number, v: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  }, []);

  const finish = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/test/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "math",
          unitIds: Array.from(selected),
          childId: getChildId(),
          answers: items.map((it, i) => ({
            unitId: it.unitId,
            answerToken: it.answerToken,
            userInput: inputs[i] ?? "",
            prompt: it.prompt,
          })),
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
  }, [items, inputs, selected]);

  const restart = useCallback(
    (onlyWrongUnits?: string[]) => {
      if (onlyWrongUnits && onlyWrongUnits.length > 0) {
        setSelected(new Set(onlyWrongUnits));
      }
      setPhase("setup");
      setItems([]);
      setInputs([]);
      setCursor(0);
      setResult(null);
      setError("");
    },
    [],
  );

  if (phase === "setup") {
    return (
      <div>
        <div role="tablist" className="mb-4 flex flex-wrap gap-2">
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
            onClick={start}
            disabled={busy || selected.size === 0}
            className="rounded-full bg-sky px-6 py-2.5 text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "じゅんび中…" : `テストをはじめる（${selected.size}単元）`}
          </button>
        </div>
      </div>
    );
  }

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
    const allowNeg =
      typeof it?.unitId === "string" && false;
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
          <p className="font-serif text-2xl font-extrabold leading-snug text-ink">
            {it.prompt}
          </p>
          <input
            type="text"
            inputMode={it.answerType === "text" || allowNeg ? "text" : "decimal"}
            autoComplete="off"
            value={inputs[cursor] ?? ""}
            onChange={(e) => setInputAt(cursor, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (isLast) void finish();
                else setCursor((c) => c + 1);
              }
            }}
            placeholder="こたえ"
            className="mt-4 w-full rounded-xl border border-line bg-paper px-4 py-2.5 font-serif text-lg text-ink outline-none focus:border-sky focus:ring-2 focus:ring-sky/30"
          />
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

  // result フェーズだが result 未設定という不整合状態は描画しない（防御）。
  if (!result) return null;
  const r = result;
  const pct = Math.round((r.score / r.total) * 100);
  const wrong = r.items.filter((i) => !i.correct);
  const wrongUnits = Array.from(new Set(wrong.map((w) => w.unitId)));
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
            {wrong.map((w, i) => (
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
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {wrongUnits.length > 0 && (
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
