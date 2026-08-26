import { getAnthropic, MODELS, textFromMessage } from "@/lib/anthropic";
import type { GradeProfile } from "@/lib/grade/gradeProfiles";

/**
 * [入力モデレーション] 安全パイプライン第1段（haiku）。
 * 危険・不適切・個人情報を判定し、{ ok, reason } を返す。
 * NG（ok=false）なら対話に進ませない。
 *
 * 独立関数として実装。後から別実装（ルール併用・別モデル）へ差し替え可能。
 */

export interface ModerationResult {
  ok: boolean;
  reason: string;
}

export async function moderateInput(
  userText: string,
  profile: GradeProfile,
): Promise<ModerationResult> {
  const anthropic = getAnthropic();
  // キー未設定時は安全側に倒しつつ通す（walking skeleton としてクラッシュさせない）
  if (!anthropic) return { ok: true, reason: "no-api-key: skipped" };

  const system = [
    "あなたは子ども向け学習アプリの入力モデレーターです。",
    `対象は${profile.gradeBand}の子ども。安全レベルは ${profile.safetyLevel}。`,
    "子どもの入力に、次のいずれかが含まれるかを判定してください:",
    "- 危険（暴力・自傷・違法・性的など、子どもに不適切）",
    "- 個人情報（氏名・住所・学校名・電話・メールなど）",
    "- その他、学習の場にふさわしくない内容",
    "",
    "JSONのみを出力してください。形式:",
    '{ "ok": true|false, "reason": "短い理由（日本語）" }',
    "問題なければ ok=true、少しでも懸念があれば ok=false。",
  ].join("\n");

  try {
    const res = await anthropic.messages.create({
      model: MODELS.moderation,
      max_tokens: 200,
      system,
      messages: [{ role: "user", content: userText }],
    });
    return parseModeration(textFromMessage(res));
  } catch {
    // 失敗時は安全側（進ませない）に倒す
    return { ok: false, reason: "moderation-error" };
  }
}

/** モデル出力からJSONを緩く取り出す（前後にテキストが混じっても拾う） */
export function parseModeration(raw: string): ModerationResult {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const json = JSON.parse(match ? match[0] : raw);
    return {
      ok: Boolean(json.ok),
      reason: typeof json.reason === "string" ? json.reason : "",
    };
  } catch {
    // パースできない場合は安全側に倒す
    return { ok: false, reason: "unparseable-moderation-output" };
  }
}
