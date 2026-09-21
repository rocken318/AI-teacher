// 語彙パック: TOEIC500 バンド（v1・約60語）。
//
// これは「データ」であり、問題文・選択肢・採点は build.ts が決定的に生成する。
// ここを1行足すだけで1問増える。将来 TOEIC600/730/800 は別パックを足す。
//
// キュレーションの肝（別解成立を避ける）:
// - ja は「1義に絞ったきれいな日本語」。同一バンド内で ja が重複しないようにする。
// - 意味が近すぎる語は品詞や訳語を変えて弁別する（例 customer=客 / client=取引先）。

import type { VocabEntry, VocabUnitMeta } from "./types";

export const TOEIC500_UNITS: VocabUnitMeta[] = [
  {
    unit: 1,
    title: "基礎動詞（TOEIC500・その1）",
    lesson:
      "日常会話やビジネスでよく使う基礎動詞。英語→日本語の意味を4択でおぼえよう。誤答は他の語の実在の意味なので、いっしょに語彙を増やせるよ。",
  },
  {
    unit: 2,
    title: "基礎名詞・形容詞（TOEIC500・その2）",
    lesson:
      "会話やビジネスの土台になる名詞・形容詞。意味が近い語とのちがいに気をつけて正確におぼえよう。",
  },
  {
    unit: 3,
    title: "ビジネス基礎語（TOEIC500・その3）",
    lesson:
      "職場・取引でよく出るビジネス基礎語。契約・支払い・配送まわりの必須語を4択でおぼえよう。",
  },
];

