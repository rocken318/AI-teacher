import { getAnthropic, MODELS, textFromMessage } from "@/lib/anthropic";
import { buildSocraticSystemPrompt, NO_API_KEY_REPLY } from "@/lib/prompts";
import type { GradeProfile } from "@/lib/grade/gradeProfiles";

/**
 * [対話生成] 安全パイプライン第2段（sonnet）。
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
): Promise<string> {
  const anthropic = getAnthropic();
  // キー未設定でもクラッシュせず、練習モードの問い返しを返す
  if (!anthropic) return NO_API_KEY_REPLY;

  const res = await anthropic.messages.create({
    model: MODELS.dialogue,
    max_tokens: 300,
    system: buildSocraticSystemPrompt(profile),
    messages: history.map((turn) => ({
      role: turn.role === "child" ? ("user" as const) : ("assistant" as const),
      content: turn.text,
    })),
  });

  return textFromMessage(res);
}
