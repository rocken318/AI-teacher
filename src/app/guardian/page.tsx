import { cookies } from "next/headers";
import { listSessions, getDbBackend } from "@/lib/db/read";
import {
  resolveGuardianAccess,
  getPasscodeState,
  GUARDIAN_COOKIE,
} from "@/lib/guardian-auth";
import { GuardianView } from "./GuardianView";
import { GuardianGate } from "./GuardianGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 見守りダッシュボード（保護者向け）。
 *
 * アクセスゲートは `@/lib/guardian-auth` に集約（ページ／API 共通）:
 *  - 保護者パスコード未設定 → 誰でも閲覧可（ロックなし）。
 *  - 設定済み → パスコード入力を要求（Cookie 記憶）。
 *  - パスコードはアプリ内で設定／変更でき、DB に scrypt ハッシュで保存する。
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
    return <GuardianGate wrong={access.reason === "wrong-passcode"} />;
  }

  const backend = getDbBackend();
  const { configured } = await getPasscodeState();
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

      {!configured && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">
            いまはパスコードなしで、このページは誰でも開けます
          </p>
          <p className="mt-1">
            お子さんの会話ログが URL を知る人に見られる状態です。下の
            <span className="font-semibold">「パスコードを設定」</span>
            から、いつでもロックをかけられます。
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

      <GuardianView
        sessions={sessions}
        authCode={access.code}
        passcodeConfigured={configured}
      />
    </main>
  );
}
