import { SUBJECTS, subjectGrades } from "@/lib/quiz";
import { UNITS as MATH_UNITS } from "@/lib/math";
import HomeHub from "./HomeHub";

/**
 * トップページ = コース選択ハブ（サーバーコンポーネント）。
 * 進捗と「親からの一言」でやる気を高める。中身は client の HomeHub が描画。
 * 教科メタ＋各教科の実在学年を渡し、ハブが学齢に応じてコースを解放する。
 */
export default function Home() {
  // 各教科に実在する学年を添える（中身の有無でカードを解放するため）。
  const subjectsWithGrades = SUBJECTS.map((s) => ({
    ...s,
    grades: subjectGrades(s.key),
  }));
  const mathGrades = Array.from(new Set(MATH_UNITS.map((u) => u.grade)));

  return (
    <div className="min-h-screen">
      {/* ===== ヘッダー / ナビ（最小限） ===== */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <a href="/" className="group flex items-baseline gap-1.5">
            <span className="font-serif text-xl font-extrabold tracking-wide text-ink">
              AI先生
            </span>
            <span className="text-lg font-extrabold text-terra">.</span>
          </a>
          <nav className="flex items-center gap-4 text-[13px] text-ink-soft sm:gap-6">
            <a href="/explore" className="hover:text-ink">
              探究
            </a>
            <a href="/guardian" className="hover:text-ink">
              みまもり
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-12 pt-8 sm:pt-12">
        {/* ヒーローは学齢別コピーのため HomeHub 側で描画 */}
        <HomeHub subjects={subjectsWithGrades} mathGrades={mathGrades} />

        <p className="mt-8 text-center text-[11px] text-faint">
          AI先生 · 探究のための生成AIチューター
        </p>
      </main>
    </div>
  );
}
