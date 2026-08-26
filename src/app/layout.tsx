import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI先生 — Phase 0",
  description: "答えを教えず考えを引き出す、子ども向け安全な生成AI探究チューター（walking skeleton）",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-rounded bg-sky-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
