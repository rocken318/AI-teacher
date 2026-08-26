import { hasApiKey, MODELS } from "@/lib/llm";
import { GRADE_BANDS } from "@/lib/grade/gradeProfiles";
import { TOPICS } from "@/lib/topics";
import { Chat } from "@/components/Chat";

export default function Home() {
  const apiKeyConfigured = hasApiKey();

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
            <a href="/lp.html" className="hover:text-ink">
              使い方
            </a>
            <a href="/blueprint.html" className="hover:text-ink">
              設計思想
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
            小1 → 高3 ・ 探究する生成AI
          </span>
          <h1 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            こたえは、
            <span className="relative inline-block text-sky">
              おしえない。
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1.5 -z-10 h-[6px] rounded bg-terra/80"
              />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            AIは こたえを 言いません。かわりに <b className="text-ink">問い返して</b>、
            きみ自身が こたえに たどりつくのを まっています。
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[13px] text-faint">
            テーマと学年をえらんで、じぶんのあたまでかんがえる たんきゅうを はじめよう。
          </p>
        </section>

        {/* ===== 練習モードのバナー（内容は保持） ===== */}
        {!apiKeyConfigured && (
          <div className="mb-6 rounded-2xl border border-terra/30 bg-white/60 px-5 py-4 text-sm text-ink-soft shadow-soft">
            <p className="flex items-center gap-2 font-bold text-terra">
              <span aria-hidden="true">⚠</span>
              OPENAI_API_KEY が未設定です（練習モード）
            </p>
            <p className="mt-1.5 leading-relaxed">
              <code className="rounded bg-paper2 px-1.5 py-0.5 font-mono text-[12px] text-ink">
                .env.local
              </code>{" "}
              に{" "}
              <code className="rounded bg-paper2 px-1.5 py-0.5 font-mono text-[12px] text-ink">
                OPENAI_API_KEY
              </code>{" "}
              を設定すると、実際の対話とモデレーションが動きます。未設定でもアプリは
              クラッシュしません（決まった問い返しを返します）。
            </p>
          </div>
        )}

        {/* ===== Chat カード（周辺を整える） ===== */}
        <section className="rounded-[1.5rem] border border-line bg-white/70 p-4 shadow-card sm:p-6">
          <Chat
            apiKeyConfigured={apiKeyConfigured}
            topics={TOPICS}
            gradeBands={GRADE_BANDS}
          />
        </section>

        {/* ===== モデル表示（内容は保持） ===== */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-faint">
          <span>
            モデル：
            <span className="font-mono font-semibold text-ink-soft">
              {MODELS.dialogue}
            </span>
            <span className="text-faint">（無料）</span>
          </span>
          <span className="text-line">/</span>
          <span>
            じっくりモード：
            <span className="font-mono font-semibold text-ink-soft">
              {MODELS.premiumDialogue}
            </span>
            <span className="text-faint">（課金・準備中）</span>
          </span>
        </div>

        {/* ===== 安全設計フッター（情報は保持・上品に） ===== */}
        <footer className="mt-6">
          <div className="rounded-2xl border border-line bg-white/50 px-5 py-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
              Safety by design
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              すべての言葉は、安全パイプラインを通ります。
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-[12px] text-ink-soft">
              <span className="rounded-full border border-line bg-paper px-3 py-1">
                入口モデ
              </span>
              <span aria-hidden="true" className="text-line">→</span>
              <span className="rounded-full border border-line bg-paper px-3 py-1">
                対話
              </span>
              <span aria-hidden="true" className="text-line">→</span>
              <span className="rounded-full border border-line bg-paper px-3 py-1">
                出口モデ
              </span>
              <span aria-hidden="true" className="text-line">→</span>
              <span className="rounded-full border border-line bg-paper px-3 py-1">
                ログ
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              これは <span className="font-semibold text-ink-soft">Phase 1</span> です
              （探究テーマの複数化・学年プロファイルの切替・ソクラテス型対話の強化）。
              安全パイプラインを全テーマ・全学年で通します。
            </p>
          </div>
          <p className="mt-4 text-center text-[11px] text-faint">
            AI先生 · 探究のための生成AIチューター
          </p>
        </footer>
      </main>
    </div>
  );
}
