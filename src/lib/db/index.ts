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

/** 見守りダッシュボード向け: セッション一覧の1件分。 */
export interface SessionSummary {
  id: string;
  topic: string;
  gradeBand: string;
  topicId: string | null;
  startedAt: string;
  messageCount: number;
}

/** 見守りダッシュボード向け: セッション詳細（会話ログ＋モデレーション記録）。 */
export interface SessionDetail {
  session: SessionSummary;
  messages: {
    id: string;
    sender: string;
    text: string;
    createdAt: string;
  }[];
  moderations: {
    id: string;
    messageId: string | null;
    stage: string;
    verdict: string;
    reason: string | null;
    createdAt: string;
  }[];
}

/** 学習進捗の集計（見守り／ハブ表示用）。 */
export interface ProgressSummary {
  total: number;
  correct: number;
  bySubject: Record<string, { attempts: number; correct: number }>;
}

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

  /* --- 学習履歴（進捗） --- */
  recordAttempt(
    id: string,
    childId: string,
    subject: string,
    unitId: string,
    correct: boolean,
  ): Promise<void>;
  getChildProgress(childId: string): Promise<ProgressSummary>;

  /* --- 読み取り（見守りダッシュボード用） --- */
  listSessions(limit: number): Promise<SessionSummary[]>;
  getSessionDetail(id: string): Promise<SessionDetail | null>;
}