export const TOEIC500_VOCAB: VocabEntry[] = [
  // ===== ユニット1: 基礎動詞 =====
  { word: "achieve", pos: "動", ja: "達成する", example: "achieve a goal（目標を達成する）", unit: 1 },
  { word: "increase", pos: "動", ja: "増やす", example: "increase sales（売上を増やす）", unit: 1 },
  { word: "reduce", pos: "動", ja: "減らす", example: "reduce costs（コストを減らす）", unit: 1 },
  { word: "provide", pos: "動", ja: "提供する", example: "provide information（情報を提供する）", unit: 1 },
  { word: "require", pos: "動", ja: "必要とする", example: "require experience（経験を必要とする）", unit: 1 },
  { word: "allow", pos: "動", ja: "許可する", example: "allow smoking（喫煙を許可する）", unit: 1 },
  { word: "prepare", pos: "動", ja: "準備する", example: "prepare for a meeting（会議の準備をする）", unit: 1 },
  { word: "improve", pos: "動", ja: "改善する", example: "improve quality（品質を改善する）", unit: 1 },
  { word: "avoid", pos: "動", ja: "避ける", example: "avoid mistakes（ミスを避ける）", unit: 1 },
  { word: "decide", pos: "動", ja: "決める", example: "decide to go（行くことを決める）", unit: 1 },
  { word: "receive", pos: "動", ja: "受け取る", example: "receive an email（メールを受け取る）", unit: 1 },
  { word: "explain", pos: "動", ja: "説明する", example: "explain the rules（ルールを説明する）", unit: 1 },
  { word: "suggest", pos: "動", ja: "提案する", example: "suggest a plan（案を提案する）", unit: 1 },
  { word: "accept", pos: "動", ja: "受け入れる", example: "accept an offer（申し出を受け入れる）", unit: 1 },
  { word: "complete", pos: "動", ja: "完成させる", example: "complete the task（作業を完了させる）", unit: 1 },
  { word: "continue", pos: "動", ja: "続ける", example: "continue working（働き続ける）", unit: 1 },
  { word: "return", pos: "動", ja: "戻る", example: "return home（帰宅する）", unit: 1 },
  { word: "attend", pos: "動", ja: "出席する", example: "attend a meeting（会議に出席する）", unit: 1 },
  { word: "compare", pos: "動", ja: "比較する", example: "compare prices（値段を比べる）", unit: 1 },
  { word: "maintain", pos: "動", ja: "維持する", example: "maintain quality（品質を維持する）", unit: 1 },

  // ===== ユニット2: 基礎名詞・形容詞 =====
  { word: "customer", pos: "名", ja: "客", example: "a regular customer（常連客）", unit: 2 },
  { word: "product", pos: "名", ja: "製品", example: "a new product（新製品）", unit: 2 },
  { word: "meeting", pos: "名", ja: "会議", example: "hold a meeting（会議を開く）", unit: 2 },
  { word: "price", pos: "名", ja: "価格", example: "a low price（安い値段）", unit: 2 },
  { word: "employee", pos: "名", ja: "従業員", example: "a full-time employee（正社員）", unit: 2 },
  { word: "schedule", pos: "名", ja: "予定", example: "a busy schedule（忙しい予定）", unit: 2 },
  { word: "available", pos: "形", ja: "利用できる", example: "Tickets are available.（チケットは入手できる）", unit: 2 },
  { word: "expensive", pos: "形", ja: "高価な", example: "an expensive car（高い車）", unit: 2 },
  { word: "important", pos: "形", ja: "重要な", example: "an important decision（重要な決定）", unit: 2 },
  { word: "difficult", pos: "形", ja: "難しい", example: "a difficult question（難しい問題）", unit: 2 },
  { word: "information", pos: "名", ja: "情報", example: "useful information（役立つ情報）", unit: 2 },
  { word: "experience", pos: "名", ja: "経験", example: "work experience（職務経験）", unit: 2 },
  { word: "convenient", pos: "形", ja: "便利な", example: "a convenient location（便利な場所）", unit: 2 },
  { word: "several", pos: "形", ja: "いくつかの", example: "several times（数回）", unit: 2 },
  { word: "recent", pos: "形", ja: "最近の", example: "recent news（最近のニュース）", unit: 2 },
  { word: "similar", pos: "形", ja: "似ている", example: "a similar design（似たデザイン）", unit: 2 },
  { word: "necessary", pos: "形", ja: "必要な", example: "necessary documents（必要な書類）", unit: 2 },
  { word: "quality", pos: "名", ja: "品質", example: "high quality（高品質）", unit: 2 },
  { word: "advice", pos: "名", ja: "助言", example: "good advice（よい助言）", unit: 2 },
  { word: "popular", pos: "形", ja: "人気のある", example: "a popular restaurant（人気の店）", unit: 2 },

  // ===== ユニット3: ビジネス基礎語 =====
  { word: "company", pos: "名", ja: "会社", example: "a large company（大企業）", unit: 3 },
  { word: "contract", pos: "名", ja: "契約", example: "sign a contract（契約を結ぶ）", unit: 3 },
  { word: "budget", pos: "名", ja: "予算", example: "a tight budget（限られた予算）", unit: 3 },
  { word: "invoice", pos: "名", ja: "請求書", example: "send an invoice（請求書を送る）", unit: 3 },
  { word: "deadline", pos: "名", ja: "締め切り", example: "meet the deadline（締め切りに間に合う）", unit: 3 },
  { word: "client", pos: "名", ja: "取引先", example: "an important client（重要な取引先）", unit: 3 },
  { word: "department", pos: "名", ja: "部署", example: "the sales department（営業部）", unit: 3 },
  { word: "manager", pos: "名", ja: "管理者", example: "a project manager（プロジェクト管理者）", unit: 3 },
  { word: "salary", pos: "名", ja: "給料", example: "a monthly salary（月給）", unit: 3 },
  { word: "payment", pos: "名", ja: "支払い", example: "make a payment（支払いをする）", unit: 3 },
  { word: "discount", pos: "名", ja: "割引", example: "a 10% discount（10%の割引）", unit: 3 },
  { word: "delivery", pos: "名", ja: "配達", example: "free delivery（送料無料の配達）", unit: 3 },
  { word: "order", pos: "名", ja: "注文", example: "place an order（注文する）", unit: 3 },
  { word: "warehouse", pos: "名", ja: "倉庫", example: "store goods in a warehouse（倉庫に保管する）", unit: 3 },
  { word: "shipment", pos: "名", ja: "出荷", example: "delay the shipment（出荷を遅らせる）", unit: 3 },
  { word: "refund", pos: "名", ja: "返金", example: "request a refund（返金を求める）", unit: 3 },
  { word: "receipt", pos: "名", ja: "領収書", example: "keep the receipt（領収書を保管する）", unit: 3 },
  { word: "supplier", pos: "名", ja: "供給業者", example: "a reliable supplier（信頼できる供給業者）", unit: 3 },
  { word: "negotiation", pos: "名", ja: "交渉", example: "a business negotiation（商談）", unit: 3 },
  { word: "profit", pos: "名", ja: "利益", example: "make a profit（利益を出す）", unit: 3 },
];
