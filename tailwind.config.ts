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
        // 見出し＝学齢テーマの --font-display（小=明朝 / 中高=ゴシック）
        serif: [
          "var(--font-display)",
          "var(--font-serif)",
          "Hiragino Mincho ProN",
          "serif",
        ],
        rounded: [
          "var(--font-rounded)",
          "Hiragino Maru Gothic ProN",
          "ヒラギノ丸ゴ ProN",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // 意味トークンは学齢テーマの CSS 変数を参照（<html data-stage> で再スキン）
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        paper2: "rgb(var(--c-paper2) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        "ink-soft": "rgb(var(--c-ink-soft) / <alpha-value>)",
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        // 既定の sky-50〜950 スケールは保ちつつ、素の `sky` はテーマ主色に
        sky: { ...colors.sky, DEFAULT: "rgb(var(--c-primary) / <alpha-value>)" },
        "sky-soft": "#e3edf6",
        terra: "rgb(var(--c-accent) / <alpha-value>)", // テーマのアクセント
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
