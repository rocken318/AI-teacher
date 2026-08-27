/**
 * 学齢モード（小学生 / 中学生 / 高校生）。
 *
 * 1つのアプリの中で、学齢ごとに「皮（デザインテーマ）」と出す内容・語り口を変える。
 * テーマは <html data-stage="..."> を切り替えることで CSS 変数を差し替える方式
 * （globals.css の [data-stage=...] 参照）。値は localStorage に記憶する。
 */

export type Stage = "elementary" | "junior" | "senior";

export interface StageMeta {
  key: Stage;
  label: string; // 例: 小学生
  range: string; // 例: 小1〜6
  emoji: string;
  tagline: string;
}

export const STAGES: StageMeta[] = [
  {
    key: "elementary",
    label: "小学生",
    range: "小1〜6",
    emoji: "🎒",
    tagline: "たのしく まなぼう",
  },
  {
    key: "junior",
    label: "中学生",
    range: "中1〜3",
    emoji: "✏️",
    tagline: "自分のペースで実力アップ",
  },
  {
    key: "senior",
    label: "高校生",
    range: "高1〜3",
    emoji: "📘",
    tagline: "効率よく、確実に。",
  },
];

const STORAGE_KEY = "ai-sensei-stage-v1";

export function getStageMeta(stage: Stage): StageMeta {
  return STAGES.find((s) => s.key === stage) ?? STAGES[0];
}

function isStage(v: unknown): v is Stage {
  return v === "elementary" || v === "junior" || v === "senior";
}

/** 記憶した学齢を返す。未選択なら null。 */
export function getStage(): Stage | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isStage(v) ? v : null;
  } catch {
    return null;
  }
}

/** <html data-stage> を切り替えてテーマを適用する（描画即時反映）。 */
export function applyStage(stage: Stage): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.stage = stage;
}

/** 学齢を保存し、テーマも即適用する。 */
export function setStage(stage: Stage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, stage);
  } catch {
    /* noop */
  }
  applyStage(stage);
}
