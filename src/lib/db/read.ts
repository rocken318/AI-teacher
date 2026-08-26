import "server-only";
import { getStore, getDbBackend } from "./index";
import type { SessionSummary, SessionDetail } from "./index";

/**
 * 読み取り公開ヘルパー（見守りダッシュボード用）。
 * 書き込みの log.ts と対になる、閲覧専用の入口。
 * すべて getStore() 経由で、選ばれた Store（postgres / sqlite / noop）に委譲する。
 * データが無い環境（Vercel で DATABASE_URL 未設定 = noop）では
 * listSessions → []、getSessionDetail → null が返り、画面は壊れない。
 */

/** バックエンド名の getter を再 export（画面での「保存先」表示用） */
export { getDbBackend };
export type { SessionSummary, SessionDetail, DbBackend } from "./index";

/** 新しい順にセッション一覧を返す。失敗時は空配列（ベストエフォート）。 */
export async function listSessions(limit = 50): Promise<SessionSummary[]> {
  try {
    return await getStore().listSessions(limit);
  } catch (err) {
    console.error("[db:read] listSessions failed:", err);
    return [];
  }
}

/** セッション詳細（会話ログ＋モデレーション記録）。無ければ null。 */
export async function getSessionDetail(
  id: string,
): Promise<SessionDetail | null> {
  try {
    return await getStore().getSessionDetail(id);
  } catch (err) {
    console.error("[db:read] getSessionDetail failed:", err);
    return null;
  }
}
