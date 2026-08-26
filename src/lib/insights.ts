import "server-only";
import { hasApiKey, chatText, MODELS } from "@/lib/llm";

/**
 * 会話の要約＝保護者向けの「気づき / つまずき」抽出。
 *
 * 方針:
 *  - APIキー未設定 or メッセージ空 → LLM を呼ばず簡易フォールバックを返す。
 *  - ある場合は安いモデル（MODELS.moderation = gpt-4o-mini）で、
 *    子どもの発話を中心に JSON を出させ、緩くパースする。失敗時はフォールバック。
 *  - 保護者向けの日本語で短く。個人情報は書かない方針を system に明記する。
 */

export interface SessionInsights {
  summary: string;
  noticed: string[];
  struggles: string[];
}

const FALLBACK: SessionInsights = {
  summary: "（要約はAPIキー設定後に生成されます）",
  noticed: [],
  struggles: [],
};

const SYSTEM = `あなたは小学生の探究学習を見守る保護者向けに、子どもとAIの対話ログを要約するアシスタントです。
子どもの発話を中心に観察し、次の3点を日本語で短くまとめてください。
- summary: 対話全体の一言サマリ（1〜2文）
- noticed: 子どもの「気づき」や良かった点（各項目は短く、最大3件）
- struggles: 子どもが「つまずいた」点や今後の伸びしろ（各項目は短く、最大3件）
制約:
- 氏名・住所・学校名・連絡先などの個人情報は一切書かないこと。もし対話中に含まれていても要約に含めない。
- 温かく前向きな表現で。断定しすぎない。
- 必ず次のJSON形式のみで出力すること（前後に説明文やコードフェンスを付けない）:
{"summary": string, "noticed": string[], "struggles": string[]}`;

/** JSON を緩くパースする。コードフェンスや前後テキストが混じっていても拾う。 */
function looseParse(raw: string): SessionInsights | null {
  if (!raw) return null;
  let text = raw.trim();
  // ```json ... ``` フェンスを除去
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) text = fence[1].trim();
  // 最初の { から最後の } までを抜き出す
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);

  try {
    const obj = JSON.parse(slice) as Record<string, unknown>;
    const summary =
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim()
        : "";
    const toStrArr = (v: unknown): string[] =>
      Array.isArray(v)
        ? v
            .filter((x): x is string => typeof x === "string")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 3)
        : [];
    return {
      summary: summary || "（要約を生成できませんでした）",
      noticed: toStrArr(obj.noticed),
      struggles: toStrArr(obj.struggles),
    };
  } catch {
    return null;
  }
}

export async function summarizeSession(
  messages: { sender: "child" | "ai"; text: string }[],
): Promise<SessionInsights> {
  if (!hasApiKey() || !messages || messages.length === 0) {
    return { ...FALLBACK };
  }

  // 対話ログを 1 つの user メッセージに整形して渡す。
  const transcript = messages
    .map((m) => `${m.sender === "child" ? "子ども" : "AI"}: ${m.text}`)
    .join("\n");

  try {
    const raw = await chatText({
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `次の対話ログを要約してください。\n\n${transcript}`,
        },
      ],
      model: MODELS.moderation,
      maxTokens: 400,
    });
    const parsed = looseParse(raw);
    if (parsed) return parsed;
    return { ...FALLBACK, summary: "（要約を生成できませんでした）" };
  } catch (err) {
    console.error("[insights] summarizeSession failed:", err);
    return { ...FALLBACK, summary: "（要約の生成に失敗しました）" };
  }
}
