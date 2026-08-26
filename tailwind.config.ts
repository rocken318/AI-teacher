import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        rounded: [
          "Hiragino Maru Gothic ProN",
          "ヒラギノ丸ゴ ProN",
          "Zen Maru Gothic",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
