/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 はネイティブモジュールなので、サーバー側でバンドルせず external 扱いにする
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
