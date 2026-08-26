import OpenAI from "openai";

/**
 * モデルの出し分け（全体像 3章の方針）
 * - moderation : 入出力モデレーション・分類・軽い判定（安く速く）
 * - dialogue   : 通常の探究対話（主力）
 * 環境変数で上書き可能。未設定時は既定値を使う。
 */
export const MODELS = {
  moderation: process.env.OPENAI_MODERATION_MODEL ?? "gpt-4o-mini",
  dialogue: process.env.OPENAI_MODEL ?? "gpt-4o",
} as const;

/** APIキーが設定されているか（サーバー側だけで判定） */
export function hasApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

let client: OpenAI | null = null;

/**
 * OpenAI クライアントを取得する。
 * キーはサーバー側だけで使う。未設定なら null を返し、呼び出し側で
 * クラッシュせずフォールバックできるようにする。
 */
export function getOpenAI(): OpenAI | null {
  if (!hasApiKey()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * OpenAI chat.completions を叩く共通ヘルパー。
 * system を先頭に置き、messages をそのまま続ける。
 * 応答本文（trim 済み）を返す。キー未設定時は空文字を返す。
 */
export async function chatText(args: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  model: string;
  maxTokens?: number;
}): Promise<string> {
  const openai = getOpenAI();
  if (!openai) return "";

  const res = await openai.chat.completions.create({
    model: args.model,
    max_tokens: args.maxTokens ?? 300,
    messages: [
      { role: "system", content: args.system },
      ...args.messages,
    ],
  });

  return (res.choices[0]?.message?.content ?? "").trim();
}
