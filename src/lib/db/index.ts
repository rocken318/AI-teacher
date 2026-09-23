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

/** アカウント（保護者）行。 */
export interface AccountRow {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

/** 子ども行。 */
export interface ChildRow {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  createdAt: string;
}

/** テスト結果の保存入力。 */
export interface TestResultInput {
  id: string;
  childId: string;
  subject: string;
  unitIds: string;
  testKey: string;
  total: number;
  score: number;
}

/** テスト結果の履歴1件分。 */
export interface TestResultRow {
  id: string;
  subject: string;
  unitIds: string;
  testKey: string;
  total: number;
  score: number;
  takenAt: string;
}

/** attempts 1 行（進捗集計用・created_at は UTC エポックms）。 */
export interface AttemptRow {
  subject: string;
  unitId: string;
  correct: boolean;
  createdAtMs: number;
}

/** test_results 1 行（進捗集計用・taken_at は UTC エポックms）。 */
export interface TestResultFullRow {
  subject: string;
  testKey: string;
  total: number;
  score: number;
  takenAtMs: number;
}

/** まちがいノート 1件の保存入力。 */
export interface MistakeInput {
  id: string;
  childId: string;
  subject: string;
  unitId: string;
  kind: "quiz" | "math";
  itemId: string | null; // quiz のとき item id
  problem: string | null; // math のとき問題JSON（{prompt,answer,answerType,meta}）
}

/** まちがいノート 1件の行。 */
export interface MistakeRow {
  id: string;
  subject: string;
  unitId: string;
  kind: "quiz" | "math";
  itemId: string | null;
  problem: string | null;
  createdAt: string;
  /** created_at を UTC エポックms に正規化（今日抽出用・バックエンド差を吸収）。 */
  createdAtMs: number;
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
    source: string,
  ): Promise<void>;
  getChildProgress(childId: string): Promise<ProgressSummary>;
  /** 進捗集計用: その子の全 attempts（created_at 昇順・UTC エポックms）。 */
  listAttempts(childId: string): Promise<AttemptRow[]>;
  /** 進捗集計用: その子の全 test_results（taken_at 昇順・UTC エポックms）。 */
  listTestResults(childId: string): Promise<TestResultFullRow[]>;

  /* --- まちがいノート --- */
  addMistake(input: MistakeInput): Promise<void>;
  listMistakes(childId: string, limit: number): Promise<MistakeRow[]>;
  countMistakes(childId: string): Promise<number>;
  removeMistake(childId: string, mistakeId: string): Promise<void>;

  /* --- テスト結果（テストモード） --- */
  recordTestResult(input: TestResultInput): Promise<void>;
  getTestHistory(
    childId: string,
    testKey: string,
    limit: number,
  ): Promise<TestResultRow[]>;

  /* --- 学習記録の付け替え（引き継ぎ） --- */
  reassignChildData(fromChildId: string, toChildId: string): Promise<void>;

  /* --- 設定（key/value）。見守りパスコードのハッシュ保存などに使う --- */
  getConfig(key: string): Promise<string | null>;
  setConfig(key: string, value: string): Promise<void>;

