// 語彙パック: TOEIC500 バンド 追加分（ユニット4〜6・約60語）。
//
// 作り方: ejdict-hand(CC0) を頻度リストで取り込み（scripts/vocab/ingest-ejdict.mjs）、
// その下書きに人手キュレーションを通した確定データ。具体的には辞書の第一義が
// 学習者の語義とズレる箇所を是正し（例 become=なる／build=建てる／capital=首都）、
// 機能語や紛らわしい語を除き、例文・品詞を補った。
//
// 同一バンド内で ja（意味）が重複しないよう、既存60語（pack_toeic500.ts）とも
// 突き合わせて調整済み。

import type { VocabEntry, VocabUnitMeta } from "./types";

export const TOEIC500_B_UNITS: VocabUnitMeta[] = [
  {
    unit: 4,
    title: "頻出動詞（TOEIC500・その4）",
    lesson:
      "頻出の基礎動詞をもう20語。英語→日本語の4択でおぼえよう。誤答は他の語の実在の意味だから、いっしょに語彙が増えるよ。",
  },
  {
    unit: 5,
    title: "頻出名詞（TOEIC500・その5）",
    lesson:
      "会話や読解でよく出る基礎名詞を20語。意味を正確におぼえよう。",
  },
  {
    unit: 6,
    title: "頻出形容詞（TOEIC500・その6）",
    lesson:
      "ものの様子を表す基礎形容詞を20語。反対語もいっしょに意識するとおぼえやすいよ。",
  },
];

