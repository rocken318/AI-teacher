import { hasApiKey, MODELS, chatText } from "@/lib/llm";
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
  // キー未設定時は安全側に倒しつつ通す（walking skeleton としてクラッシュさせない）
  if (!hasApiKey()) return { ok: true, reason: "no-api-key: skipped" };

  const system = [
    "あなたは子ども向け学習アプリの入力モデレーターです。",
    `対象は${profile.gradeBand}の子ども。子どもは ひらがな中心の たどたどしい文や、`,
    "言葉足らずの短文を書きます。ほとんどは無害な好奇心・つぶやき・質問です。",
    "",
    "次のいずれかに**明確に該当する場合のみ** ok=false としてください:",
    "- 暴力・自傷・性的・違法など、子どもに明らかに不適切な内容",
    "- 個人情報（本名・住所・学校名・電話番号・メールアドレスなど）",
    "",
    "重要な原則:",
    "- 上記に明確に当てはまらなければ、必ず ok=true にする。",
    "- 意味がよく分からない・あいまい・幼稚・脱線ぎみ、というだけでは絶対にブロックしない（ok=true）。",
    "- 『理解できないから念のため』で false にしてはいけない。迷ったら ok=true。",
    "",
    "JSONのみを出力してください。形式:",
    '{ "ok": true|false, "reason": "短い理由（日本語）" }',
  ].join("\n");

  try {
    const text = await chatText({
      model: MODELS.moderation,
      maxTokens: 200,
      system,
      messages: [{ role: "user", content: userText }],
    });
    return parseModeration(text);
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