  /* --- アカウント／子ども --- */
  createAccount(id: string, email: string, passwordHash: string): Promise<void>;
  getAccountByEmail(email: string): Promise<AccountRow | null>;
  getAccountById(id: string): Promise<AccountRow | null>;
  createChild(
    id: string,
    accountId: string,
    name: string,
    stage: string,
  ): Promise<void>;
  listChildren(accountId: string): Promise<ChildRow[]>;
  getChild(id: string): Promise<ChildRow | null>;

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
    this.sql = postgres(databaseUrl, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
    });

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
    await this
      .sql`ALTER TABLE attempts ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'practice'`;
    await this.sql`
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_ids TEXT NOT NULL,
        test_key TEXT NOT NULL,
        total INTEGER NOT NULL,
        score INTEGER NOT NULL,
        taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this
      .sql`CREATE INDEX IF NOT EXISTS test_results_key_idx ON test_results (child_id, test_key, taken_at)`;
    await this.sql`
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await this.sql`CREATE TABLE IF NOT EXISTS children (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, name TEXT NOT NULL, stage TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await this.sql`CREATE INDEX IF NOT EXISTS children_account_idx ON children (account_id)`;
    await this.sql`
      CREATE TABLE IF NOT EXISTS mistakes (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        item_id TEXT,
        problem TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await this.sql`CREATE INDEX IF NOT EXISTS mistakes_child_idx ON mistakes (child_id)`;
  }

  async createAccount(
    id: string,
    email: string,
    passwordHash: string,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO accounts (id, email, password_hash)
      VALUES (${id}, ${email}, ${passwordHash})
    `;
  }

  async getAccountByEmail(email: string): Promise<AccountRow | null> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, email, password_hash, created_at
      FROM accounts
      WHERE email = ${email}
      LIMIT 1
    `;
    const r = (rows as any[])[0];
    if (!r) return null;
    return {
      id: String(r.id),
      email: String(r.email),
      passwordHash: String(r.password_hash),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    };
  }

  async getAccountById(id: string): Promise<AccountRow | null> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, email, password_hash, created_at
      FROM accounts
      WHERE id = ${id}
      LIMIT 1
    `;
    const r = (rows as any[])[0];
    if (!r) return null;
    return {
      id: String(r.id),
      email: String(r.email),
      passwordHash: String(r.password_hash),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    };
  }

  async createChild(
    id: string,
    accountId: string,
    name: string,
    stage: string,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO children (id, account_id, name, stage)
      VALUES (${id}, ${accountId}, ${name}, ${stage})
    `;
  }

  async listChildren(accountId: string): Promise<ChildRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, account_id, name, stage, created_at
      FROM children
      WHERE account_id = ${accountId}
      ORDER BY created_at ASC
    `;
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      accountId: String(r.account_id),
      name: String(r.name),
      stage: String(r.stage),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    }));
  }

  async getChild(id: string): Promise<ChildRow | null> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, account_id, name, stage, created_at
      FROM children
      WHERE id = ${id}
      LIMIT 1
    `;
    const r = (rows as any[])[0];
    if (!r) return null;
    return {
      id: String(r.id),
      accountId: String(r.account_id),
      name: String(r.name),
      stage: String(r.stage),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    };
  }

  async getConfig(key: string): Promise<string | null> {
    await this.ready;
    const rows = await this.sql`
      SELECT value FROM app_config WHERE key = ${key} LIMIT 1
    `;
    const r = (rows as any[])[0];
    return r ? String(r.value) : null;
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO app_config (key, value, updated_at)
      VALUES (${key}, ${value}, now())
      ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()
    `;
  }

  async recordAttempt(
    id: string,
    childId: string,
    subject: string,
    unitId: string,
    correct: boolean,
    source: string,
  ): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO attempts (id, child_id, subject, unit_id, correct, source)
      VALUES (${id}, ${childId}, ${subject}, ${unitId}, ${correct}, ${source})
    `;
  }

  async recordTestResult(input: TestResultInput): Promise<void> {
    await this.ready;
    await this.sql`
      INSERT INTO test_results (id, child_id, subject, unit_ids, test_key, total, score)
      VALUES (${input.id}, ${input.childId}, ${input.subject}, ${input.unitIds}, ${input.testKey}, ${input.total}, ${input.score})
    `;
  }

  async getTestHistory(
    childId: string,
    testKey: string,
    limit: number,
  ): Promise<TestResultRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, subject, unit_ids, test_key, total, score, taken_at
      FROM test_results
      WHERE child_id = ${childId} AND test_key = ${testKey}
      ORDER BY taken_at DESC
      LIMIT ${limit}
    `;
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      unitIds: String(r.unit_ids),
      testKey: String(r.test_key),
      total: Number(r.total ?? 0),
      score: Number(r.score ?? 0),
      takenAt: r.taken_at == null ? "" : String(r.taken_at),
    }));
  }

  async reassignChildData(fromChildId: string, toChildId: string): Promise<void> {
    await this.ready;
    await this.sql`UPDATE attempts SET child_id = ${toChildId} WHERE child_id = ${fromChildId}`;
    await this.sql`UPDATE test_results SET child_id = ${toChildId} WHERE child_id = ${fromChildId}`;
    await this.sql`UPDATE mistakes SET child_id = ${toChildId} WHERE child_id = ${fromChildId}`;
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

  async listAttempts(childId: string): Promise<AttemptRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT subject, unit_id, correct,
             (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_ms
      FROM attempts
      WHERE child_id = ${childId}
      ORDER BY created_at ASC, id ASC
    `;
    return (rows as any[]).map((r) => ({
      subject: String(r.subject),
      unitId: String(r.unit_id),
      correct: Boolean(r.correct),
      createdAtMs: Number(r.created_ms ?? 0),
    }));
  }

  async listTestResults(childId: string): Promise<TestResultFullRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT subject, test_key, total, score,
             (EXTRACT(EPOCH FROM taken_at) * 1000)::bigint AS taken_ms
      FROM test_results
      WHERE child_id = ${childId}
      ORDER BY taken_at ASC, id ASC
    `;
    return (rows as any[]).map((r) => ({
      subject: String(r.subject),
      testKey: String(r.test_key),
      total: Number(r.total ?? 0),
      score: Number(r.score ?? 0),
      takenAtMs: Number(r.taken_ms ?? 0),
    }));
  }

  async addMistake(input: MistakeInput): Promise<void> {
    await this.ready;
    // 重複防止: quiz は (child, unit, item)、math は (child, unit, problem)。
    const dup = input.kind === "quiz"
      ? await this.sql`SELECT 1 FROM mistakes WHERE child_id=${input.childId} AND unit_id=${input.unitId} AND kind='quiz' AND item_id=${input.itemId} LIMIT 1`
      : await this.sql`SELECT 1 FROM mistakes WHERE child_id=${input.childId} AND unit_id=${input.unitId} AND kind='math' AND problem=${input.problem} LIMIT 1`;
    if ((dup as any[]).length > 0) return;
    await this.sql`
      INSERT INTO mistakes (id, child_id, subject, unit_id, kind, item_id, problem)
      VALUES (${input.id}, ${input.childId}, ${input.subject}, ${input.unitId}, ${input.kind}, ${input.itemId}, ${input.problem})
    `;
  }

  async listMistakes(childId: string, limit: number): Promise<MistakeRow[]> {
    await this.ready;
    const rows = await this.sql`
      SELECT id, subject, unit_id, kind, item_id, problem, created_at,
             (EXTRACT(EPOCH FROM created_at) * 1000)::bigint AS created_ms
      FROM mistakes WHERE child_id = ${childId}
      ORDER BY created_at DESC, id DESC LIMIT ${limit}
    `;
    return (rows as any[]).map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      unitId: String(r.unit_id),
      kind: (String(r.kind) === "math" ? "math" : "quiz") as "quiz" | "math",
      itemId: r.item_id == null ? null : String(r.item_id),
      problem: r.problem == null ? null : String(r.problem),
      createdAt: r.created_at == null ? "" : String(r.created_at),
      createdAtMs: Number(r.created_ms ?? 0),
    }));
  }

  async countMistakes(childId: string): Promise<number> {
    await this.ready;
    const rows = await this.sql`SELECT COUNT(*) AS n FROM mistakes WHERE child_id = ${childId}`;
    return Number((rows as any[])[0]?.n ?? 0);
  }

  async removeMistake(childId: string, mistakeId: string): Promise<void> {
    await this.ready;
    await this.sql`DELETE FROM mistakes WHERE id = ${mistakeId} AND child_id = ${childId}`;
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
  private sqlitePath: string;
  // better-sqlite3 の Database コンストラクタ（動的 import 後にキャッシュ）。
  private Database: any;
  private ready: Promise<void>;

  constructor(sqlitePath: string) {
    this.sqlitePath = sqlitePath;
    this.ready = this.init(sqlitePath);
  }

  /**
   * 1操作ごとに接続を開き、コールバック後に必ず close する。
   *
   * 永続接続を保持すると Windows ではファイルハンドルがロックされ、
   * テストの一時DB削除（rmSync）が EBUSY で失敗する。ローカル専用・低トラフィックの
   * Store なので、都度 open/close でも実用上問題ない。
   */
  private withDb<T>(fn: (db: any) => T): T {
    const db = new this.Database(this.sqlitePath);
    try {
      // WAL は付けない。都度 open/close では利点が無く、-wal/-shm のサイドカーが
      // Windows でロック要因になり EBUSY を招く（既定の DELETE ジャーナルのまま使う）。
      // 近接した同時書き込みでの SQLITE_BUSY を避けるための安全策のみ設定する。
      db.pragma("busy_timeout = 3000");
      return fn(db);
    } finally {
      db.close();
    }
  }

  private async init(sqlitePath: string): Promise<void> {
    const { existsSync, mkdirSync } = await import("node:fs");
    const mod = await import("better-sqlite3");
    const Database = (mod as any).default ?? mod;
    this.Database = Database;

    const dir = path.dirname(sqlitePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const sqlite = new Database(sqlitePath);
    // WAL は使わない（都度 open/close 方針・Windows のサイドカーロック回避）。
    sqlite.pragma("busy_timeout = 3000");

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
        source TEXT NOT NULL DEFAULT 'practice',
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE INDEX IF NOT EXISTS attempts_child_idx ON attempts (child_id);
      CREATE TABLE IF NOT EXISTS app_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE TABLE IF NOT EXISTS test_results (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_ids TEXT NOT NULL,
        test_key TEXT NOT NULL,
        total INTEGER NOT NULL,
        score INTEGER NOT NULL,
        taken_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE INDEX IF NOT EXISTS test_results_key_idx ON test_results (child_id, test_key, taken_at);
      CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP));
      CREATE TABLE IF NOT EXISTS children (id TEXT PRIMARY KEY, account_id TEXT NOT NULL, name TEXT NOT NULL, stage TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP));
      CREATE INDEX IF NOT EXISTS children_account_idx ON children (account_id);
      CREATE TABLE IF NOT EXISTS mistakes (
        id TEXT PRIMARY KEY,
        child_id TEXT NOT NULL,
        subject TEXT NOT NULL,
        unit_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        item_id TEXT,
        problem TEXT,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
      CREATE INDEX IF NOT EXISTS mistakes_child_idx ON mistakes (child_id);
    `);

    // 既存DB（source 列が無い）への冪等マイグレーション（レガシーDB用なので別 exec）。
    const cols = sqlite.prepare(`PRAGMA table_info(attempts)`).all() as any[];
    if (!cols.some((c) => c.name === "source")) {
      sqlite.exec(
        `ALTER TABLE attempts ADD COLUMN source TEXT NOT NULL DEFAULT 'practice'`,
      );
    }

    // スキーマ作成用の接続は都度 open/close 方針に合わせてここで閉じる。
    sqlite.close();
  }

  async getConfig(key: string): Promise<string | null> {
    await this.ready;
    return this.withDb((db) => {
      const r = db
        .prepare("SELECT value FROM app_config WHERE key = ? LIMIT 1")
        .get(key) as any;
      return r ? String(r.value) : null;
    });
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO app_config (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) " +
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP",
        )
        .run(key, value),
    );
  }

  async createAccount(
    id: string,
    email: string,
    passwordHash: string,
  ): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO accounts (id, email, password_hash) VALUES (?, ?, ?)",
        )
        .run(id, email, passwordHash),
    );
  }

  async getAccountByEmail(email: string): Promise<AccountRow | null> {
    await this.ready;
    return this.withDb((db) => {
      const r = db
        .prepare(
          "SELECT id, email, password_hash, created_at FROM accounts WHERE email = ? LIMIT 1",
        )
        .get(email) as any;
      if (!r) return null;
      return {
        id: String(r.id),
        email: String(r.email),
        passwordHash: String(r.password_hash),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      };
    });
  }

  async getAccountById(id: string): Promise<AccountRow | null> {
    await this.ready;
    return this.withDb((db) => {
      const r = db
        .prepare(
          "SELECT id, email, password_hash, created_at FROM accounts WHERE id = ? LIMIT 1",
        )
        .get(id) as any;
      if (!r) return null;
      return {
        id: String(r.id),
        email: String(r.email),
        passwordHash: String(r.password_hash),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      };
    });
  }

  async createChild(
    id: string,
    accountId: string,
    name: string,
    stage: string,
  ): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO children (id, account_id, name, stage) VALUES (?, ?, ?, ?)",
        )
        .run(id, accountId, name, stage),
    );
  }

  async listChildren(accountId: string): Promise<ChildRow[]> {
    await this.ready;
    const rows = this.withDb(
      (db) =>
        db
          .prepare(
            `SELECT id, account_id, name, stage, created_at
             FROM children
             WHERE account_id = ?
             ORDER BY created_at ASC, rowid ASC`,
          )
          .all(accountId) as any[],
    );
    return rows.map((r) => ({
      id: String(r.id),
      accountId: String(r.account_id),
      name: String(r.name),
      stage: String(r.stage),
      createdAt: r.created_at == null ? "" : String(r.created_at),
    }));
  }

  async getChild(id: string): Promise<ChildRow | null> {
    await this.ready;
    return this.withDb((db) => {
      const r = db
        .prepare(
          "SELECT id, account_id, name, stage, created_at FROM children WHERE id = ? LIMIT 1",
        )
        .get(id) as any;
      if (!r) return null;
      return {
        id: String(r.id),
        accountId: String(r.account_id),
        name: String(r.name),
        stage: String(r.stage),
        createdAt: r.created_at == null ? "" : String(r.created_at),
      };
    });
  }

  async recordAttempt(
    id: string,
    childId: string,
    subject: string,
    unitId: string,
    correct: boolean,
    source: string,
  ): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO attempts (id, child_id, subject, unit_id, correct, source) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(id, childId, subject, unitId, correct ? 1 : 0, source),
    );
  }

  async recordTestResult(input: TestResultInput): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO test_results (id, child_id, subject, unit_ids, test_key, total, score) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          input.id,
          input.childId,
          input.subject,
          input.unitIds,
          input.testKey,
          input.total,
          input.score,
        ),
    );
  }

  async getTestHistory(
    childId: string,
    testKey: string,
    limit: number,
  ): Promise<TestResultRow[]> {
    await this.ready;
    const rows = this.withDb(
      (db) =>
        db
          .prepare(
            `SELECT id, subject, unit_ids, test_key, total, score, taken_at
             FROM test_results
             WHERE child_id = ? AND test_key = ?
             ORDER BY taken_at DESC, rowid DESC
             LIMIT ?`,
          )
          .all(childId, testKey, limit) as any[],
    );
    return rows.map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      unitIds: String(r.unit_ids),
      testKey: String(r.test_key),
      total: Number(r.total ?? 0),
      score: Number(r.score ?? 0),
      takenAt: r.taken_at == null ? "" : String(r.taken_at),
    }));
  }

  async reassignChildData(fromChildId: string, toChildId: string): Promise<void> {
    await this.ready;
    this.withDb((db) => {
      db.prepare("UPDATE attempts SET child_id = ? WHERE child_id = ?").run(
        toChildId,
        fromChildId,
      );
      db.prepare("UPDATE test_results SET child_id = ? WHERE child_id = ?").run(
        toChildId,
        fromChildId,
      );
      db.prepare("UPDATE mistakes SET child_id = ? WHERE child_id = ?").run(
        toChildId,
        fromChildId,
      );
    });
  }

  async getChildProgress(childId: string): Promise<ProgressSummary> {
    await this.ready;
    const rows = this.withDb((db) =>
      db
        .prepare(
          "SELECT subject, COUNT(*) AS attempts, SUM(correct) AS correct FROM attempts WHERE child_id = ? GROUP BY subject",
        )
        .all(childId),
    );
    return aggregateProgress(
      (rows as any[]).map((r) => ({
        subject: String(r.subject),
        attempts: Number(r.attempts ?? 0),
        correct: Number(r.correct ?? 0),
      })),
    );
  }

  async listAttempts(childId: string): Promise<AttemptRow[]> {
    await this.ready;
    // strftime('%s') は UTC 秒（小数切り捨て）。日付バケット/並び順には十分（同秒の並びは rowid で確定）。
    const rows = this.withDb(
      (db) =>
        db
          .prepare(
            `SELECT subject, unit_id, correct,
                    CAST(strftime('%s', created_at) AS INTEGER) * 1000 AS created_ms
             FROM attempts
             WHERE child_id = ?
             ORDER BY created_at ASC, rowid ASC`,
          )
          .all(childId) as any[],
    );
    return rows.map((r) => ({
      subject: String(r.subject),
      unitId: String(r.unit_id),
      correct: Number(r.correct) === 1,
      createdAtMs: Number(r.created_ms ?? 0),
    }));
  }

  async listTestResults(childId: string): Promise<TestResultFullRow[]> {
    await this.ready;
    // strftime('%s') は UTC 秒（小数切り捨て）。日付バケット/並び順には十分（同秒の並びは rowid で確定）。
    const rows = this.withDb(
      (db) =>
        db
          .prepare(
            `SELECT subject, test_key, total, score,
                    CAST(strftime('%s', taken_at) AS INTEGER) * 1000 AS taken_ms
             FROM test_results
             WHERE child_id = ?
             ORDER BY taken_at ASC, rowid ASC`,
          )
          .all(childId) as any[],
    );
    return rows.map((r) => ({
      subject: String(r.subject),
      testKey: String(r.test_key),
      total: Number(r.total ?? 0),
      score: Number(r.score ?? 0),
      takenAtMs: Number(r.taken_ms ?? 0),
    }));
  }

  async addMistake(input: MistakeInput): Promise<void> {
    await this.ready;
    this.withDb((db) => {
      const dup = input.kind === "quiz"
        ? db.prepare("SELECT 1 FROM mistakes WHERE child_id=? AND unit_id=? AND kind='quiz' AND item_id=? LIMIT 1").get(input.childId, input.unitId, input.itemId)
        : db.prepare("SELECT 1 FROM mistakes WHERE child_id=? AND unit_id=? AND kind='math' AND problem=? LIMIT 1").get(input.childId, input.unitId, input.problem);
      if (dup) return;
      db.prepare("INSERT INTO mistakes (id, child_id, subject, unit_id, kind, item_id, problem) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(input.id, input.childId, input.subject, input.unitId, input.kind, input.itemId, input.problem);
    });
  }

  async listMistakes(childId: string, limit: number): Promise<MistakeRow[]> {
    await this.ready;
    const rows = this.withDb((db) =>
      db.prepare(`SELECT id, subject, unit_id, kind, item_id, problem, created_at,
                    CAST(strftime('%s', created_at) AS INTEGER) * 1000 AS created_ms
                  FROM mistakes WHERE child_id = ? ORDER BY created_at DESC, rowid DESC LIMIT ?`).all(childId, limit) as any[],
    );
    return rows.map((r) => ({
      id: String(r.id),
      subject: String(r.subject),
      unitId: String(r.unit_id),
      kind: (String(r.kind) === "math" ? "math" : "quiz") as "quiz" | "math",
      itemId: r.item_id == null ? null : String(r.item_id),
      problem: r.problem == null ? null : String(r.problem),
      createdAt: r.created_at == null ? "" : String(r.created_at),
      createdAtMs: Number(r.created_ms ?? 0),
    }));
  }

  async countMistakes(childId: string): Promise<number> {
    await this.ready;
    const r = this.withDb((db) => db.prepare("SELECT COUNT(*) AS n FROM mistakes WHERE child_id = ?").get(childId) as any);
    return Number(r?.n ?? 0);
  }

  async removeMistake(childId: string, mistakeId: string): Promise<void> {
    await this.ready;
    this.withDb((db) => db.prepare("DELETE FROM mistakes WHERE id = ? AND child_id = ?").run(mistakeId, childId));
  }

  async createSession(
    id: string,
    topic: string,
    gradeBand: string,
    topicId?: string,
  ): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO sessions (id, topic, grade_band, topic_id) VALUES (?, ?, ?, ?)",
        )
        .run(id, topic, gradeBand, topicId ?? null),
    );
  }

  async logMessage(
    id: string,
    sessionId: string,
    sender: "child" | "ai",
    text: string,
  ): Promise<void> {
    await this.ready;
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO messages (id, session_id, sender, text) VALUES (?, ?, ?, ?)",
        )
        .run(id, sessionId, sender, text),
    );
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
    this.withDb((db) =>
      db
        .prepare(
          "INSERT INTO moderations (id, session_id, message_id, stage, verdict, reason) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(id, sessionId, messageId, stage, verdict, reason),
    );
  }

  async listSessions(limit: number): Promise<SessionSummary[]> {
    await this.ready;
    const rows = this.withDb(
      (db) =>
        db
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
          .all(limit) as any[],
    );
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
    return this.withDb((db) => {
      const s = db
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

      const messageRows = db
        .prepare(
          `SELECT id, sender, text, created_at
           FROM messages
           WHERE session_id = ?
           ORDER BY created_at ASC`,
        )
        .all(id) as any[];
      const moderationRows = db
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
    });
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
    source: string,
  ): Promise<void> {
    console.debug("[db:noop] recordAttempt", {
      id,
      childId,
      subject,
      unitId,
      correct,
      source,
    });
  }

  async recordTestResult(input: TestResultInput): Promise<void> {
    console.debug("[db:noop] recordTestResult", input);
  }

  async getTestHistory(
    _childId: string,
    _testKey: string,
    _limit: number,
  ): Promise<TestResultRow[]> {
    return [];
  }

  async reassignChildData(): Promise<void> {}

  async getChildProgress(_childId: string): Promise<ProgressSummary> {
    return { total: 0, correct: 0, bySubject: {} };
  }

  async listAttempts(_childId: string): Promise<AttemptRow[]> {
    return [];
  }

  async listTestResults(_childId: string): Promise<TestResultFullRow[]> {
    return [];
  }

  async addMistake(_input: MistakeInput): Promise<void> {}
  async listMistakes(_childId: string, _limit: number): Promise<MistakeRow[]> { return []; }
  async countMistakes(_childId: string): Promise<number> { return 0; }
  async removeMistake(_childId: string, _mistakeId: string): Promise<void> {}

  async getConfig(_key: string): Promise<string | null> {
    return null;
  }

  async setConfig(_key: string, _value: string): Promise<void> {
    // 保存先が無い（Vercel で DATABASE_URL 未設定）。設定は保持できない。
    throw new Error("no-store");
  }

  async createAccount(
    id: string,
    email: string,
    _passwordHash: string,
  ): Promise<void> {
    console.debug("[db:noop] createAccount", { id, email });
  }

  async getAccountByEmail(_email: string): Promise<AccountRow | null> {
    return null;
  }

  async getAccountById(_id: string): Promise<AccountRow | null> {
    return null;
  }

  async createChild(
    id: string,
    accountId: string,
    name: string,
    stage: string,
  ): Promise<void> {
    console.debug("[db:noop] createChild", { id, accountId, name, stage });
  }

  async listChildren(_accountId: string): Promise<ChildRow[]> {
    return [];
  }

  async getChild(_id: string): Promise<ChildRow | null> {
    return null;
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
