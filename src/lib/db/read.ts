import "server-only";
import { getStore, getDbBackend } from "./index";
import type {
  SessionSummary,
  SessionDetail,
  ProgressSummary,
  TestResultRow,
  AttemptRow,
  TestResultFullRow,
} from "./index";

/**
 * 読み取り公開ヘルパー（見守りダッシュボード用）。
 * 書き込みの log.ts と対になる、閲覧専用の入口。
 * すべて getStore() 経由で、選ばれた Store（postgres / sqlite / noop）に委譲する。
 * データが無い環境（Vercel で DATABASE_URL 未設定 = noop）では
 * listSessions → []、getSessionDetail → null が返り、画面は壊れない。
 */

/** バックエンド名の getter を再 export（画面での「保存先」表示用） */
export { getDbBackend };
export type {
  SessionSummary,
  SessionDetail,
  ProgressSummary,
  TestResultRow,
  AttemptRow,
  TestResultFullRow,
  MistakeRow,
  DbBackend,
} from "./index";

/** 子ども（childId）の学習進捗集計。失敗時は空集計。 */
export async function getChildProgress(
  childId: string,
): Promise<ProgressSummary> {
  try {
    return await getStore().getChildProgress(childId);
  } catch (err) {
    console.error("[db:read] getChildProgress failed:", err);
    return { total: 0, correct: 0, bySubject: {} };
  }
}

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

/** 同一 test_key の履歴（新しい順）。失敗時は空配列。 */
export async function getTestHistory(
  childId: string,
  testKey: string,
  limit = 50,
): Promise<TestResultRow[]> {
  try {
    return await getStore().getTestHistory(childId, testKey, limit);
  } catch (err) {
    console.error("[db:read] getTestHistory failed:", err);
    return [];
  }
}

/** その子の全 attempts（進捗集計用）。失敗時は空配列。 */
export async function listAttempts(
  childId: string,
): Promise<AttemptRow[]> {
  try {
    return await getStore().listAttempts(childId);
  } catch (err) {
    console.error("[db:read] listAttempts failed:", err);
    return [];
  }
}

/** その子の全 test_results（進捗集計用）。失敗時は空配列。 */
export async function listTestResults(
  childId: string,
): Promise<TestResultFullRow[]> {
  try {
    return await getStore().listTestResults(childId);
  } catch (err) {
    console.error("[db:read] listTestResults failed:", err);
    return [];
  }
}

/** その子のまちがい一覧。失敗時は空配列。 */
export async function listMistakes(childId: string, limit = 200): Promise<import("./index").MistakeRow[]> {
  try { return await getStore().listMistakes(childId, limit); }
  catch (err) { console.error("[db:read] listMistakes failed:", err); return []; }
}
/** その子のまちがい件数。失敗時は 0。 */
export async function countMistakes(childId: string): Promise<number> {
  try { return await getStore().countMistakes(childId); }
  catch (err) { console.error("[db:read] countMistakes failed:", err); return 0; }
}
