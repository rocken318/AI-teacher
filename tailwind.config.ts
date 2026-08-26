import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // next/font の CSS 変数を主に、環境フォントへフォールバック
        sans: [
          "var(--font-sans)",
          "Hiragino Kaku Gothic ProN",
          "system-ui",
          "sans-serif",
        ],
        serif: ["var(--font-serif)", "Hiragino Mincho ProN", "serif"],
        rounded: [
          "var(--font-rounded)",
          "Hiragino Maru Gothic ProN",
          "ヒラギノ丸ゴ ProN",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // lp.html の世界観に合わせた温かみのある紙色パレット
        paper: "#f7f1e6",
        paper2: "#efe6d4",
        ink: "#20201c",
        "ink-soft": "#585349",
        faint: "#8a8474",
        // 既定の sky-50〜950 スケールを保ちつつ、素の `sky` は独自色にする
        // （page.tsx の bare `text-sky` と、Chat/guardian の `sky-500` 等を両立）
        sky: { ...colors.sky, DEFAULT: "#2f6fb0" },
        "sky-soft": "#e3edf6",
        terra: "#c9622f", // 温かみのアクセント
        line: "#ddd2bd",
      },
      boxShadow: {
        card: "0 30px 60px -34px rgba(40,32,20,.45), 0 2px 0 #fff inset",
        soft: "0 12px 30px -18px rgba(40,32,20,.35)",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
