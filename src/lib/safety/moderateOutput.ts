import { getAnthropic, MODELS, textFromMessage } from "@/lib/anthropic";
import { buildRewriteToQuestionPrompt } from "@/lib/prompts";
import type { GradeProfile } from "@/lib/grade/gradeProfiles";

/**
 * [出力モデレーション] 安全パイプライン第3段（haiku）。
 * AIの応答が「答えを直答していないか／不適切表現がないか」を判定する。
 * 直答していたら、問い返しに変換して返す。
 *
 * 戻り値:
 *  - verdict: "ok" | "flagged"（直答/不適切あり）
 *  - text   : 最終的に子どもへ返す本文（flagged の場合は問い返しに変換済み）
 *  - reason : 判定理由（ログ用）
 */

export interface OutputModerationResult {
  verdict: "ok" | "flagged";
  text: string;
  reason: string;
}

export async function moderateOutput(
  aiText: string,
  profile: GradeProfile,
): Promise<OutputModerationResult> {
  const anthropic = getAnthropic();
  if (!anthropic) return { verdict: "ok", text: aiText, reason: "no-api-key: skipped" };

  const system = [
    "あなたは子ども向け学習アプリの出力モデレーターです。",
    "AI先生の応答が次のどちらかに当てはまるか判定してください:",
    "- 子どもの問いに『答え（結論・事実）を直接教えてしまっている』",
    "- 不適切な表現が含まれている",
    "",
    "JSONのみを出力してください。形式:",
    '{ "directAnswer": true|false, "inappropriate": true|false, "reason": "短い理由" }',
  ].join("\n");

  let flagged = false;
  let reason = "";
  try {
    const res = await anthropic.messages.create({
      model: MODELS.moderation,
      max_tokens: 200,
      system,
      messages: [{ role: "user", content: aiText }],
    });
    const parsed = parseOutputVerdict(textFromMessage(res));
    flagged = parsed.directAnswer || parsed.inappropriate;
    reason = parsed.reason;
  } catch {
    // 判定に失敗したら、そのまま通す（対話生成側で既にソクラテス制約あり）
    return { verdict: "ok", text: aiText, reason: "output-moderation-error" };
  }

  if (!flagged) return { verdict: "ok", text: aiText, reason: reason || "ok" };

  // 直答/不適切 → 問い返しに変換
  try {
    const rewrite = await anthropic.messages.create({
      model: MODELS.moderation,
      max_tokens: 300,
      system: buildRewriteToQuestionPrompt(profile),
      messages: [{ role: "user", content: aiText }],
    });
    return {
      verdict: "flagged",
      text: textFromMessage(rewrite),
      reason: reason || "直答/不適切を検知し問い返しに変換",
    };
  } catch {
    return { verdict: "flagged", text: aiText, reason: "rewrite-error" };
  }
}

export function parseOutputVerdict(raw: string): {
  directAnswer: boolean;
  inappropriate: boolean;
  reason: string;
} {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const json = JSON.parse(match ? match[0] : raw);
    return {
      directAnswer: Boolean(json.directAnswer),
      inappropriate: Boolean(json.inappropriate),
      reason: typeof json.reason === "string" ? json.reason : "",
    };
  } catch {
    return { directAnswer: false, inappropriate: false, reason: "unparseable" };
  }
}
