import { cookies } from "next/headers";
import { listSessions, getDbBackend } from "@/lib/db/read";
import {
  evaluateGuardianAccess,
  GUARDIAN_COOKIE,
} from "@/lib/guardian-auth";
import { GuardianView } from "./GuardianView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 見守りダッシュボード（保護者向け・プレビュー）。
 *
 * アクセスゲートは `@/lib/guardian-auth` に集約（ページ／API 共通）:
 *  - GUARDIAN_PASSCODE 設定時は一致を要求（クエリ ?code= か Cookie）。
 *  - 未設定でも本番(Vercel)×データ有りならフェイルクローズ（未保護公開を防ぐ）。
 *  - ローカル or データ無しは開発閲覧を許可。
 *
 * 本格的な認証・RLS は Supabase 接続後に実装する（今回はプレビュー）。
 */

export default async function GuardianPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const passcode = process.env.GUARDIAN_PASSCODE?.trim();
  const params = await searchParams;
  const cookieStore = await cookies();
  const access = evaluateGuardianAccess({
    providedCode: params.code,
    cookieCode: cookieStore.get(GUARDIAN_COOKIE)?.value,
  });

  if (!access.allowed) {
    if (access.reason === "locked-production") return <LockedNotice />;
    return <PasscodeGate wrong={access.reason === "wrong-passcode"} />;
  }

  const backend = getDbBackend();
  const sessions = await listSessions(50);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
      <header className="mb-4">
        <h1 className="font-serif text-2xl font-bold text-sky-700">
          見守りダッシュボード
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          お子さんの探究対話（会話ログ・安全モデレーションの記録・気づき／つまずきの要約）を
          あとから確認できます。
        </p>
      </header>

      {!passcode && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">※ これは見守りのプレビューです</p>
          <p className="mt-1">
            本番は Supabase 認証 ＋ RLS
            で、本人と保護者だけに閲覧を限定します。
            現在は開発用に中身をそのまま表示しています。
          </p>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
        <span>
          保存先：
          <span className="font-mono font-semibold text-slate-700">
            {backend}
          </span>
        </span>
        {backend === "none" && (
          <span className="text-slate-500">
            （Vercel では DATABASE_URL 未設定のため保存されていません）
          </span>
        )}
      </div>

      <GuardianView sessions={sessions} authCode={access.code} />
    </main>
  );
}

/** 本番でパスコード未設定＋データ有りのときの案内（フェイルクローズ）。 */
function LockedNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-8">
        <h1 className="font-serif text-xl font-bold text-amber-800">
          見守りは保護されています
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          会話ログを未保護で公開しないため、表示をロックしています。
        </p>
        <p className="mt-3 text-sm text-amber-700">
          環境変数 <code className="rounded bg-amber-100 px-1 font-mono">GUARDIAN_PASSCODE</code>{" "}
          を設定すると、パスコードで閲覧できるようになります
          （本番の本格運用は Supabase 認証 ＋ RLS に置き換えます）。
        </p>
      </div>
    </main>
  );
}

function PasscodeGate({ wrong }: { wrong: boolean }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-sky-200 bg-white px-6 py-8 shadow-sm">
        <h1 className="font-serif text-xl font-bold text-sky-700">
          見守りダッシュボード
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          保護者用のパスコードを入力してください。
        </p>

        {wrong && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            パスコードが違います。もう一度お試しください。
          </p>
        )}

        <form method="GET" action="/guardian" className="mt-4 flex gap-2">
          <input
            type="password"
            name="code"
            autoComplete="off"
            placeholder="パスコード"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            開く
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          ※ 簡易ゲートです。本番は Supabase 認証 ＋ RLS
          に置き換えます。
        </p>
      </div>
    </main>
  );
}
