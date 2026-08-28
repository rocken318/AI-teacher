import { hasApiKey } from "@/lib/llm";
import { UNITS, unitsForGrade } from "@/lib/math";
import type { Grade } from "@/lib/math";
import { MathPractice } from "./MathPractice";

export const runtime = "nodejs";

const GRADE_ORDER: Grade[] = [
  "小4",
  "小5",
  "小6",
  "中1",
  "中2",
  "中3",
  "高1",
  "高2",
  "高3",
];

/**
 * 算数の練習ページ（サーバーコンポーネント）。
 * 学年ごとの単元一覧を UNITS / unitsForGrade から組み立てて
 * クライアントの練習画面 (MathPractice) に渡す。
 */
export default async function MathPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const apiKeyConfigured = hasApiKey();
  const { grade: gradeParam } = await searchParams;

  // 実在する学年だけを、小→高の順で
  const presentGrades = GRADE_ORDER.filter((g) =>
    UNITS.some((u) => u.grade === g),
  );

  // URL の ?grade= が有効な学年なら、その学年に固定する（トップで選んだ学年）。
  const lockedGrade =
    gradeParam && presentGrades.includes(gradeParam as Grade)
      ? (gradeParam as Grade)
      : undefined;
  const shownGrades = lockedGrade ? [lockedGrade] : presentGrades;

  const grades = shownGrades.map((grade) => ({
    grade,
    units: unitsForGrade(grade).map((u) => ({
      id: u.id,
      grade: u.grade,
      title: u.title,
      lesson: u.lesson,
      answerType: u.answerType,
    })),
  }));

  const totalUnits = lockedGrade
    ? unitsForGrade(lockedGrade).length
    : UNITS.length;
  const gradeRange = lockedGrade
    ? lockedGrade
    : presentGrades.length > 0
      ? `${presentGrades[0]} → ${presentGrades[presentGrades.length - 1]}`
      : "";

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
              たんきゅう
            </a>
            <a href="/math" className="font-semibold text-ink">
              算数
            </a>
            <a href="/guardian" className="hover:text-ink">
              みまもり
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-10 pt-8 sm:pt-12">
        {/* ===== ヒーロー ===== */}
        <section className="mb-8 text-center sm:mb-10">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-terra">
            {gradeRange} ・ 算数ドリル
          </span>
          <h1 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            じぶんの ペースで、
            <span className="relative inline-block text-sky">
              算数れんしゅう。
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1.5 -z-10 h-[6px] rounded bg-terra/80"
              />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            学年と単元をえらぶと、もんだいが 出てきます。まちがえても だいじょうぶ。
            <b className="text-ink">ヒント</b>と <b className="text-ink">やさしい解説</b>が つきます。
          </p>
          <p className="mx-auto mt-2 text-[13px] text-faint">
            ぜんぶで {totalUnits} 単元 ・ こたえは サーバーで しずかに 採点します。
          </p>
        </section>

        {/* ===== 練習モードのバナー ===== */}
        {!apiKeyConfigured && (
          <div className="mb-6 rounded-2xl border border-terra/30 bg-white/60 px-5 py-4 text-sm text-ink-soft shadow-soft">
            <p className="flex items-center gap-2 font-bold text-terra">
              <span aria-hidden="true">⚠</span>
              OPENAI_API_KEY が未設定です（練習モード）
            </p>
            <p className="mt-1.5 leading-relaxed">
              採点は いつも どおり 動きます。ヒントと解説は AIのかわりに
              決まった 文が 出ます（アプリは クラッシュしません）。
            </p>
          </div>
        )}

        {/* ===== 練習カード ===== */}
        <section className="rounded-[1.5rem] border border-line bg-white/70 p-4 shadow-card sm:p-6">
          <MathPractice
            grades={grades}
            apiKeyConfigured={apiKeyConfigured}
            lockedGrade={lockedGrade}
          />
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
            AI先生 · 算数れんしゅう
          </p>
        </footer>
      </main>
    </div>
  );
}
