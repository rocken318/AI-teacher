import { notFound } from "next/navigation";
import {
  SUBJECTS,
  getSubjectMeta,
  subjectUnits,
  subjectGrades,
} from "@/lib/quiz";
import type { Subject } from "@/lib/quiz";
import { QuizPractice } from "../../quiz/QuizPractice";

export const runtime = "nodejs";

/** subject が有効な Subject かどうか。 */
function isSubject(value: string): value is Subject {
  return SUBJECTS.some((s) => s.key === value);
}

/**
 * 教科ごとの知識クイズ練習ページ（サーバーコンポーネント）。
 * /learn/science, /learn/social, /learn/japanese, /learn/english
 */
export default async function LearnSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  if (!isSubject(subject)) {
    notFound();
  }

  const meta = getSubjectMeta(subject);
  if (!meta) {
    notFound();
  }

  const units = subjectUnits(subject);
  const totalUnits = units.length;
  const grades = subjectGrades(subject);
  const gradeRange =
    grades.length > 0 ? `${grades[0]} → ${grades[grades.length - 1]}` : "";

  return (
    <div className="min-h-screen">
      {/* ===== ヘッダー / ナビ ===== */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <a href="/" className="group flex items-baseline gap-1.5">
            <span className="font-serif text-xl font-extrabold tracking-wide text-ink">
              AI先生
            </span>
            <span className="text-lg font-extrabold text-terra">.</span>
          </a>
          <nav className="flex items-center gap-4 text-[13px] text-ink-soft sm:gap-6">
            <a href="/" className="hover:text-ink">
              トップへ
            </a>
            <span className="font-semibold text-ink">
              {meta.emoji} {meta.label}
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-10 pt-8 sm:pt-12">
        {/* ===== ヒーロー ===== */}
        <section className="mb-8 text-center sm:mb-10">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-terra">
            {gradeRange} ・ {meta.label}クイズ
          </span>
          <h1 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            <span aria-hidden="true" className="mr-2 text-3xl sm:text-4xl">
              {meta.emoji}
            </span>
            <span className="relative inline-block text-sky">
              {meta.label}のクイズ。
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1.5 -z-10 h-[6px] rounded bg-terra/80"
              />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            学年と単元をえらぶと、クイズが 出てきます。まちがえても だいじょうぶ。
            <b className="text-ink">やさしい かいせつ</b>が つきます。
          </p>
          <p className="mx-auto mt-2 text-[13px] text-faint">
            ぜんぶで {totalUnits} 単元 ・ こたえは サーバーで しずかに 採点します。
          </p>
        </section>

        {/* ===== 練習カード ===== */}
        <section className="rounded-[1.5rem] border border-line bg-white/70 p-4 shadow-card sm:p-6">
          <QuizPractice subject={subject} units={units} grades={grades} />
        </section>

        {/* ===== フッター ===== */}
        <footer className="mt-6">
          <div className="rounded-2xl border border-line bg-white/50 px-5 py-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
              Learn by doing
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              こたえは クライアントに 出しません。採点は サーバーで 行います。
            </p>
          </div>
          <p className="mt-4 text-center text-[11px] text-faint">
            AI先生 · {meta.label}クイズ
          </p>
        </footer>
      </main>
    </div>
  );
}
