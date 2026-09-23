import "server-only";
import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { getStore, getDbBackend } from "./index";
import type { MistakeInput } from "./index";

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

/** 学習履歴（1回の解答）を保存する。source は "practice"（既定）/ "test"。 */
export function logAttempt(
  childId: string,
  subject: string,
  unitId: string,
  correct: boolean,
  source: string = "practice",
): void {
  const id = randomUUID();
  runAfterResponse(() =>
    getStore().recordAttempt(id, childId, subject, unitId, correct, source),
  );
}

/** まちがいを保存する（after 経由・ベストエフォート）。 */
export function logMistake(input: Omit<MistakeInput, "id">): void {
  const id = randomUUID();
  runAfterResponse(() => getStore().addMistake({ id, ...input }));
}
/** まちがいを削除する（即 await 用・解き直し正解/もう覚えた）。 */
export async function removeMistakeNow(childId: string, mistakeId: string): Promise<void> {
  await getStore().removeMistake(childId, mistakeId);
}
/** まちがいを保存する（即 await 用・ユーザー操作「怪しい」で確実に入れたいとき）。 */
export async function addMistakeNow(input: Omit<MistakeInput, "id">): Promise<void> {
  await getStore().addMistake({ id: randomUUID(), ...input });
}

/** テスト結果（1回分）を保存する。 */
export function logTestResult(input: {
  childId: string;
  subject: string;
  unitIds: string;
  testKey: string;
  total: number;
  score: number;
}): void {
  const id = randomUUID();
  runAfterResponse(() => getStore().recordTestResult({ id, ...input }));
}

/** 学習記録の付け替え（引き継ぎ）。即時 await 用に直呼び。 */
export async function reassignChildData(fromChildId: string, toChildId: string): Promise<void> {
  await getStore().reassignChildData(fromChildId, toChildId);
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
