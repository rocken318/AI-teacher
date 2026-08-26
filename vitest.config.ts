import { defineConfig } from "vitest/config";
import path from "node:path";

// パスエイリアス @/ を tsconfig と揃える。テストは Node 環境で実行。
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
