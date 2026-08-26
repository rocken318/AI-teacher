import { NextRequest, NextResponse } from "next/server";
import { hasApiKey } from "@/lib/llm";
import {
  DEFAULT_GRADE_PROFILE,
  GRADE_PROFILES,
  getProfile,
  type GradeBand,
} from "@/lib/grade/gradeProfiles";
import { TOPICS, getTopic } from "@/lib/topics";
import { GENTLE_REDIRECT } from "@/lib/prompts";
import { moderateInput } from "@/lib/safety/moderateInput";
import { generateReply, type DialogueTurn } from "@/lib/safety/generate";
import { moderateOutput } from "@/lib/safety/moderateOutput";
import { createSession, logMessage, logModeration } from "@/lib/db/log";

export const runtime = "nodejs";

/**
 * 安全パイプラインのオーケストレーション。
 * 1回の対話が必ず次を通る:
 *   [入力モデ] → [対話生成] → [出力モデ] → [ログ保存]
 *
 * リクエスト: {
 *   message: string,
 *   history: DialogueTurn[],
 *   sessionId?: string,
 *   topicId?: string,
 *   gradeBand?: GradeBand,
 * }
 * レスポンス: { reply, sessionId, apiKeyConfigured, moderation: {...} }
 */
export async function POST(req: NextRequest) {
  let body: {
    message?: string;
    history?: DialogueTurn[];
    sessionId?: string;
    topicId?: string;
    gradeBand?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const history = Array.isArray(body.history) ? body.history : [];
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // テーマ: 無効/未指定なら先頭テーマにフォールバック
  const topic = getTopic(body.topicId ?? "") ?? TOPICS[0];

  // 学年プロファイル: 無効/未指定なら既定プロファイル
  const band = body.gradeBand as GradeBand | undefined;
  const profile =
    band && band in GRADE_PROFILES ? getProfile(band) : DEFAULT_GRADE_PROFILE;

  // セッションはメッセージ単位で使い回す（無ければ作成）
  let sessionId = body.sessionId;
  if (!sessionId) {
    sessionId = createSession(topic.title, profile.gradeBand, topic.id);
  }

  // 子どもの発話を保存
  const childMsgId = logMessage(sessionId, "child", message);

  // --- [1] 入力モデレーション ---
  const input = await moderateInput(message, profile);
  logModeration({
    sessionId,
    messageId: childMsgId,
    stage: "in",
    verdict: input.ok ? "ok" : "flagged",
    reason: input.reason,
  });

  if (!input.ok) {
    // NG → 対話に進ませず、やさしい定型文で切り返す
    const aiMsgId = logMessage(sessionId, "ai", GENTLE_REDIRECT);
    return NextResponse.json({
      reply: GENTLE_REDIRECT,
      sessionId,
      apiKeyConfigured: hasApiKey(),
      moderation: { input: input.reason, blocked: true, aiMsgId },
    });
  }

  // --- [2] 対話生成（ソクラテス型, テーマ注入） ---
  const turns: DialogueTurn[] = [...history, { role: "child", text: message }];
  let rawReply: string;
  try {
    rawReply = await generateReply(turns, profile, topic.title);
  } catch (err) {
    console.error("[generate] failed:", err);
    return NextResponse.json(
      { error: "generation-failed", sessionId, apiKeyConfigured: hasApiKey() },
      { status: 502 },
    );
  }

  // --- [3] 出力モデレーション（直答なら問い返しに変換） ---
  const output = await moderateOutput(rawReply, profile);

  // --- [4] ログ保存（最終応答＋出力モデ結果） ---
  const aiMsgId = logMessage(sessionId, "ai", output.text);
  logModeration({
    sessionId,
    messageId: aiMsgId,
    stage: "out",
    verdict: output.verdict,
    reason: output.reason,
  });

  return NextResponse.json({
    reply: output.text,
    sessionId,
    apiKeyConfigured: hasApiKey(),
    moderation: {
      input: input.reason || "ok",
      output: output.reason || "ok",
      rewritten: output.verdict === "flagged",
    },
  });
}
