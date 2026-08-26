import "server-only";
import { randomUUID } from "node:crypto";
import { getStore, getDbBackend } from "./index";

/**
 * ログ保存ヘルパー（安全パイプラインの [ログ保存] 段）。
 * セッション・メッセージ・モデレーション結果を DB に残す。
 *
 * 公開関数は同期シグネチャを維持する。id は同期的に生成して即返し、
 * 実際の DB 書き込みは fire-and-forget（Promise を投げっぱなし + .catch）で行う。
 * 安全ログはベストエフォートであり、DB 書き込み失敗はアプリを止めない。
 */

/** バックエンド名の getter を再 export（画面表示 / README 用） */
export { getDbBackend };

/** どのバックエンドで動いているか（後方互換のためのエイリアス） */
export type { DbBackend } from "./index";

function fireAndForget(op: () => Promise<void>): void {
  try {
    void op().catch(() => {
      /* ベストエフォート: 書き込み失敗は握りつぶす */
    });
  } catch {
    /* Store 生成時の同期例外も握りつぶす */
  }
}

export function createSession(
  topic: string,
  gradeBand: string,
  topicId?: string,
): string {
  const id = randomUUID();
  fireAndForget(() => getStore().createSession(id, topic, gradeBand, topicId));
  return id;
}

export function logMessage(
  sessionId: string,
  sender: "child" | "ai",
  text: string,
): string {
  const id = randomUUID();
  fireAndForget(() => getStore().logMessage(id, sessionId, sender, text));
  return id;
}

export function logModeration(params: {
  sessionId: string;
  messageId?: string;
  stage: "in" | "out";
  verdict: "ok" | "flagged";
  reason?: string;
}): void {
  const id = randomUUID();
  fireAndForget(() =>
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
