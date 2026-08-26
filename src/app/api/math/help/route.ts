import { NextRequest, NextResponse } from "next/server";
import { hasApiKey, chatText, MODELS } from "@/lib/llm";
import { decodeToken } from "@/lib/math/token";

export const runtime = "nodejs";

/**
 * AIの「教える言葉」だけを返す API（ヒント / まちがいのやさしい解説）。
 * 数値計算・採点はAIにさせない。ヒントは答えを言わない。
 *
 * リクエスト: {
 *   kind: "hint" | "feedback",
 *   answerToken: string,  // problem API のトークン。正解・問題文はここからサーバーで復元する
 *   userInput?: string,   // feedback のとき: 子どもの誤答
 * }
 * レスポンス: { text: string }
 *
 * 正解(expected)と問題文(prompt)は answerToken を復号して取得する（クライアントの
 * 申告値は信用しない）。hasApiKey() が false のときは AI を呼ばず定型文を返す。
 */

const SYSTEM =
  "あなたは小学生の算数の先生です。子どもにやさしく、短く、ていねいな言葉で話します。" +
  "むずかしい漢字はできるだけ使わず、ひらがなを多めにします。";

export async function POST(req: NextRequest) {
  let body: {
    kind?: string;
    answerToken?: string;
    userInput?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const kind = body.kind === "feedback" ? "feedback" : "hint";
  const userInput = (body.userInput ?? "").trim();

  // 正解・問題文はトークンから復元（クライアントの申告は信用しない）
  const payload = decodeToken((body.answerToken ?? "").trim());
  if (!payload) {
    return NextResponse.json({ error: "invalid answerToken" }, { status: 400 });
  }
  const prompt = payload.prompt;
  const expected = payload.answer;

  // APIキーが無ければ定型文（練習モード）
  if (!hasApiKey()) {
    return NextResponse.json({ text: fallbackText(kind, expected) });
  }

  const userMessage =
    kind === "hint"
      ? [
          `つぎの もんだいの ヒントを ください。`,
          `もんだい: ${prompt}`,
          ``,
          `ルール:`,
          `・こたえの すう字は ぜったいに 言わないでください。`,
          `・とき方の 「さいしょの 一歩」や 「どこに 目を つけるか」だけを 教えてください。`,
          `・1〜2文の みじかい ヒントに してください。`,
        ].join("\n")
      : [
          `子どもが 算数の もんだいを まちがえました。やさしく 解説してください。`,
          `もんだい: ${prompt}`,
          `子どもの こたえ: ${userInput || "（みかいとう）"}`,
          `正しい こたえ: ${expected}`,
          ``,
          `ルール:`,
          `・まず 「どこで まちがえやすいか（よくある つまずき）」を やさしく 説明してください。`,
          `・つぎに 正しい 手じゅんを みじかく 教えてください。`,
          `・正しい こたえ (${expected}) は そのまま 使ってよいです。自分で 計算しなおさないでください。`,
          `・ぜんぶで 2〜3文に してください。`,
        ].join("\n");

  let text = "";
  try {
    text = await chatText({
      system: SYSTEM,
      messages: [{ role: "user", content: userMessage }],
      model: MODELS.moderation, // 安いモデルで十分
      maxTokens: 200,
    });
  } catch (err) {
    console.error("[math/help] failed:", err);
    // AI呼び出し失敗時も落とさず定型文でフォールバック
    return NextResponse.json({ text: fallbackText(kind, expected) });
  }

  if (!text) {
    return NextResponse.json({ text: fallbackText(kind, expected) });
  }

  // ヒントは答えを漏らさない後段フィルタ（万一モデルが正解を書いたら定型文に差し替え）
  if (kind === "hint" && expected && text.includes(expected)) {
    return NextResponse.json({ text: fallbackText("hint", expected) });
  }

  return NextResponse.json({ text });
}

/** AI未使用時 / 失敗時の定型文。 */
function fallbackText(kind: string, expected: string): string {
  if (kind === "feedback") {
    return expected
      ? `おしい！ もういちど 手じゅんを ゆっくり たしかめよう。せいかいは ${expected} だよ。`
      : `おしい！ もういちど 手じゅんを ゆっくり たしかめよう。`;
  }
  return `まず、なにを もとめる もんだいか よんでみよう。`;
}
