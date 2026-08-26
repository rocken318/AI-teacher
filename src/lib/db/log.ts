import "server-only";
import { randomUUID } from "node:crypto";
import { getDb } from "./index";
import { sessions, messages, moderations } from "./schema";

/**
 * ログ保存ヘルパー（安全パイプラインの [ログ保存] 段）。
 * セッション・メッセージ・モデレーション結果を DB に残す。
 */

export function createSession(topic: string, gradeBand: string): string {
  const id = randomUUID();
  getDb().insert(sessions).values({ id, topic, gradeBand }).run();
  return id;
}

export function logMessage(
  sessionId: string,
  sender: "child" | "ai",
  text: string,
): string {
  const id = randomUUID();
  getDb().insert(messages).values({ id, sessionId, sender, text }).run();
  return id;
}

export function logModeration(params: {
  sessionId: string;
  messageId?: string;
  stage: "in" | "out";
  verdict: "ok" | "flagged";
  reason?: string;
}): void {
  getDb()
    .insert(moderations)
    .values({
      id: randomUUID(),
      sessionId: params.sessionId,
      messageId: params.messageId ?? null,
      stage: params.stage,
      verdict: params.verdict,
      reason: params.reason ?? null,
    })
    .run();
}
