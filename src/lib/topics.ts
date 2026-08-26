import type { GradeBand } from "@/lib/grade/gradeProfiles";

/**
 * 探究テーマ（Phase 1: テーマ複数化）
 *
 * 各テーマは「答えを直接教えない」ソクラテス型対話の入り口。
 * seedQuestion は挨拶やAIの最初の問いかけの種になる。
 * gradeBands で、どの学年帯に出すかを制御する（難しめのテーマは中・高のみなど）。
 */
export type Topic = {
  id: string;
  title: string;
  /** 対話の入り口となる、子どもへの最初の問いかけの種 */
  seedQuestion: string;
  /** このテーマを出す学年帯 */
  gradeBands: GradeBand[];
};

const ALL: GradeBand[] = ["小1-3", "小4-6", "中", "高"];

export const TOPICS: Topic[] = [
  {
    id: "why-sky-blue",
    title: "なぜ空は青いの？",
    seedQuestion:
      "きみは どうして そらは あおいと おもう？みぢかで あおい ものって なにが あるかな？",
    gradeBands: ALL,
  },
  {
    id: "why-ice-melts",
    title: "なぜ氷はとけて水になるの？",
    seedQuestion:
      "こおりを てのひらに のせると どうなるかな？どうして そうなると おもう？",
    gradeBands: ALL,
  },
  {
    id: "why-moon-changes",
    title: "なぜ月の形はかわるの？",
    seedQuestion:
      "きのうの おつきさまと きょうの おつきさま、おなじ かたちだったかな？どうして かわると おもう？",
    gradeBands: ALL,
  },
  {
    id: "why-rainbow-colors",
    title: "どうして虹は七色なの？",
    seedQuestion:
      "にじは どんな ときに でてくるか、みたこと あるかな？どうして いろが わかれると おもう？",
    // やや抽象度が高いので小4以上に出す
    gradeBands: ["小4-6", "中", "高"],
  },
  {
    id: "why-shadows",
    title: "なぜ影はできるの？",
    seedQuestion:
      "はれた ひに そとに でると、じめんに なにが できるかな？どうして できると おもう？",
    gradeBands: ALL,
  },
  {
    id: "why-leaves-green",
    title: "なぜ葉っぱは緑なの？",
    seedQuestion:
      "はっぱの いろを よく みると、なにいろが おおいかな？どうして その いろだと おもう？",
    // 光合成など踏み込むと難しいため中・高向け
    gradeBands: ["中", "高"],
  },
];

/** id からテーマを取得（無ければ undefined） */
export function getTopic(id: string): Topic | undefined {
  return TOPICS.find((t) => t.id === id);
}
