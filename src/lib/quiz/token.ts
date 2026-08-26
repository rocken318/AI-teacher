import "server-only";
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

/**
 * クイズ採点トークン（サーバー間で共有・正解を秘匿）。
 *
 * Next.js の route ファイルはハンドラ以外を export できないため、共有はこのモジュールに置く。
 *
 * 方式: 正解を含むペイロードを AES-256-GCM で暗号化し base64url で返す。
 *  - サーバーの秘密鍵でしか復号できない → クライアントは正解を読めない（カンニング不可）。
 *  - GCM 認証タグにより改ざん不可 → 正解を差し替えて採点を偽ることもできない。
 *  - ステートレスなので Vercel サーバーレス（インスタンス跨ぎ）でも動く。
 *
 * 秘密鍵は環境変数 QUIZ_TOKEN_SECRET（未設定なら開発用の既定値）から導出。
 */

const KEY = createHash("sha256")
  .update(process.env.QUIZ_TOKEN_SECRET ?? "ai-sensei-quiz-default-secret-v1")
  .digest(); // 32 bytes for aes-256-gcm

export type QuizTokenPayload = {
  unitId: string;
  itemId: string;
  answerIndex: number;
};

export function encodeQuizToken(payload: QuizTokenPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // [iv(12) | tag(16) | ciphertext]
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function decodeQuizToken(token: string): QuizTokenPayload | null {
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length < 28) return null;
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString(
      "utf8",
    );
    const obj = JSON.parse(dec) as QuizTokenPayload;
    if (
      obj &&
      typeof obj.unitId === "string" &&
      typeof obj.itemId === "string" &&
      typeof obj.answerIndex === "number"
    ) {
      return obj;
    }
    return null;
  } catch {
    return null;
  }
}