/** 教科別の集計行から ProgressSummary を組み立てる。 */
function aggregateProgress(
  rows: { subject: string; attempts: number; correct: number }[],
): ProgressSummary {
  const bySubject: Record<string, { attempts: number; correct: number }> = {};
  let total = 0;
  let correct = 0;
  for (const r of rows) {
    bySubject[r.subject] = { attempts: r.attempts, correct: r.correct };
    total += r.attempts;
    correct += r.correct;
  }
  return { total, correct, bySubject };
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
    await this.sql`
      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        correct BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`
      CREATE INDEX IF NOT EXISTS attempts_child_idx ON attempts (child_id)
    `;
  }

  async recordAttempt(
    id: string,
    childId: string,
    subject: string,
    unitId: string,
    correct: boolean,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO attempts (id, child_id, subject, unit_id, correct)
      VALUES (${id}, ${childId}, ${subject}, ${unitId}, ${correct})
    `;
  }

  async getChildProgress(childId: string): Promise<ProgressSummary> {
    await this.ready;
    const rows = await this.sql`
      SELECT subject,
             COUNT(*) AS attempts,
             SUM(CASE WHEN correct THEN 1 ELSE 0 END) AS correct
      FROM attempts
      WHERE child_id = ${childId}
      GROUP BY subject
    `;
    return aggregateProgress(
      (rows as any[]).map((r) => ({
        subject: String(r.subject),
        attempts: Number(r.attempts ?? 0),
        correct: Number(r.correct ?? 0),
      })),
    );
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

  async listSessions(limit: number): Promise<SessionSummary[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT
        s.id AS id,
        s.topic AS topic,
        s.grade_band AS grade_band,
        s.topic_id AS topic_id,
        s.started_at AS started_at,
        (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s
      ORDER BY s.started_at DESC
      LIMIT ${limit}
    `;
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      topic: String(r.topic),
      gradeBand: String(r.grade_band),
      topicId: r.topic_id == null ? null : String(r.topic_id),
      startedAt: r.started_at == null ? "" : String(r.started_at),
      messageCount: Number(r.message_count ?? 0),
    }));
  }

  async getSessionDetail(id: string): Promise<SessionDetail | null> {
    await this.ready;
    const sessionRows = await this.sql`
      SELECT
        s.id AS id,
        s.topic AS topic,
        s.grade_band AS grade_band,
        s.topic_id AS topic_id,
        s.started_at AS started_at,
        (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
      FROM sessions s
      WHERE s.id = ${id}
      LIMIT 1
    `;
    const s = (sessionRows as any[])[0];
    if (!s) return null;

    const messageRows = await this.sql`
      SELECT id, sender, text, created_at
      FROM messages
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;
    const moderationRows = await this.sql`
      SELECT id, message_id, stage, verdict, reason, created_at
      FROM moderations
      WHERE session_id = ${id}
      ORDER BY created_at ASC
    `;

    return {
      session: {
        id: String(s.id),
        topic: String(s.topic),
        gradeBand: String(s.grade_band),
        topicId: s.topic_id == null ? null : String(s.topic_id),
        startedAt: s.started_at == null ? "" : String(s.started_at),
        messageCount: Number(s.message_count ?? 0),
      },
      messages: (messageRows as any[]).map((r) => ({
        id: String(r.id),
        sender: String(r.sender),
        text: String(r.text),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      })),
      moderations: (moderationRows as any[]).map((r) => ({
        id: String(r.id),
        messageId: r.message_id == null ? null : String(r.message_id),
        stage: String(r.stage),
        verdict: String(r.verdict),
        reason: r.reason == null ? null : String(r.reason),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      })),
    };
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
      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        correct INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE INDEX IF NOT EXISTS attempts_child_idx ON attempts (child_id);
    `);

    this.db = sqlite;
  }

  async recordAttempt(
    id: string,
    childId: string,
    subject: string,
    unitId: string,
    correct: boolean,
  ): Promise<void> {
    await this.ready;
    this.db
      .prepare(
        "INSERT INTO attempts (id, child_id, subject, unit_id, correct) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, childId, subject, unitId, correct ? 1 : 0);
  }

  async getChildProgress(childId: string): Promise<ProgressSummary> {
    await this.ready;
    const rows = this.db
      .prepare(
        "SELECT subject, COUNT(*) AS attempts, SUM(correct) AS correct FROM attempts WHERE child_id = ? GROUP BY subject",
      )
      .all(childId);
    return aggregateProgress(
      (rows as any[]).map((r) => ({
        subject: String(r.subject),
        attempts: Number(r.attempts ?? 0),
        correct: Number(r.correct ?? 0),
      })),
    );
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

  async listSessions(limit: number): Promise<SessionSummary[]> {
    await this.ready;
    const rows = this.db
      .prepare(
        `SELECT
           s.id AS id,
           s.topic AS topic,
           s.grade_band AS grade_band,
           s.topic_id AS topic_id,
           s.started_at AS started_at,
           (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
         FROM sessions s
         ORDER BY s.started_at DESC
         LIMIT ?`,
      )
      .all(limit) as any[];
    return rows.map((r) => ({
      id: String(r.id),
      topic: String(r.topic),
      gradeBand: String(r.grade_band),
      topicId: r.topic_id == null ? null : String(r.topic_id),
      startedAt: r.started_at == null ? "" : String(r.started_at),
      messageCount: Number(r.message_count ?? 0),
    }));
  }

  async getSessionDetail(id: string): Promise<SessionDetail | null> {
    await this.ready;
    const s = this.db
      .prepare(
        `SELECT
           s.id AS id,
           s.topic AS topic,
           s.grade_band AS grade_band,
           s.topic_id AS topic_id,
           s.started_at AS started_at,
           (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) AS message_count
         FROM sessions s
         WHERE s.id = ?
         LIMIT 1`,
      )
      .get(id) as any;
    if (!s) return null;

    const messageRows = this.db
      .prepare(
        `SELECT id, sender, text, created_at
         FROM messages
         WHERE session_id = ?
         ORDER BY created_at ASC`,
      )
      .all(id) as any[];
    const moderationRows = this.db
      .prepare(
        `SELECT id, message_id, stage, verdict, reason, created_at
         FROM moderations
         WHERE session_id = ?
         ORDER BY created_at ASC`,
      )
      .all(id) as any[];

    return {
      session: {
        id: String(s.id),
        topic: String(s.topic),
        gradeBand: String(s.grade_band),
        topicId: s.topic_id == null ? null : String(s.topic_id),
        startedAt: s.started_at == null ? "" : String(s.started_at),
        messageCount: Number(s.message_count ?? 0),
      },
      messages: messageRows.map((r) => ({
        id: String(r.id),
        sender: String(r.sender),
        text: String(r.text),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      })),
      moderations: moderationRows.map((r) => ({
        id: String(r.id),
        messageId: r.message_id == null ? null : String(r.message_id),
        stage: String(r.stage),
        verdict: String(r.verdict),
        reason: r.reason == null ? null : String(r.reason),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      })),
    };
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

  async recordAttempt(
    id: string,
    childId: string,
    subject: string,
    unitId: string,
    correct: boolean,
  ): Promise<void> {
    console.debug("[db:noop] recordAttempt", {
      id,
      childId,
      subject,
      unitId,
      correct,
    });
  }

  async getChildProgress(_childId: string): Promise<ProgressSummary> {
    return { total: 0, correct: 0, bySubject: {} };
  }

  async listSessions(_limit: number): Promise<SessionSummary[]> {
    return [];
  }

  async getSessionDetail(_id: string): Promise<SessionDetail | null> {
    return null;
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
