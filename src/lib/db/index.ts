import "server-only";
import path from "node:path";

/**
 * DB 層（Store 抽象化）。
 *
 * Vercel のサーバーレス関数はファイルシステムが読み取り専用のため、SQLite への
 * 書き込みは失敗する。そこで実行環境に応じて保存先を切り替える「Store 抽象」を用意する。
 *
 * 選択ロジック（getStore() でシングルトン）:
 *  - process.env.DATABASE_URL があれば PostgresStore（postgres-js / 生SQL）
 *  - 無ければ、ローカル（process.env.VERCEL 無し）なら SqliteStore（better-sqlite3）
 *  - それ以外（Vercel 上で DATABASE_URL 無し）は NoopStore（何もしない）
 *
 * better-sqlite3 / postgres はトップレベルで static import しない。
 * 実際に選ばれた Store の中で動的 import（await import(...)）する。
 */

export type DbBackend = "postgres" | "sqlite" | "none";

export interface Store {
  createSession(
    id: string,
    topic: string,
    gradeBand: string,
    topicId?: string,
  ): Promise<void>;
  logMessage(
    id: string,
    sessionId: string,
    sender: "child" | "ai",
    text: string,
  ): Promise<void>;
  logModeration(
    id: string,
    sessionId: string,
    messageId: string | null,
    stage: "in" | "out",
    verdict: "ok" | "flagged",
    reason: string | null,
  ): Promise<void>;
}

/* ------------------------------------------------------------------ */
/* PostgresStore（postgres-js / 生SQL）                                 */
/* ------------------------------------------------------------------ */

class PostgresStore implements Store {
  // postgres-js の sql タグ。動的 import するので型は緩めに保つ。
  private sql: any;
  private ready: Promise<void>;

  constructor(databaseUrl: string) {
    this.ready = this.init(databaseUrl);
  }

  private async init(databaseUrl: string): Promise<void> {
    const mod = await import("postgres");
    const postgres = (mod as any).default ?? mod;
    // Vercel(サーバーレス) × Supabase の Transaction Pooler(pgbouncer, :6543) で確実に動くよう、
    // prepared statements を無効化し、関数インスタンスあたりの接続数を絞る。
    this.sql = postgres(databaseUrl, { prepare: false, max: 1, idle_timeout: 20 });

    // テーブル作成は初期化時に一度だけ（IF NOT EXISTS）。
    await this.sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        grade_band TEXT NOT NULL,
        topic_id TEXT,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      CREATE TABLE IF NOT EXISTS moderations (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        message_id TEXT,
        stage TEXT NOT NULL,
        verdict TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
  }

  async createSession(
    id: string,
    topic: string,
    gradeBand: string,
    topicId?: string,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO sessions (id, topic, grade_band, topic_id)
      VALUES (${id}, ${topic}, ${gradeBand}, ${topicId ?? null})
    `;
  }

  async logMessage(
    id: string,
    sessionId: string,
    sender: "child" | "ai",
    text: string,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO messages (id, session_id, sender, text)
      VALUES (${id}, ${sessionId}, ${sender}, ${text})
    `;
  }

  async logModeration(
    id: string,
    sessionId: string,
    messageId: string | null,
    stage: "in" | "out",
    verdict: "ok" | "flagged",
    reason: string | null,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO moderations (id, session_id, message_id, stage, verdict, reason)
      VALUES (${id}, ${sessionId}, ${messageId}, ${stage}, ${verdict}, ${reason})
    `;
  }
}

/* ------------------------------------------------------------------ */
/* SqliteStore（better-sqlite3 / 生SQL・ローカル専用）                   */
/* ------------------------------------------------------------------ */

class SqliteStore implements Store {
  private db: any;
  private ready: Promise<void>;

  constructor(sqlitePath: string) {
    this.ready = this.init(sqlitePath);
  }

  private async init(sqlitePath: string): Promise<void> {
    const { existsSync, mkdirSync } = await import("node:fs");
    const mod = await import("better-sqlite3");
    const Database = (mod as any).default ?? mod;

    const dir = path.dirname(sqlitePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const sqlite = new Database(sqlitePath);
    sqlite.pragma("journal_mode = WAL");

    // マイグレーション未実行でも walking skeleton が動くよう、テーブルを自動作成する。
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        grade_band TEXT NOT NULL,
        topic_id TEXT,
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

    this.db = sqlite;
  }

  async createSession(
    id: string,
    topic: string,
    gradeBand: string,
    topicId?: string,
  ): Promise<void> {
    await this.ready;
    this.db
      .prepare(
        "INSERT INTO sessions (id, topic, grade_band, topic_id) VALUES (?, ?, ?, ?)",
      )
      .run(id, topic, gradeBand, topicId ?? null);
  }

  async logMessage(
    id: string,
    sessionId: string,
    sender: "child" | "ai",
    text: string,
  ): Promise<void> {
    await this.ready;
    this.db
      .prepare(
        "INSERT INTO messages (id, session_id, sender, text) VALUES (?, ?, ?, ?)",
      )
      .run(id, sessionId, sender, text);
  }

  async logModeration(
    id: string,
    sessionId: string,
    messageId: string | null,
    stage: "in" | "out",
    verdict: "ok" | "flagged",
    reason: string | null,
  ): Promise<void> {
    await this.ready;
    this.db
      .prepare(
        "INSERT INTO moderations (id, session_id, message_id, stage, verdict, reason) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(id, sessionId, messageId, stage, verdict, reason);
  }
}

/* ------------------------------------------------------------------ */
/* NoopStore（Vercel 上で DATABASE_URL 無し。何もしない）                */
/* ------------------------------------------------------------------ */

class NoopStore implements Store {
  async createSession(
    id: string,
    topic: string,
    gradeBand: string,
    topicId?: string,
  ): Promise<void> {
    console.debug("[db:noop] createSession", { id, topic, gradeBand, topicId });
  }

  async logMessage(
    id: string,
    sessionId: string,
    sender: "child" | "ai",
    text: string,
  ): Promise<void> {
    console.debug("[db:noop] logMessage", { id, sessionId, sender, text });
  }

  async logModeration(
    id: string,
    sessionId: string,
    messageId: string | null,
    stage: "in" | "out",
    verdict: "ok" | "flagged",
    reason: string | null,
  ): Promise<void> {
    console.debug("[db:noop] logModeration", {
      id,
      sessionId,
      messageId,
      stage,
      verdict,
      reason,
    });
  }
}

/* ------------------------------------------------------------------ */
/* Store 選択（シングルトン）                                           */
/* ------------------------------------------------------------------ */

let store: Store | null = null;
let backend: DbBackend = "none";

function pickBackend(): DbBackend {
  if (process.env.DATABASE_URL) return "postgres";
  if (!process.env.VERCEL) return "sqlite";
  return "none";
}

export function getStore(): Store {
  if (store) return store;

  backend = pickBackend();
  switch (backend) {
    case "postgres":
      store = new PostgresStore(process.env.DATABASE_URL as string);
      break;
    case "sqlite": {
      const sqlitePath =
        process.env.SQLITE_PATH ??
        path.join(process.cwd(), "data", "ai-sensei.db");
      store = new SqliteStore(sqlitePath);
      break;
    }
    default:
      store = new NoopStore();
      break;
  }
  return store;
}

/** 現在のバックエンド名を返す。getStore() を呼んでから確定する。 */
export function getDbBackend(): DbBackend {
  // まだ Store が選ばれていなければ選択（副作用で backend を確定）。
  if (!store) getStore();
  return backend;
}
