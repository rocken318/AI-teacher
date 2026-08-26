/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 はネイティブモジュール、postgres は動的 import するため、
  // サーバー側でバンドルせず external 扱いにする（Vercel でのバンドル/ネイティブ問題を回避）
  serverExternalPackages: ["better-sqlite3", "postgres"],
};

export default nextConfig;
