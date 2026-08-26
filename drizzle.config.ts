import type { Config } from "drizzle-kit";

// Phase 0: ローカルSQLiteフォールバック用。
// Supabase/Postgres へ移行する際は dialect と dbCredentials を差し替える。
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.SQLITE_PATH ?? "./data/ai-sensei.db",
  },
} satisfies Config;
