/**
 * 学年プロファイル（4.2 学年パラメータ化）
 *
 * 対話エンジンは学年に依存しない。学年ごとの違いはこの GradeProfile として
 * データで注入する。新しい学年の追加は「プロファイルを足す」だけで済むようにする。
 *
 * Phase 0 では「小1-3」固定で対話に注入する。エンジン側は profile を受け取るだけで、
 * 学年ごとの分岐を持たない構造にしておく（後で足すだけで拡張できる）。
 */

export type GradeBand = "小1-3" | "小4-6" | "中" | "高";

export interface GradeProfile {
  /** 学年帯 */
  gradeBand: GradeBand;
  /** 語彙のやさしさ（ひらがな寄り〜抽象語OK） */
  vocabularyLevel: "ひらがな寄り" | "やさしい漢字" | "標準" | "抽象語OK";
  /** 一文の長さ・情報量 */
  sentenceLength: "とても短い" | "短い" | "標準" | "長め";
  /** どこまで自力に委ねるか（足場の量）。high=足場多め・強く導く */
  strictness: "high" | "medium" | "low";
  /** モデレーションの厳しさ。high=最も厳しい */
  safetyLevel: "high" | "medium" | "low";
}

/**
 * 学年プロファイルの定義集。
 * Phase 0 では小1-3のみ実データを持つ（他学年は Phase 2/4 で実体化）。
 */
export const GRADE_PROFILES: Record<GradeBand, GradeProfile> = {
  "小1-3": {
    gradeBand: "小1-3",
    vocabularyLevel: "ひらがな寄り",
    sentenceLength: "とても短い",
    strictness: "high",
    safetyLevel: "high",
  },
  "小4-6": {
    gradeBand: "小4-6",
    vocabularyLevel: "やさしい漢字",
    sentenceLength: "短い",
    strictness: "medium",
    safetyLevel: "high",
  },
  中: {
    gradeBand: "中",
    vocabularyLevel: "標準",
    sentenceLength: "標準",
    strictness: "medium",
    safetyLevel: "medium",
  },
  高: {
    gradeBand: "高",
    vocabularyLevel: "抽象語OK",
    sentenceLength: "長め",
    strictness: "low",
    safetyLevel: "medium",
  },
};

/** Phase 0 で使う固定プロファイル */
export const DEFAULT_GRADE_PROFILE: GradeProfile = GRADE_PROFILES["小1-3"];

/** 学年帯の一覧（UIのセレクタ順など） */
export const GRADE_BANDS: GradeBand[] = ["小1-3", "小4-6", "中", "高"];

/** 学年帯からプロファイルを取得する */
export function getProfile(band: GradeBand): GradeProfile {
  return GRADE_PROFILES[band];
}
