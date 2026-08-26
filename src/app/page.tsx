import { hasApiKey } from "@/lib/llm";
import { GRADE_BANDS } from "@/lib/grade/gradeProfiles";
import { TOPICS } from "@/lib/topics";
import { Chat } from "@/components/Chat";

export default function Home() {
  const apiKeyConfigured = hasApiKey();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-sky-700">AI先生</h1>
        <p className="text-sm text-slate-600">
          こたえは おしえないよ。いっしょに かんがえよう。
        </p>
        <p className="mt-1 text-xs text-slate-500">
          テーマと 学年を えらんで、じぶんの あたまで かんがえる たんきゅうを はじめよう。
        </p>
      </header>

      {!apiKeyConfigured && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">⚠ OPENAI_API_KEY が未設定です（練習モード）</p>
          <p className="mt-1">
            <code className="rounded bg-amber-100 px-1">.env.local</code> に
            <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code>
            を設定すると、実際の対話とモデレーションが動きます。未設定でもアプリは
            クラッシュしません（決まった問い返しを返します）。
          </p>
        </div>
      )}

      <Chat
        apiKeyConfigured={apiKeyConfigured}
        topics={TOPICS}
        gradeBands={GRADE_BANDS}
      />

      <footer className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
        これは <span className="font-semibold">Phase 1</span> です（探究テーマの複数化・
        学年プロファイルの切替・ソクラテス型対話の強化）。安全パイプライン（入力モデ→対話→
        出力モデ→ログ）を全テーマ・全学年で通します。
      </footer>
    </main>
  );
}
