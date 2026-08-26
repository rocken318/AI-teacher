import { hasApiKey, MODELS, chatText } from "@/lib/llm";
import { buildSocraticSystemPrompt, PRACTICE_MODE_REPLY } from "@/lib/prompts";
import type { GradeProfile } from "@/lib/grade/gradeProfiles";

/**
 * [対話生成] 安全パイプライン第2段（dialogue モデル）。
 * ソクラテス型システムプロンプトに沿って応答を生成する。
 * 学年プロファイルを注入するだけで、学年ごとの分岐はエンジンに持たせない。
 */

export interface DialogueTurn {
  role: "child" | "ai";
  text: string;
}

export async function generateReply(
  history: DialogueTurn[],
  profile: GradeProfile,
  topicTitle?: string,
): Promise<string> {
  // キー未設定でもクラッシュせず、練習モードの問い返しを返す
  if (!hasApiKey()) return PRACTICE_MODE_REPLY;

  return chatText({
    model: MODELS.dialogue,
    maxTokens: 300,
    system: buildSocraticSystemPrompt(profile, topicTitle),
    messages: history.map((turn) => ({
      role: turn.role === "child" ? ("user" as const) : ("assistant" as const),
      content: turn.text,
    })),
  });
}
