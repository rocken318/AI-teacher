import Link from "next/link";
import { UNITS } from "@/lib/math";
import { TestRunner } from "./TestRunner";

export const metadata = { title: "テストにちょうせん | AI先生" };

export default function TestPage() {
  const units = UNITS.map((u) => ({
    id: u.id,
    grade: u.grade,
    title: u.title,
    answerType: u.answerType,
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-[12px] font-bold text-sky hover:underline">
        ← ホーム
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-extrabold text-ink">
        テストにちょうせん（算数）
      </h1>
      <p className="mt-1 text-[13px] text-ink-soft">
        単元をえらんでテスト。とちゅうは答えあわせをせず、さいごに点数が出ます。
      </p>
      <div className="mt-6">
        <TestRunner units={units} />
      </div>
    </main>
  );
}
