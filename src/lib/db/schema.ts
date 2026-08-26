import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * データモデル（全体像 5章の初期スケッチのうち、Phase 0 で必要な3つ）。
 * Supabase/Postgres へ移行する際は drizzle の pg-core へ差し替える。
 *
 * Session    : 1回の探究対話
 * Message    : 各発話（child | ai）
 * Moderation : 各安全判定（in | out）とその結果
 */

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  gradeBand: text("grade_band").notNull(),
  startedAt: text("started_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  sender: text("sender", { enum: ["child", "ai"] }).notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const moderations = sqliteTable("moderations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  /** どのメッセージに紐づくか（任意） */
  messageId: text("message_id"),
  /** in = 入力モデレーション / out = 出力モデレーション */
  stage: text("stage", { enum: ["in", "out"] }).notNull(),
  /** ok | flagged */
  verdict: text("verdict", { enum: ["ok", "flagged"] }).notNull(),
  reason: text("reason"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export type SessionRow = typeof sessions.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type ModerationRow = typeof moderations.$inferSelect;
