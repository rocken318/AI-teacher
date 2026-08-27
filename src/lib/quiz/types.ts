// 知識クイズ基盤（理科・社会・国語・英語）の共通型定義。
//
// 生成AIは出題・採点・解説に使わない。問題・正解・解説はすべてバンク側で
// authored（人が書いた確定文言）を持ち、コードで確定的に採点する。
//
// バンク（別チーム）と学習UI（ハブ）はこのファイルの export だけに依存する。

/** 対象教科。 */
export type Subject = "science" | "social" | "japanese" | "english";

/** 対象学年。 */
export type QuizGrade = "小4" | "小5" | "小6";

/**
 * 1問（4択などの選択式）。
 * - choices: 選択肢の表示文言（順序どおり）。
 * - answerIndex: 正解の choices インデックス（0始まり）。クライアントには晒さない。
 * - explanation: authored（人が書いた）解説文。AIは使わない＝事実誤りを出さない。
 * - choiceHints: 各選択肢を選んだ子への一言（誤答の勘違いを指摘する短い文）。
 *     choices と同じ長さの配列。正解の index は null でよい。省略可（未設定の
 *     単元は従来どおり explanation にフォールバックする）。AIは使わない＝authored。
 */
export interface QuizItem {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  choiceHints?: (string | null)[];
}

/** 単元（1教科・1学年の中の学習まとまり）。 */
export interface QuizUnit {
  id: string;
  subject: Subject;
  grade: QuizGrade;
  title: string;
  /** 教科書的な短い説明（やさしい日本語）。 */
  lesson: string;
  items: QuizItem[];
}

/**
 * 教科のメタ情報（UI表示用）。
 * accent は Tailwind の色トークン名（例 "emerald"）。ハブがカードやタブの
 * 色に使う。
 */
export interface SubjectMeta {
  key: Subject;
  label: string;
  emoji: string;
  accent: string;
}
