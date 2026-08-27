"use client";

import { useEffect, useState } from "react";
import {
  getProgress,
  getParentMessage,
  setParentMessage,
  type Progress,
} from "@/lib/progress";
import {
  type Stage,
  STAGES,
  getStage,
  setStage,
  getStageMeta,
} from "@/lib/stage";
import { Sensei, type SenseiMood } from "@/components/Sensei";

/** 教科メタ（@/lib/quiz の SUBJECTS の要素。別チーム提供）。 */
export type SubjectMeta = {
  key: string;
  label: string;
  emoji: string;
  /** アクセント色。Tailwind の色トークン名（例 "emerald"）。 */
  accent: string;
};

type Props = {
  subjects: SubjectMeta[];
};

/**
 * SUBJECTS の accent は Tailwind の色トークン名（"emerald" 等）で渡ってくる。
 * インライン style で使うため、実際の CSS カラー（各色の 500 相当）へ解決する。
 * 未知トークンは紙色に合う terra へフォールバック。
 */
const ACCENT_HEX: Record<string, string> = {
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#2f6fb0",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  terra: "#c9622f",
};

/** 色トークン or CSS カラー文字列を、実際の CSS カラーへ解決する。 */
function accentColor(accent: string): string {
  return ACCENT_HEX[accent] ?? accent ?? "#c9622f";
}

/** 数値の安全化。 */
function pct(correct: number, attempts: number): number {
  return attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
}

/** 挑戦数から、ゆるいレベルを決める（やる気の可視化用）。 */
function levelFor(totalAttempts: number): { level: number; label: string } {
  const level = Math.floor(totalAttempts / 10) + 1;
  const labels = ["はじめの一歩", "たんけん中", "ぐんぐん", "なかなかの探究者", "たんきゅうマスター"];
  const label = labels[Math.min(level - 1, labels.length - 1)];
  return { level, label };
}

/** 小さなプログレスバー。 */
function Bar({ ratio, color }: { ratio: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-paper2">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, ratio))}%`, background: color }}
      />
    </div>
  );
}

/** コースカード（教科／探究）。comingSoon=その学齢では準備中。 */
function CourseCard({
  href,
  emoji,
  label,
  accent,
  attempts,
  correct,
  tagline,
  comingSoon = false,
}: {
  href: string;
  emoji: string;
  label: string;
  accent: string;
  attempts: number;
  correct: number;
  tagline?: string;
  comingSoon?: boolean;
}) {
  const ratio = pct(correct, attempts);

  const inner = (
    <>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ background: `${accent}22` }}
        >
          {emoji}
        </span>
        <div className="min-w-0">
          <p className="font-serif text-lg font-extrabold text-ink group-hover:text-sky">
            {label}
          </p>
          {tagline && (
            <p className="truncate text-[12px] text-ink-soft">{tagline}</p>
          )}
        </div>
        {comingSoon && (
          <span className="ml-auto shrink-0 rounded-full border border-line bg-paper2 px-2 py-0.5 text-[10px] font-bold text-faint">
            準備中
          </span>
        )}
      </div>

      {comingSoon ? (
        <p className="mt-4 text-[12px] text-faint">
          この学年の もんだいは もうすぐ とうじょう します。
        </p>
      ) : (
        <>
          <div className="mt-4">
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="font-bold text-ink-soft">
                {attempts > 0 ? (
                  <>
                    <span className="font-serif text-ink">{correct}</span>
                    <span className="text-faint"> / {attempts}</span> せいかい
                  </>
                ) : (
                  <span className="text-faint">まだ ちょうせんしていないよ</span>
                )}
              </span>
              {attempts > 0 && (
                <span className="font-bold" style={{ color: accent }}>
                  {ratio}%
                </span>
              )}
            </div>
            <Bar ratio={ratio} color={accent} />
          </div>
          <span
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-terra"
            aria-hidden="true"
          >
            はじめる →
          </span>
        </>
      )}
    </>
  );

  const base =
    "group flex h-full flex-col rounded-2xl border border-line p-4 transition";
  const style = { borderTopColor: accent, borderTopWidth: 3 } as const;

  if (comingSoon) {
    return (
      <div className={`${base} bg-white/40 opacity-70`} style={style}>
        {inner}
      </div>
    );
  }
  return (
    <a
      href={href}
      className={`${base} bg-white/70 shadow-soft hover:-translate-y-0.5 hover:border-sky/50 hover:shadow-card`}
      style={style}
    >
      {inner}
    </a>
  );
}

