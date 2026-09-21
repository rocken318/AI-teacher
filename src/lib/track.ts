/**
 * 学校の学齢(Stage)とは別の「トラック」モード。
 * 現状は "eikaiwa"（実用英語）のみ。localStorage に記憶する（SSR安全）。
 */
export type Track = "eikaiwa";

const KEY = "ai-sensei-track-v1";

/** 記憶したトラックを返す。未設定/不正は null。 */
export function getTrack(): Track | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY) === "eikaiwa" ? "eikaiwa" : null;
  } catch {
    return null;
  }
}

/** トラックを保存する。 */
export function setTrack(track: Track): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, track);
  } catch {
    /* noop */
  }
}

/** トラックを消す（学校モードに戻る）。 */
export function clearTrack(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
