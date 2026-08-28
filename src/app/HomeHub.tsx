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
  STAGE_GRADES,
  getStage,
  setStage,
  getStageMeta,
  getGrade,
  setGrade as persistGrade,
  clearGrade,
} from "@/lib/stage";
// マスコット（Sensei）は一旦オフ。復活できるようコンポーネントは残置。
// import { Sensei } from "@/components/Sensei";

/** 教科メタ（@/lib/quiz の SUBJECTS ＋ その教科に実在する学年）。 */
export type SubjectMeta = {
  key: string;
  label: string;
  emoji: string;
  /** アクセント色。Tailwind の色トークン名（例 "emerald"）。 */
  accent: string;
  /** その教科に実在する学年（例 ["小4","中2"]）。中身の有無判定に使う。 */
  grades?: string[];
};

type Props = {
  subjects: SubjectMeta[];
  /** 算数（math）に実在する学年。 */
  mathGrades?: string[];
};

/** 学齢ごとに出す教科（クイズ系）。中学以降は社会を歴史・地理に分ける。 */
const STAGE_SUBJECTS: Record<Stage, string[]> = {
  elementary: ["science", "social", "japanese", "english"],
  junior: ["science", "history", "geography", "japanese", "english"],
  senior: ["science", "history", "geography", "japanese", "english"],
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

/** 挑戦数からレベル数を決める（やる気の可視化用）。 */
function levelNumber(totalAttempts: number): number {
  return Math.floor(totalAttempts / 10) + 1;
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
  copy,
}: {
  href: string;
  emoji: string;
  label: string;
  accent: string;
  attempts: number;
  correct: number;
  tagline?: string;
  comingSoon?: boolean;
  copy: Copy;
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
            {copy.comingSoonBadge}
          </span>
        )}
      </div>

      {comingSoon ? (
        <p className="mt-4 text-[12px] text-faint">{copy.comingSoonBody}</p>
      ) : (
        <>
          <div className="mt-4">
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span className="font-bold text-ink-soft">
                {attempts > 0 ? (
                  <>
                    <span className="font-serif text-ink">{correct}</span>
                    <span className="text-faint"> / {attempts}</span>{" "}
                    {copy.correctWord}
                  </>
                ) : (
                  <span className="text-faint">{copy.notTried}</span>
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
            {copy.startBtn}
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
        学年を選んでください
      </h2>
      <p className="mt-2 text-center text-[13px] text-ink-soft">
        学年に合わせて、見た目と内容が変わります（あとで変更できます）。
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

/** 学齢を選んだあと、具体的な学年を選ぶゲート。 */
function GradePicker({
  stage,
  onPick,
  onBack,
}: {
  stage: Stage;
  onPick: (g: string) => void;
  onBack: () => void;
}) {
  const meta = getStageMeta(stage);
  return (
    <div className="rounded-[1.5rem] border border-line bg-white/70 p-6 shadow-card sm:p-8">
      <button
        onClick={onBack}
        className="mb-3 text-[12px] font-bold text-sky hover:underline"
      >
        ← 学校をえらびなおす
      </button>
      <h2 className="text-center font-serif text-xl font-extrabold text-ink sm:text-2xl">
        {meta.emoji} {meta.label}の どの学年ですか？
      </h2>
      <p className="mt-2 text-center text-[13px] text-ink-soft">
        学年に合わせて、出てくる問題が変わります（あとで変更できます）。
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {STAGE_GRADES[stage].map((g) => (
          <button
            key={g}
            onClick={() => onPick(g)}
            className="flex flex-col items-center gap-1 rounded-2xl border border-line bg-paper p-5 text-center transition hover:-translate-y-0.5 hover:border-sky hover:shadow-soft"
          >
            <span className="font-serif text-2xl font-extrabold text-ink">
              {g}
            </span>
            <span className="text-[12px] text-faint">えらぶ →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 学年の切替トグル（同じ学齢の中で 小4/小5/小6 など）。 */
function GradeToggle({
  stage,
  grade,
  onChange,
  chooseLabel,
}: {
  stage: Stage;
  grade: string;
  onChange: (g: string) => void;
  chooseLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-faint">{chooseLabel}</span>
      <div className="inline-flex rounded-full border border-line bg-white/60 p-0.5">
        {STAGE_GRADES[stage].map((g) => {
          const active = g === grade;
          return (
            <button
              key={g}
              onClick={() => onChange(g)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-terra px-3 py-1 text-[12px] font-bold text-white"
                  : "rounded-full px-3 py-1 text-[12px] font-bold text-ink-soft hover:text-ink"
              }
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 学齢の切替トグル（小/中/高）。 */
function StageToggle({
  stage,
  onChange,
  chooseLabel,
}: {
  stage: Stage;
  onChange: (s: Stage) => void;
  chooseLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-faint">{chooseLabel}</span>
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

/** 学齢別の ひとこと（ローテーション表示）。 */
const GREETINGS: Record<Stage, string[]> = {
  elementary: [
    "こんにちは！きょうも いっしょに まなぼう。",
    "まちがえても だいじょうぶ。それが せいちょうだよ。",
    "「なんで？」を たいせつにね。",
    "すこしずつで いいよ。つづけるのが いちばん すごい。",
    "きみの ペースで だいじょうぶ。",
  ],
  junior: [
    "今日も少しずつ進もう。",
    "間違いは、理解を深めるチャンス。",
    "「なぜ？」を大切に。",
    "続けることが、いちばんの力になる。",
    "自分のペースで大丈夫。",
  ],
  senior: [
    "今日の学習を始めましょう。",
    "誤答は理解を深めるための材料です。",
    "根拠を意識して取り組みましょう。",
    "継続が最大の武器になります。",
    "自分のペースで、着実に。",
  ],
};

type Copy = {
  heroKicker: string;
  heroA: string;
  heroB: string;
  heroSub: string;
  muke: string;
  chooseWho: string;
  progKicker: string;
  levelWord: string;
  levelLabels: [string, string, string, string, string];
  soFar: string;
  accuracy: string;
  startMsg: string;
  nextMsg: (remain: number) => string;
  courseTitle: string;
  taglineMath: string;
  taglineQuiz: string;
  taglineExplore: string;
  exploreLabel: string;
  comingSoonBadge: string;
  comingSoonBody: string;
  notTried: string;
  correctWord: string;
  startBtn: string;
  parentKicker: string;
  parentFooter: string;
  parentEdit: string;
  parentPlaceholder: string;
};

const COPY: Record<Stage, Copy> = {
  elementary: {
    heroKicker: "しょうがくせい",
    heroA: "きょうは",
    heroB: "なにを まなぶ？",
    heroSub: "すきな コースを えらんで、じぶんの ペースで まなぼう。",
    muke: "むけ",
    chooseWho: "まなぶ人：",
    progKicker: "きみの がくしゅう",
    levelWord: "レベル",
    levelLabels: ["はじめの一歩", "たんけん中", "ぐんぐん", "たんきゅう名人", "マスター"],
    soFar: "これまで",
    accuracy: "せいかい率",
    startMsg: "さあ、すきな コースを ひとつ えらんで はじめよう！",
    nextMsg: (r) => `よく がんばっているね。あと ${r} もん で つぎの レベルだよ。`,
    courseTitle: "コースをえらぶ",
    taglineMath: "もんだいを といて レベルアップ",
    taglineQuiz: "クイズで まなぶ",
    taglineExplore: "AIと いっしょに かんがえる",
    exploreLabel: "探究（豆知識）",
    comingSoonBadge: "準備中",
    comingSoonBody: "この学年の もんだいは もうすぐ とうじょう します。",
    notTried: "まだ ちょうせんしていないよ",
    correctWord: "せいかい",
    startBtn: "はじめる →",
    parentKicker: "おうちの人からの ひとこと",
    parentFooter: "まいにち あなたを おうえんしています。",
    parentEdit: "保護者の方へ ✎",
    parentPlaceholder: "お子さんへの あたたかい ひとことを どうぞ。",
  },
  junior: {
    heroKicker: "中学生",
    heroA: "今日は、",
    heroB: "何を学ぶ？",
    heroSub: "コースを選んで、自分のペースで学習を進めよう。",
    muke: "向け",
    chooseWho: "対象：",
    progKicker: "あなたの学習",
    levelWord: "レベル",
    levelLabels: ["スタート", "基礎固め", "上達中", "実力者", "マスター"],
    soFar: "これまで",
    accuracy: "正答率",
    startMsg: "コースを選んで、学習を始めよう。",
    nextMsg: (r) => `いいペースです。あと ${r} 問で次のレベルへ。`,
    courseTitle: "コースを選ぶ",
    taglineMath: "問題を解いて実力アップ",
    taglineQuiz: "一問一答で確認",
    taglineExplore: "AIと考えを深める探究",
    exploreLabel: "探究",
    comingSoonBadge: "準備中",
    comingSoonBody: "この学年の問題は近日公開予定です。",
    notTried: "まだ挑戦していません",
    correctWord: "正解",
    startBtn: "始める →",
    parentKicker: "保護者からのメッセージ",
    parentFooter: "いつも応援しています。",
    parentEdit: "保護者の方へ ✎",
    parentPlaceholder: "お子さんへのメッセージをどうぞ。",
  },
  senior: {
    heroKicker: "高校生",
    heroA: "今日の",
    heroB: "学習を始める。",
    heroSub: "コースを選び、目標に向けて効率よく学習を進めましょう。",
    muke: "向け",
    chooseWho: "対象：",
    progKicker: "学習の記録",
    levelWord: "Lv.",
    levelLabels: ["Start", "Basic", "Steady", "Advanced", "Master"],
    soFar: "累計",
    accuracy: "正答率",
    startMsg: "コースを選択して学習を始めましょう。",
    nextMsg: (r) => `次のレベルまであと ${r} 問です。`,
    courseTitle: "コースを選択",
    taglineMath: "演習で解答力を高める",
    taglineQuiz: "一問一答で知識を確認",
    taglineExplore: "AIとの対話で思考を深める",
    exploreLabel: "探究",
    comingSoonBadge: "準備中",
    comingSoonBody: "この学年の問題は近日公開予定です。",
    notTried: "未挑戦",
    correctWord: "正解",
    startBtn: "始める →",
    parentKicker: "保護者からのメッセージ",
    parentFooter: "応援しています。",
    parentEdit: "保護者の方へ ✎",
    parentPlaceholder: "本人へのメッセージをどうぞ。",
  },
};

export default function HomeHub({ subjects, mathGrades = [] }: Props) {
  // SSR 安全: マウント後に localStorage を読む
  const [mounted, setMounted] = useState(false);
  const [stage, setStageState] = useState<Stage | null>(null);
  const [grade, setGradeState] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [parentMsg, setParentMsg] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // ひとこと（やさしく入れ替わる“動き”）
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    setMounted(true);
    const s = getStage();
    setStageState(s);
    // 学年は、記憶した学齢と一致するときだけ採用する。
    const g = getGrade();
    setGradeState(s && g && STAGE_GRADES[s].includes(g) ? g : null);
    setProgress(getProgress());
    setParentMsg(getParentMessage());
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIdx((i) => (i + 1) % 5);
    }, 4600);
    return () => clearInterval(id);
  }, []);

  const pickStage = (s: Stage) => {
    setStage(s); // localStorage 保存＋テーマ即適用
    setStageState(s);
    // 学齢を変えたら学年は選び直す。
    clearGrade();
    setGradeState(null);
  };

  const pickGrade = (g: string) => {
    persistGrade(g);
    setGradeState(g);
  };

  const backToStage = () => {
    clearGrade();
    setGradeState(null);
    setStageState(null);
  };

  // ハイドレーション不一致を避けるため、マウント前は何も出さない
  if (!mounted) {
    return <div className="min-h-[40vh]" />;
  }

  // 初回（未選択）は学齢ピッカー → つぎに学年ピッカー
  if (stage === null) {
    return <StagePicker onPick={pickStage} />;
  }
  if (grade === null) {
    return <GradePicker stage={stage} onPick={pickGrade} onBack={backToStage} />;
  }

  // 選んだ学年に中身があるかで、教科カードを解放する。
  const hasContent = (grades?: string[]) => (grades ?? []).includes(grade);
  const mathComingSoon = !hasContent(mathGrades);
  // 教科ページへは選んだ学年を引き継ぐ。
  const gq = `?grade=${encodeURIComponent(grade)}`;
  // この学齢で出す教科（順番も固定）。
  const stageSubjects = STAGE_SUBJECTS[stage]
    .map((key) => subjects.find((s) => s.key === key))
    .filter((s): s is SubjectMeta => Boolean(s));
  const stageMeta = getStageMeta(stage);
  const c = COPY[stage]; // 学齢別コピー
  const g = GREETINGS[stage];

  const bySubject = progress?.bySubject ?? {};
  const totalAttempts = progress?.totalAttempts ?? 0;
  const totalCorrect = progress?.totalCorrect ?? 0;
  const totalPct = pct(totalCorrect, totalAttempts);
  const level = levelNumber(totalAttempts);
  const levelLabel = c.levelLabels[Math.min(level - 1, 4)];
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
      {/* ===== ヒーロー（学齢別コピー） ===== */}
      <section className="anim-in text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-terra">
          {c.heroKicker}
        </span>
        <h1 className="mt-3 font-serif text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          {c.heroA}
          <span className="relative inline-block text-sky">
            {c.heroB}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-1 -z-10 h-[6px] rounded bg-terra/80"
            />
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-ink-soft">
          {c.heroSub}
        </p>
      </section>

      {/* ===== 学齢・学年の切替 ===== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-ink-soft">
          <span aria-hidden="true">{stageMeta.emoji}</span>{" "}
          <span className="font-bold text-ink">{stageMeta.label}</span>
          <span className="text-faint"> {c.muke}</span>
          <span className="mx-1.5 text-faint">/</span>
          <span className="font-bold text-terra">{grade}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <StageToggle
            stage={stage}
            onChange={pickStage}
            chooseLabel={c.chooseWho}
          />
          <GradeToggle
            stage={stage}
            grade={grade}
            onChange={pickGrade}
            chooseLabel="学年："
          />
        </div>
      </div>

      {/* ===== ひとこと（やさしく入れ替わる） ===== */}
      <p
        key={msgIdx}
        className="anim-msg text-center text-[14px] font-medium text-ink-soft"
      >
        {g[msgIdx]}
      </p>

      {/* ===== 総合の進捗 ===== */}
      <section className="rounded-[1.5rem] border border-line bg-white/70 p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
              {c.progKicker}
            </p>
            <p className="mt-1 font-serif text-2xl font-extrabold text-ink">
              {c.levelWord} {level}
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
              {c.soFar}
            </p>
            <p className="font-serif text-2xl font-extrabold text-ink">
              {totalCorrect}
              <span className="text-faint"> / {totalAttempts}</span>
            </p>
            <p className="text-[12px] text-faint">
              {c.accuracy} {totalPct}%
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Bar ratio={totalPct} color="var(--sky, #2f6fb0)" />
          <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
            {totalAttempts === 0
              ? c.startMsg
              : c.nextMsg(Math.max(0, level * 10 - totalAttempts))}
          </p>
        </div>
      </section>

      {/* ===== コースカード ===== */}
      <section>
        <h2 className="mb-3 font-serif text-lg font-extrabold text-ink">
          {c.courseTitle}
        </h2>
        <div className="stagger grid gap-3 sm:grid-cols-2">
          {/* 算数／数学（別枠） */}
          <CourseCard
            href={`/math${gq}`}
            emoji="🔢"
            label={stage === "elementary" ? "算数" : "数学"}
            accent="#2f6fb0"
            attempts={math.attempts}
            correct={math.correct}
            tagline={c.taglineMath}
            comingSoon={mathComingSoon}
            copy={c}
          />

          {/* 学齢に応じた教科（理科・社会/歴史地理・国語・英語） */}
          {stageSubjects.map((s) => {
            const p = bySubject[s.key] ?? { attempts: 0, correct: 0 };
            return (
              <CourseCard
                key={s.key}
                href={`/learn/${s.key}${gq}`}
                emoji={s.emoji}
                label={s.label}
                accent={accentColor(s.accent)}
                attempts={p.attempts}
                correct={p.correct}
                tagline={c.taglineQuiz}
                comingSoon={!hasContent(s.grades)}
                copy={c}
              />
            );
          })}

          {/* 探究（豆知識）: 全学齢で使える（学年は対話内でえらべる） */}
          <CourseCard
            href="/explore"
            emoji="🔭"
            label={c.exploreLabel}
            accent="#c9622f"
            attempts={0}
            correct={0}
            tagline={c.taglineExplore}
            copy={c}
          />
        </div>
      </section>

      {/* ===== 親からの一言 ===== */}
      <section className="rounded-[1.5rem] border border-terra/30 bg-white/70 p-5 shadow-card sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
            {c.parentKicker}
          </p>
          {!editing && (
            <button
              onClick={startEdit}
              className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-bold text-ink-soft transition hover:text-ink"
            >
              {c.parentEdit}
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
              placeholder={c.parentPlaceholder}
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
            <p className="mt-3 text-[12px] text-faint">{c.parentFooter}</p>
          </blockquote>
        )}
      </section>

      {/* ===== 保護者向けリンク ===== */}
      <footer className="flex flex-col items-center gap-3 pt-2 text-center sm:flex-row sm:justify-center">
        <a
          href="/for-parents"
          className="rounded-full border border-line bg-white/70 px-5 py-2 text-[13px] font-bold text-ink-soft shadow-soft transition hover:-translate-y-0.5 hover:text-ink hover:shadow-card"
        >
          保護者の方へ・使い方ガイド
        </a>
        <a
          href="/guardian"
          className="rounded-full border border-line bg-white/70 px-5 py-2 text-[13px] font-bold text-ink-soft shadow-soft transition hover:-translate-y-0.5 hover:text-ink hover:shadow-card"
        >
          見守りダッシュボード
        </a>
      </footer>
    </div>
  );
}
