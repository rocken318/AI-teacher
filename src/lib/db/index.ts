import "server-only";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * DB クライアント（Phase 0）。
 *
 * 全体像では Supabase(PostgreSQL) が本命だが、接続情報が無くても動くよう、
 * ここではローカル SQLite にフォールバックしている（会話ログが残ることが目的）。
 * Postgres へ移行する際は、この module を差し替えるだけで済む構造にしている。
 */

const SQLITE_PATH = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "ai-sensei.db");

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/** どのバックエンドで動いているか（README/画面表示用） */
export const DB_BACKEND = "sqlite" as const;

export function getDb() {
  if (db) return db;

  // 保存先ディレクトリを用意
  const dir = path.dirname(SQLITE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const sqlite = new Database(SQLITE_PATH);
  sqlite.pragma("journal_mode = WAL");

  // マイグレーション未実行でも walking skeleton が動くよう、テーブルを自動作成する。
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      grade_band TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS moderations (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      message_id TEXT,
      stage TEXT NOT NULL,
      verdict TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

  db = drizzle(sqlite, { schema });
  return db;
}

export { schema };
