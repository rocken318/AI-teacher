import "server-only";
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";

/**
 * 採点トークン（サーバー間で共有・答えを秘匿）。
 *
 * Next.js の route ファイルはハンドラ以外を export できないため、共有はこのモジュールに置く。
 *
 * 方式: 正解を含むペイロードを AES-256-GCM で暗号化し base64url で返す。
 *  - サーバーの秘密鍵でしか復号できない → クライアントは正解を読めない（カンニング不可）。
 *  - GCM 認証タグにより改ざん不可 → 正解を差し替えて採点を偽ることもできない。
 *  - ステートレスなので Vercel サーバーレス（インスタンス跨ぎ）でも動く。
 *
 * 秘密鍵は環境変数 MATH_TOKEN_SECRET（未設定なら開発用の既定値）から導出。
 */

const KEY = createHash("sha256")
  .update(process.env.MATH_TOKEN_SECRET ?? "ai-sensei-math-default-secret-v1")
  .digest(); // 32 bytes for aes-256-gcm

export type AnswerTokenPayload = {
  unitId: string;
  answer: string;
  prompt: string;
  /** 診断用の被演算数。旧トークン（meta無し）でも壊れないよう任意。 */
  meta?: Record<string, number>;
};

export function encodeToken(payload: AnswerTokenPayload): string {
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

export function decodeToken(token: string): AnswerTokenPayload | null {
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
    const obj = JSON.parse(dec) as AnswerTokenPayload;
    if (
      obj &&
      typeof obj.unitId === "string" &&
      typeof obj.answer === "string" &&
      typeof obj.prompt === "string"
    ) {
      // 旧トークン（meta 無し）でも壊れないよう既定値でそろえる。
      return {
        unitId: obj.unitId,
        answer: obj.answer,
        prompt: obj.prompt,
        meta:
          obj.meta && typeof obj.meta === "object" && !Array.isArray(obj.meta)
            ? obj.meta
            : {},
      };
    }
    return null;
  } catch {
    return null;
  }
}
