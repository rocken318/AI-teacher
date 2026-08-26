import Anthropic from "@anthropic-ai/sdk";

/**
 * モデルの出し分け（全体像 3章の方針）
 * - haiku : 入出力モデレーション・分類・軽い判定（安く速く）
 * - sonnet: 通常の探究対話（主力）
 * - opus  : 難度の高い対話（Phase 4 以降）
 */
export const MODELS = {
  moderation: "claude-haiku-4-5",
  dialogue: "claude-sonnet-4-6",
} as const;

/** APIキーが設定されているか（サーバー側だけで判定） */
export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

let client: Anthropic | null = null;

/**
 * Anthropic クライアントを取得する。
 * キーはサーバー側だけで使う。未設定なら null を返し、呼び出し側で
 * クラッシュせずフォールバックできるようにする。
 */
export function getAnthropic(): Anthropic | null {
  if (!hasApiKey()) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/** メッセージ配列から純テキストを取り出すヘルパー */
export function textFromMessage(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}
