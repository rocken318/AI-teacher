import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

// 見出し・ロゴ：知的で凛とした明朝（lp.html と同じ路線）
const shippori = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

// 本文：やわらかく読みやすいゴシック
const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

// こども向けの温かみ：丸ゴシック（アクセント用途）
const zenMaru = Zen_Maru_Gothic({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-rounded",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI先生 — こたえは、おしえない。",
  description:
    "小1〜高3。答えを教えず、問い返しで子ども自身に考えさせる。安心して使わせられる、探究のための生成AI先生。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${shippori.variable} ${zenKaku.variable} ${zenMaru.variable}`}
    >
      <head>
        {/* 記憶した学齢テーマを描画前に適用（ちらつき防止）。既定は小学生。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('ai-sensei-stage-v1');if(s==='junior'||s==='senior'){document.documentElement.dataset.stage=s}}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
