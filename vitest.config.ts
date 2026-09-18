import { defineConfig } from "vitest/config";
import path from "node:path";

// パスエイリアス @/ を tsconfig と揃える。テストは Node 環境で実行。
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next.js の `server-only` はテスト(Node)環境では解決できないため空スタブに差し替える。
      "server-only": path.resolve(
        __dirname,
        "node_modules/next/dist/compiled/server-only/empty.js",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
