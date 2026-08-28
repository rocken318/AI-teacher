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

/** 学年に合わせた語り口のシステムプロンプトを作る。 */
function systemFor(grade: string): string {
  if (grade.startsWith("高")) {
    return (
      "あなたは高校生の数学の先生です。落ち着いた敬体で、要点を筋道立てて説明します。" +
      "答えを一方的に与えるのではなく、考え方の道すじを一緒にたどるように導きます。"
    );
  }
  if (grade.startsWith("中")) {
    return (
      "あなたは中学生の数学の先生です。ていねいな言葉で、手順を一つずつ分けて説明します。" +
      "頭ごなしに教えず、生徒が自分で気づけるように寄り添って導きます。"
    );
  }
  return (
    "あなたは小学生の算数の先生です。子どもにやさしく、ていねいな言葉で話します。" +
    "むずかしい漢字はできるだけ使わず、ひらがなを多めにします。"
  );
}

export async function POST(req: NextRequest) {
  let body: {
    kind?: string;
    answerToken?: string;
    userInput?: string;
    grade?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const kind = body.kind === "feedback" ? "feedback" : "hint";
  const userInput = (body.userInput ?? "").trim();
  const grade = (body.grade ?? "").trim();
  const SYSTEM = systemFor(grade);

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
          `生徒がこの問題をまちがえました。その子に寄り添って、手順を一緒にたどってください。`,
          `問題: ${prompt}`,
          `生徒の答え: ${userInput || "（未回答）"}`,
          `正しい答え: ${expected}`,
          ``,
          `次の流れで説明してください:`,
          `1. まず、責めずに一言そえる（「おしい」「その考え方、いいところまで来てるよ」など）。`,
          `2. その子の答え(${userInput || "未回答"})から、どこでつまずいたのかを推測して、やさしく指摘する。`,
          `3. 正しい手順を「最初の一歩」から具体的に、1ステップずつ順番に示す。`,
          `   （例:「まず左がわを計算しよう。−3×2 = −6 だね。」のように、実際の数で1手ずつ見せる）`,
          `4. 最後の1〜2ステップは全部やりきらず、「つぎは自分でやってみよう」とうながす。`,
          ``,
          `守ること:`,
          `・正しい答え(${expected})を自分で計算しなおさず、この値をそのまま前提にする。`,
          `・箇条書きや番号を使ってよい。ステップは短く、1行ずつ。`,
          `・全体で3〜6文（または3〜5ステップ）程度。長くしすぎない。`,
        ].join("\n");

  let text = "";
  try {
    text = await chatText({
      system: SYSTEM,
      messages: [{ role: "user", content: userMessage }],
      model: MODELS.moderation, // 安いモデルで十分
      maxTokens: kind === "feedback" ? 380 : 200,
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
