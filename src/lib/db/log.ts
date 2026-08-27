import "server-only";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { getStore, getDbBackend } from "./index";

/**
 * ログ保存ヘルパー（安全パイプラインの [ログ保存] 段）。
 * セッション・メッセージ・モデレーション結果を DB に残す。
 *
 * 公開関数は同期シグネチャを維持する（id は同期生成して即返す）。
 * 実際の DB 書き込みは Next.js の after() でレスポンス後に実行する。
 * after はサーバーレスでも書き込み完了まで関数を生かすため、Vercel で
 * 「応答後に関数が凍結され書き込みが切られる」問題を避けられる。
 * リクエスト外（after 不可）の呼び出しには fire-and-forget でフォールバック。
 * 安全ログはベストエフォートであり、書き込み失敗はアプリを止めない。
 */

/** バックエンド名の getter を再 export（画面表示 / README 用） */
export { getDbBackend };

/** どのバックエンドで動いているか（後方互換のためのエイリアス） */
export type { DbBackend } from "./index";

function runAfterResponse(op: () => Promise<void>): void {
  const guarded = async () => {
    try {
      await op();
    } catch {
      /* ベストエフォート: 書き込み失敗は握りつぶす */
    }
  };
  try {
    // レスポンス後に実行（完了まで関数を生かす）。
    after(guarded);
  } catch {
    // リクエストスコープ外など after が使えない場合は投げっぱなし。
    void guarded();
  }
}

export function createSession(
  topic: string,
  gradeBand: string,
  topicId?: string,
): string {
  const id = randomUUID();
  runAfterResponse(() => getStore().createSession(id, topic, gradeBand, topicId));
  return id;
}

export function logMessage(
  sessionId: string,
  sender: "child" | "ai",
  text: string,
): string {
  const id = randomUUID();
  runAfterResponse(() => getStore().logMessage(id, sessionId, sender, text));
  return id;
}

/** 学習履歴（1回の解答）を保存する。進捗集計・見守り用。 */
export function logAttempt(
  childId: string,
  subject: string,
  unitId: string,
  correct: boolean,
): void {
  const id = randomUUID();
  runAfterResponse(() =>
    getStore().recordAttempt(id, childId, subject, unitId, correct),
  );
}

export function logModeration(params: {
  sessionId: string;
  messageId?: string;
  stage: "in" | "out";
  verdict: "ok" | "flagged";
  reason?: string;
}): void {
  const id = randomUUID();
  runAfterResponse(() =>
    getStore().logModeration(
      id,
      params.sessionId,
      params.messageId ?? null,
      params.stage,
      params.verdict,
      params.reason ?? null,
    ),
  );
}