/** 初回に学齢を選ぶゲート。 */
function StagePicker({ onPick }: { onPick: (s: Stage) => void }) {
  return (
    <div className="rounded-[1.5rem] border border-line bg-white/70 p-6 shadow-card sm:p-8">
      <h2 className="text-center font-serif text-xl font-extrabold text-ink sm:text-2xl">
        まなぶ人を えらんでね
      </h2>
      <p className="mt-2 text-center text-[13px] text-ink-soft">
        学年に あわせて、見た目と ないようが かわります（あとで かえられます）。
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => onPick(s.key)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper p-5 text-center transition hover:-translate-y-0.5 hover:border-sky hover:shadow-soft"
          >
            <span aria-hidden="true" className="text-4xl">
              {s.emoji}
            </span>
            <span className="font-serif text-lg font-extrabold text-ink">
              {s.label}
            </span>
            <span className="text-[12px] text-faint">{s.range}</span>
            <span className="mt-1 text-[12px] text-ink-soft">{s.tagline}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 学齢の切替トグル（小/中/高）。 */
function StageToggle({
  stage,
  onChange,
}: {
  stage: Stage;
  onChange: (s: Stage) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-faint">まなぶ人：</span>
      <div className="inline-flex rounded-full border border-line bg-white/60 p-0.5">
        {STAGES.map((s) => {
          const active = s.key === stage;
          return (
            <button
              key={s.key}
              onClick={() => onChange(s.key)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-sky px-3 py-1 text-[12px] font-bold text-white"
                  : "rounded-full px-3 py-1 text-[12px] font-bold text-ink-soft hover:text-ink"
              }
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** せんせいの ひとこと（ローテーション表示）。 */
const GREETINGS = [
  "こんにちは！きょうも いっしょに まなぼう。",
  "まちがえても だいじょうぶ。それが せいちょうだよ。",
  "「なんで？」を たいせつにね。",
  "すこしずつで いいよ。つづけるのが いちばん すごい。",
  "きみの ペースで だいじょうぶ。せんせいが みているよ。",
];

export default function HomeHub({ subjects }: Props) {
  // SSR 安全: マウント後に localStorage を読む
  const [mounted, setMounted] = useState(false);
  const [stage, setStageState] = useState<Stage | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [parentMsg, setParentMsg] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // せんせいの ひとこと＆きぶん（うごき）
  const [msgIdx, setMsgIdx] = useState(0);
  const [senseiMood, setSenseiMood] = useState<SenseiMood>("greet");

  useEffect(() => {
    setMounted(true);
    setStageState(getStage());
    setProgress(getProgress());
    setParentMsg(getParentMessage());
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % GREETINGS.length);
      setSenseiMood((m) => (m === "happy" ? "greet" : "happy"));
    }, 4200);
    return () => clearInterval(id);
  }, []);

  const pickStage = (s: Stage) => {
    setStage(s); // localStorage 保存＋テーマ即適用
    setStageState(s);
  };

  // ハイドレーション不一致を避けるため、マウント前は何も出さない
  if (!mounted) {
    return <div className="min-h-[40vh]" />;
  }

  // 初回（未選択）は学齢ピッカー
  if (stage === null) {
    return <StagePicker onPick={pickStage} />;
  }

  // 教科の中身は現状 小4〜6 のみ。中高では「準備中」表示（探究は全学齢で使える）。
  const subjectsComingSoon = stage !== "elementary";
  const stageMeta = getStageMeta(stage);

  const bySubject = progress?.bySubject ?? {};
  const totalAttempts = progress?.totalAttempts ?? 0;
  const totalCorrect = progress?.totalCorrect ?? 0;
  const totalPct = pct(totalCorrect, totalAttempts);
  const { level, label: levelLabel } = levelFor(totalAttempts);
  // 星（達成の可視化）: 正答率で 0〜5
  const stars = Math.max(0, Math.min(5, Math.round(totalPct / 20)));

  // 算数の進捗（別枠カード）
  const math = bySubject["math"] ?? { attempts: 0, correct: 0 };

  const startEdit = () => {
    setDraft(parentMsg);
    setEditing(true);
  };
  const saveEdit = () => {
    setParentMessage(draft);
    setParentMsg(getParentMessage());
    setEditing(false);
  };
  const cancelEdit = () => setEditing(false);

  return (
    <div className="space-y-8">
      {/* ===== 学齢の切替 ===== */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-soft">
          <span aria-hidden="true">{stageMeta.emoji}</span>{" "}
          <span className="font-bold text-ink">{stageMeta.label}</span>
          <span className="text-faint"> むけ</span>
        </p>
        <StageToggle stage={stage} onChange={pickStage} />
      </div>

      {/* ===== せんせい（あいさつ・うごき） ===== */}
      <div className="flex flex-col items-center py-2">
        <Sensei mood={senseiMood} size={104} message={GREETINGS[msgIdx]} />
      </div>

      {/* ===== 総合の進捗 ===== */}
      <section className="rounded-[1.5rem] border border-line bg-white/70 p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
              きみの がくしゅう
            </p>
            <p className="mt-1 font-serif text-2xl font-extrabold text-ink">
              レベル {level}
              <span className="ml-2 text-[13px] font-bold text-sky">
                {levelLabel}
              </span>
            </p>
            <div className="mt-1 text-lg" aria-label={`星 ${stars} / 5`}>
              <span className="text-terra">{"★".repeat(stars)}</span>
              <span className="text-line">{"★".repeat(5 - stars)}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-paper px-5 py-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-faint">
              これまで
            </p>
            <p className="font-serif text-2xl font-extrabold text-ink">
              {totalCorrect}
              <span className="text-faint"> / {totalAttempts}</span>
            </p>
            <p className="text-[12px] text-faint">
              せいかい率 {totalPct}%
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Bar ratio={totalPct} color="var(--sky, #2f6fb0)" />
          <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
            {totalAttempts === 0
              ? "さあ、すきな コースを ひとつ えらんで はじめよう！"
              : `よく がんばっているね。あと ${Math.max(0, level * 10 - totalAttempts)} もん で つぎの レベルだよ。`}
          </p>
        </div>
      </section>

      {/* ===== コースカード ===== */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-extrabold text-ink">
          コースをえらぶ
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* 算数（別枠） */}
          <CourseCard
            href="/math"
            emoji="🔢"
            label="算数"
            accent="#2f6fb0"
            attempts={math.attempts}
            correct={math.correct}
            tagline="もんだいを といて レベルアップ"
            comingSoon={subjectsComingSoon}
          />

          {/* 理科・社会・国語・英語（SUBJECTS から） */}
          {subjects.map((s) => {
            const p = bySubject[s.key] ?? { attempts: 0, correct: 0 };
            return (
              <CourseCard
                key={s.key}
                href={`/learn/${s.key}`}
                emoji={s.emoji}
                label={s.label}
                accent={accentColor(s.accent)}
                attempts={p.attempts}
                correct={p.correct}
                tagline="クイズで まなぶ"
                comingSoon={subjectsComingSoon}
              />
            );
          })}

          {/* 探究（豆知識）: 全学齢で使える（学年は対話内でえらべる） */}
          <CourseCard
            href="/explore"
            emoji="🔭"
            label="探究（豆知識）"
            accent="#c9622f"
            attempts={0}
            correct={0}
            tagline="AIと いっしょに かんがえる"
          />
        </div>
      </section>

      {/* ===== 親からの一言 ===== */}
      <section className="rounded-[1.5rem] border border-terra/30 bg-white/70 p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
            おうちの人からの ひとこと
          </p>
          {!editing && (
            <button
              onClick={startEdit}
              className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-bold text-ink-soft transition hover:text-ink"
            >
              保護者の方へ ✎
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={140}
              autoFocus
              placeholder="お子さんへの あたたかい ひとことを どうぞ。"
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-[15px] leading-relaxed text-ink outline-none focus:border-terra focus:ring-2 focus:ring-terra/30"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={saveEdit}
                className="rounded-full bg-terra px-5 py-2 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
              >
                保存する
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink-soft transition hover:text-ink"
              >
                やめる
              </button>
              <span className="ml-auto text-[11px] text-faint">
                {draft.length} / 140
              </span>
            </div>
          </div>
        ) : (
          <blockquote className="mt-3">
            <p className="font-serif text-xl font-extrabold leading-relaxed text-ink sm:text-2xl">
              「{parentMsg}」
            </p>
            <p className="mt-3 text-[12px] text-faint">
              まいにち あなたを おうえんしています。
            </p>
          </blockquote>
        )}
      </section>
    </div>
  );
}
