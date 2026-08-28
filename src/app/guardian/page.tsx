import { cookies } from "next/headers";
import { listSessions, getDbBackend } from "@/lib/db/read";
import {
  resolveGuardianAccess,
  GUARDIAN_COOKIE,
} from "@/lib/guardian-auth";
import { GuardianView } from "./GuardianView";
import { GuardianGate } from "./GuardianGate";

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
  const params = await searchParams;
  const cookieStore = await cookies();
  const access = await resolveGuardianAccess({
    providedCode: params.code,
    cookieCode: cookieStore.get(GUARDIAN_COOKIE)?.value,
  });

  if (!access.allowed) {
    return (
      <GuardianGate
        configured={access.configured}
        managedByEnv={access.managedByEnv}
      />
    );
  }

  const backend = getDbBackend();
  const canChangePasscode = access.reason === "passcode-ok";
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

      <GuardianView
        sessions={sessions}
        authCode={access.code}
        canChangePasscode={canChangePasscode}
      />
    </main>
  );
}
