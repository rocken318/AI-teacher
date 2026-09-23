import type { Stage } from "@/lib/stage";

/** 学齢別のコピー（小=ひらがな親しみ／中=標準／高=簡潔な敬体）。/today と /progress/day で共有。 */
export interface TodayCopy {
  praiseZero: string;
  praiseHigh: string;
  praiseMid: string;
  solved: string;
  accuracy: string;
  testPrefix: string;
  parentLink: string;
  unitsTitle: string;
  mistakesTitle: string;
  noMistakes: string;
}

export const TODAY_COPY: Record<Stage, TodayCopy> = {
  elementary: {
    praiseZero: "きょうも いつでも どうぞ",
    praiseHigh: "すごい！よくできてるね",
    praiseMid: "いいちょうし！つづけよう",
    solved: "きょう といた もんだい",
    accuracy: "せいかい率",
    testPrefix: "きょうは テストを",
    parentLink: "おうちの人のページ",
    unitsTitle: "きょう やった たんげん",
    mistakesTitle: "きょう まちがえた もんだい",
    noMistakes: "きょうの まちがいは ないよ",
  },
  junior: {
    praiseZero: "今日はいつでもどうぞ",
    praiseHigh: "よくできています",
    praiseMid: "この調子で続けよう",
    solved: "今日解いた問題",
    accuracy: "正答率",
    testPrefix: "今日はテストを",
    parentLink: "保護者ページ",
    unitsTitle: "今日やった単元",
    mistakesTitle: "今日まちがえた問題",
    noMistakes: "今日のまちがいはありません",
  },
  senior: {
    praiseZero: "今日の学習を始めましょう",
    praiseHigh: "好調です",
    praiseMid: "この調子で続けましょう",
    solved: "今日解いた問題数",
    accuracy: "正答率",
    testPrefix: "今日のテスト",
    parentLink: "保護者ページ",
    unitsTitle: "今日取り組んだ単元",
    mistakesTitle: "今日まちがえた問題",
    noMistakes: "今日のまちがいはありません",
  },
};
