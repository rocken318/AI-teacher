import Link from "next/link";
import { UNITS } from "@/lib/math";
import type { AnswerType } from "@/lib/math";
import { SUBJECTS, subjectUnits, subjectGrades } from "@/lib/quiz";
import { TEST_SUBJECTS, subjectKind } from "@/lib/test/pool";
import { TestRunner } from "./TestRunner";
import type { SubjectMetaDTO } from "./TestRunner";

export const metadata = { title: "テストにちょうせん | AI先生" };

/**
 * 全教科ぶんの「単元メタ」を組み立てる（答え・answerIndex は一切含めない）。
 * - math: UNITS を学年でグルーピング（answerType は入力モードに使う）。
 * - quiz教科: subjectUnits(教科) を学年でグルーピング。
 * TEST_SUBJECTS に載っている教科だけを、その順番で並べる。
 */
function buildSubjects(): SubjectMetaDTO[] {
  const out: SubjectMetaDTO[] = [];

  for (const key of TEST_SUBJECTS) {
    if (key === "math") {
      if (subjectKind("math") !== "math") continue;
      const grades: string[] = [];
      for (const u of UNITS) if (!grades.includes(u.grade)) grades.push(u.grade);
      out.push({
        subject: "math",
        label: "算数",
        emoji: "🔢",
        kind: "math",
        grades: grades.map((grade) => ({
          grade,
          units: UNITS.filter((u) => u.grade === grade).map((u) => ({
            id: u.id,
            title: u.title,
            answerType: u.answerType as AnswerType,
          })),
        })),
      });
      continue;
    }

    const meta = SUBJECTS.find((s) => s.key === key);
    if (!meta) continue;
    const all = subjectUnits(meta.key);
    const grades = subjectGrades(meta.key);
    out.push({
      subject: meta.key,
      label: meta.label,
      emoji: meta.emoji,
      kind: "quiz",
      grades: grades.map((grade) => ({
        grade,
        units: all
          .filter((u) => u.grade === grade)
          .map((u) => ({ id: u.id, title: u.title })),
      })),
    });
  }

  return out;
}

export default async function TestPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const subjects = buildSubjects();
  const initialSubject =
    subject && subjects.some((s) => s.subject === subject) ? subject : "math";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="text-[12px] font-bold text-sky hover:underline">
        ← ホーム
      </Link>
      <h1 className="mt-2 font-serif text-2xl font-extrabold text-ink">
        テストにちょうせん
      </h1>
      <p className="mt-1 text-[13px] text-ink-soft">
        教科と単元をえらんでテスト。とちゅうは答えあわせをせず、さいごに点数が出ます。
      </p>
      <div className="mt-6">
        <TestRunner subjects={subjects} initialSubject={initialSubject} />
      </div>
    </main>
  );
}
