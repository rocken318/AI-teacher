/**
 * 保護者向けの使い方ガイドページ（サーバーコンポーネント・静的）。
 * /for-parents
 *
 * AI先生の考え方、使い方、関わり方のコツ、見守り、安全・プライバシーを
 * 保護者に向けて敬体でまとめた案内ページ。
 */
export default function ForParentsPage() {
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
            <span className="font-semibold text-ink">保護者の方へ</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col px-4 pb-12 pt-8 sm:pt-12">
        {/* ===== ヒーロー ===== */}
        <section className="mb-10 text-center sm:mb-12">
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.24em] text-terra">
            For Parents ・ 保護者の方へ
          </span>
          <h1 className="mt-4 font-serif text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
            保護者の
            <span className="relative inline-block text-sky">
              方へ。
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1.5 -z-10 h-[6px] rounded bg-terra/80"
              />
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            AI先生は、答えを教えずに<b className="text-ink">“考える力”</b>
            を育てる学習アプリです。安心してお使いいただけるよう、特長と使い方をまとめました。
          </p>
        </section>

        {/* ===== 1. AI先生の考え方（3つの柱） ===== */}
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-1 font-serif text-2xl font-extrabold text-ink">
            AI先生の考え方
          </h2>
          <p className="mb-5 text-[13px] text-faint">
            3つの柱で、お子さんの学びを支えます。
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-2xl border border-line bg-white/70 p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
                01
              </p>
              <h3 className="mt-2 font-serif text-lg font-bold text-ink">
                答えを教えない
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                探究では、AIはすぐに答えを言いません。やさしく問い返し、お子さん自身に考えてもらうことを大切にしています。
              </p>
            </article>
            <article className="rounded-2xl border border-line bg-white/70 p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
                02
              </p>
              <h3 className="mt-2 font-serif text-lg font-bold text-ink">
                間違いを大切にする
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                教科の練習では、間違えたときに「どう考えたか」を受けとめ、正しい筋道をやさしく診断します。もう一回、解き直せます。
              </p>
            </article>
            <article className="rounded-2xl border border-line bg-white/70 p-5 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-terra">
                03
              </p>
              <h3 className="mt-2 font-serif text-lg font-bold text-ink">
                AIに丸投げしない
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                採点・診断・ヒントは、人が用意した確定データを使います。生成AIに事実を作らせない設計で、誤った情報（ハルシネーション）を避けます。
              </p>
            </article>
          </div>
        </section>

        {/* ===== 2. 使い方（ステップ） ===== */}
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-1 font-serif text-2xl font-extrabold text-ink">
            使い方
          </h2>
          <p className="mb-5 text-[13px] text-faint">
            4つのステップで、すぐに始められます。
          </p>
          <ol className="space-y-3">
            {[
              {
                t: "学齢をえらぶ",
                d: "トップで小学生・中学生・高校生をえらぶと、見た目・内容・言葉づかいが学年に合わせて整います。",
              },
              {
                t: "コースをえらぶ",
                d: "算数／数学・理科・社会／歴史地理・国語・英語・探究から、取り組みたいものをえらびます。",
              },
              {
                t: "問題を解く",
                d: "正解ならテンポよく次へ。間違えたら診断が出て、「もう一回」で解き直せます。",
              },
              {
                t: "答えは画面に出ない",
                d: "採点はすべてサーバーで行うため、答えが画面にもネット上にも表示されません。",
              },
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-2xl border border-line bg-white/70 p-5 shadow-soft"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky/10 font-serif text-lg font-extrabold text-sky">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-ink">
                    {step.t}
                  </h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                    {step.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ===== 3. おうちの方へのお願い（関わり方のコツ） ===== */}
        <section className="mb-10 sm:mb-12">
          <div className="rounded-[1.5rem] border border-line bg-white/70 p-6 shadow-card sm:p-8">
            <h2 className="font-serif text-2xl font-extrabold text-ink">
              おうちの方へのお願い
            </h2>
            <p className="mt-1 text-[13px] text-faint">
              ちょっとした関わり方が、大きな力になります。
            </p>
            <ul className="mt-5 space-y-4">
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 text-terra">
                  ●
                </span>
                <p className="text-[14px] leading-relaxed text-ink-soft">
                  正解そのものより、
                  <b className="text-ink">「どう考えたか」</b>
                  をほめてあげてください。
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 text-terra">
                  ●
                </span>
                <p className="text-[14px] leading-relaxed text-ink-soft">
                  間違いは責めず、「もう一回」を一緒に。
                  <b className="text-ink">続けること</b>
                  が一番の力になります。
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-1 text-terra">
                  ●
                </span>
                <p className="text-[14px] leading-relaxed text-ink-soft">
                  短い時間でもかまいません。
                  <b className="text-ink">毎日</b>
                  を大切にしてあげてください。
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* ===== 4. 見守り（保護者ダッシュボード） ===== */}
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-1 font-serif text-2xl font-extrabold text-ink">
            見守り
          </h2>
          <p className="mb-5 text-[13px] text-faint">
            保護者ダッシュボードで、お子さんの様子を確認できます。
          </p>
          <div className="rounded-[1.5rem] border border-line bg-white/70 p-6 shadow-card sm:p-8">
            <ul className="space-y-4 text-[14px] leading-relaxed text-ink-soft">
              <li>
                <a href="/guardian" className="font-semibold text-sky hover:underline">
                  /guardian
                </a>{" "}
                で、お子さんの探究の会話や学習の様子を確認できます。
              </li>
              <li>
                パスコードを設定している場合は{" "}
                <code className="rounded bg-paper2 px-1.5 py-0.5 text-[13px] text-ink">
                  /guardian?code=…
                </code>{" "}
                で開きます。安全のため、本人と保護者だけに限定されます。
              </li>
              <li>
                トップの
                <b className="text-ink">「おうちの人からのひとこと」</b>
                に、応援メッセージを書くことができます。
              </li>
            </ul>
          </div>
        </section>

        {/* ===== 5. 安全・プライバシー ===== */}
        <section className="mb-10 sm:mb-12">
          <h2 className="mb-1 font-serif text-2xl font-extrabold text-ink">
            安全・プライバシー
          </h2>
          <p className="mb-5 text-[13px] text-faint">
            お子さんが安心して使える設計です。
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-line bg-white/70 p-5 shadow-soft">
              <h3 className="font-serif text-base font-bold text-ink">
                会話は本人と保護者だけに
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                会話ログは、本人と保護者だけが見られる設計です。個人情報は聞かない・深掘りしない方針で運用しています。
              </p>
            </article>
            <article className="rounded-2xl border border-line bg-white/70 p-5 shadow-soft">
              <h3 className="font-serif text-base font-bold text-ink">
                生成AIは探究チャットのみ
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                生成AIを使うのは探究チャットだけで、入力と出力を安全にチェックしています。教科の採点・解説は、すべて人が用意した確定データです。
              </p>
            </article>
          </div>
        </section>

        {/* ===== CTA / フッター ===== */}
        <section className="mt-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-line bg-white/70 px-6 py-3 text-[14px] font-semibold text-ink shadow-soft transition hover:bg-white"
            >
              トップへ戻る
            </a>
            <a
              href="/guardian"
              className="inline-flex items-center justify-center rounded-2xl border border-sky/30 bg-sky/10 px-6 py-3 text-[14px] font-semibold text-sky shadow-soft transition hover:bg-sky/20"
            >
              見守りを開く
            </a>
          </div>
          <p className="mt-8 text-center text-[11px] text-faint">
            AI先生 · 保護者の方へ
          </p>
        </section>
      </main>
    </div>
  );
}