export const TOEIC500_B_VOCAB: VocabEntry[] = [
  // ===== ユニット4: 頻出動詞 =====
  { word: "appear", pos: "動", ja: "現れる", example: "appear on stage（舞台に現れる）", unit: 4 },
  { word: "apply", pos: "動", ja: "適用する", example: "apply a rule（規則を適用する）", unit: 4 },
  { word: "argue", pos: "動", ja: "議論する", example: "argue about politics（政治について議論する）", unit: 4 },
  { word: "arrange", pos: "動", ja: "手配する", example: "arrange a meeting（会議を手配する）", unit: 4 },
  { word: "attack", pos: "動", ja: "攻撃する", example: "attack the enemy（敵を攻撃する）", unit: 4 },
  { word: "attempt", pos: "動", ja: "試みる", example: "attempt a new method（新しい方法を試みる）", unit: 4 },
  { word: "attract", pos: "動", ja: "引きつける", example: "attract customers（客を引きつける）", unit: 4 },
  { word: "become", pos: "動", ja: "なる", example: "become a doctor（医者になる）", unit: 4 },
  { word: "begin", pos: "動", ja: "始まる", example: "The show begins.（ショーが始まる）", unit: 4 },
  { word: "believe", pos: "動", ja: "信じる", example: "believe the news（ニュースを信じる）", unit: 4 },
  { word: "borrow", pos: "動", ja: "借りる", example: "borrow a book（本を借りる）", unit: 4 },
  { word: "break", pos: "動", ja: "壊す", example: "break a cup（カップを壊す）", unit: 4 },
  { word: "bring", pos: "動", ja: "持ってくる", example: "bring an umbrella（傘を持ってくる）", unit: 4 },
  { word: "build", pos: "動", ja: "建てる", example: "build a house（家を建てる）", unit: 4 },
  { word: "burn", pos: "動", ja: "燃える", example: "The wood burns.（木が燃える）", unit: 4 },
  { word: "buy", pos: "動", ja: "買う", example: "buy a ticket（切符を買う）", unit: 4 },
  { word: "calculate", pos: "動", ja: "計算する", example: "calculate the cost（費用を計算する）", unit: 4 },
  { word: "call", pos: "動", ja: "呼ぶ", example: "call a taxi（タクシーを呼ぶ）", unit: 4 },
  { word: "carry", pos: "動", ja: "運ぶ", example: "carry a box（箱を運ぶ）", unit: 4 },
  { word: "catch", pos: "動", ja: "捕まえる", example: "catch a ball（ボールを捕まえる）", unit: 4 },

  // ===== ユニット5: 頻出名詞 =====
  { word: "amount", pos: "名", ja: "合計", example: "a large amount（多額）", unit: 5 },
  { word: "anger", pos: "名", ja: "怒り", example: "express anger（怒りを表す）", unit: 5 },
  { word: "answer", pos: "名", ja: "答え", example: "the correct answer（正しい答え）", unit: 5 },
  { word: "arm", pos: "名", ja: "腕", example: "raise your arm（腕を上げる）", unit: 5 },
  { word: "army", pos: "名", ja: "軍隊", example: "join the army（軍隊に入る）", unit: 5 },
  { word: "art", pos: "名", ja: "芸術", example: "modern art（現代芸術）", unit: 5 },
  { word: "article", pos: "名", ja: "記事", example: "a news article（ニュース記事）", unit: 5 },
  { word: "attention", pos: "名", ja: "注意", example: "pay attention（注意を払う）", unit: 5 },
  { word: "audience", pos: "名", ja: "観客", example: "a large audience（大勢の観客）", unit: 5 },
  { word: "average", pos: "名", ja: "平均", example: "on average（平均して）", unit: 5 },
  { word: "battle", pos: "名", ja: "戦闘", example: "win a battle（戦闘に勝つ）", unit: 5 },
  { word: "belief", pos: "名", ja: "信念", example: "a strong belief（強い信念）", unit: 5 },
  { word: "birth", pos: "名", ja: "誕生", example: "the birth of a baby（赤ちゃんの誕生）", unit: 5 },
  { word: "board", pos: "名", ja: "板", example: "a wooden board（木の板）", unit: 5 },
  { word: "body", pos: "名", ja: "身体", example: "a healthy body（健康な身体）", unit: 5 },
  { word: "book", pos: "名", ja: "本", example: "read a book（本を読む）", unit: 5 },
  { word: "branch", pos: "名", ja: "枝", example: "a tree branch（木の枝）", unit: 5 },
  { word: "business", pos: "名", ja: "事業", example: "start a business（事業を始める）", unit: 5 },
  { word: "capital", pos: "名", ja: "首都", example: "the capital of Japan（日本の首都）", unit: 5 },
  { word: "case", pos: "名", ja: "場合", example: "in that case（その場合）", unit: 5 },

  // ===== ユニット6: 頻出形容詞 =====
  { word: "ancient", pos: "形", ja: "古代の", example: "ancient Rome（古代ローマ）", unit: 6 },
  { word: "angry", pos: "形", ja: "怒った", example: "an angry face（怒った顔）", unit: 6 },
  { word: "artificial", pos: "形", ja: "人工の", example: "artificial light（人工の光）", unit: 6 },
  { word: "attractive", pos: "形", ja: "魅力的な", example: "an attractive offer（魅力的な提案）", unit: 6 },
  { word: "bad", pos: "形", ja: "悪い", example: "bad weather（悪い天気）", unit: 6 },
  { word: "best", pos: "形", ja: "最良の", example: "the best choice（最良の選択）", unit: 6 },
  { word: "big", pos: "形", ja: "大きい", example: "a big city（大きな都市）", unit: 6 },
  { word: "bitter", pos: "形", ja: "苦い", example: "bitter coffee（苦いコーヒー）", unit: 6 },
  { word: "black", pos: "形", ja: "黒い", example: "a black cat（黒い猫）", unit: 6 },
  { word: "blind", pos: "形", ja: "目の見えない", example: "a blind man（目の見えない人）", unit: 6 },
  { word: "blue", pos: "形", ja: "青い", example: "a blue sky（青い空）", unit: 6 },
  { word: "bold", pos: "形", ja: "大胆な", example: "a bold plan（大胆な計画）", unit: 6 },
  { word: "brave", pos: "形", ja: "勇敢な", example: "a brave soldier（勇敢な兵士）", unit: 6 },
  { word: "bright", pos: "形", ja: "明るい", example: "a bright room（明るい部屋）", unit: 6 },
  { word: "broad", pos: "形", ja: "幅広い", example: "a broad road（幅広い道）", unit: 6 },
  { word: "busy", pos: "形", ja: "忙しい", example: "a busy day（忙しい一日）", unit: 6 },
  { word: "calm", pos: "形", ja: "穏やかな", example: "a calm sea（穏やかな海）", unit: 6 },
  { word: "basic", pos: "形", ja: "基礎の", example: "basic skills（基礎的な技能）", unit: 6 },
  { word: "brown", pos: "形", ja: "茶色の", example: "brown hair（茶色の髪）", unit: 6 },
  { word: "ambitious", pos: "形", ja: "野心的な", example: "an ambitious plan（野心的な計画）", unit: 6 },
];
