/**
 * 進捗＆「親からの一言」の localStorage 管理。
 *
 * - SSR 安全: すべての read/write で `typeof window` をガードする。
 * - 進捗は教科（subject）ごとに attempts / correct を集計する。
 *   subject は string で受け、未知の教科も許容する（bySubject に動的に追加）。
 * - QuizPractice / MathPractice など各コースが `recordAttempt` を呼ぶ。
 */

/** 既知の教科キー（型ヒント用。実際には任意の string を許容する）。 */
export type SubjectKey = "math" | "science" | "social" | "japanese" | "english";

/** 教科ごとの集計。 */
export type SubjectProgress = {
  attempts: number;
  correct: number;
};

/** getProgress の戻り値。 */
export type Progress = {
  bySubject: Record<string, SubjectProgress>;
  totalAttempts: number;
  totalCorrect: number;
};

const PROGRESS_KEY = "ai-sensei-progress-v1";
const UNIT_PROGRESS_KEY = "ai-sensei-unit-progress-v1";
const PARENT_MSG_KEY = "ai-sensei-parent-message-v1";
const CHILD_ID_KEY = "ai-sensei-child-id-v1";
const ACTIVE_CHILD_KEY = "ai-sensei-active-child-v1";

/** 保護者の一言が未設定のときの、あたたかい既定メッセージ。 */
export const DEFAULT_PARENT_MESSAGE =
  "きょうも いっぽ ずつ。まちがえても だいじょうぶ。あなたの「なんで？」が いちばん すてきだよ。";

/** SSR 安全に localStorage を得る（無ければ null）。 */
function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * localStorage の集計マップを読む（壊れていたら空を返す）。
 * 教科別（PROGRESS_KEY）・単元別（UNIT_PROGRESS_KEY）で同じ形なので共用する。
 */
function readRaw(key: string = PROGRESS_KEY): Record<string, SubjectProgress> {
  const s = storage();
  if (!s) return {};
  try {
    const raw = s.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, SubjectProgress> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v && typeof v === "object") {
        const rec = v as Record<string, unknown>;
        const attempts = Number(rec.attempts) || 0;
        const correct = Number(rec.correct) || 0;
        out[k] = { attempts, correct };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/** 集計マップを localStorage に書く。 */
function writeRaw(
  data: Record<string, SubjectProgress>,
  key: string = PROGRESS_KEY,
): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(data));
  } catch {
    // 容量不足などは黙って無視（進捗は補助的機能）。
  }
}

/**
 * 1回の挑戦を記録する。
 * 教科別（bySubject・全体表示用）と単元別（単元選択のマスター度用）の
 * 両方を localStorage に積む。どちらも端末ローカル（ログイン時はサーバーが正）。
 * @param subject 教科キー（"math" など）。未知の string も許容。
 * @param unitId 単元 ID。
 * @param correct 正解なら true。
 */
export function recordAttempt(
  subject: string,
  unitId: string,
  correct: boolean,
): void {
  // 教科別集計
  const data = readRaw();
  const cur = data[subject] ?? { attempts: 0, correct: 0 };
  data[subject] = {
    attempts: cur.attempts + 1,
    correct: cur.correct + (correct ? 1 : 0),
  };
  writeRaw(data);

  // 単元別集計（unitId があるときだけ。ランダムのダミー等は除く）
  if (unitId && unitId !== "__random__") {
    const units = readRaw(UNIT_PROGRESS_KEY);
    const u = units[unitId] ?? { attempts: 0, correct: 0 };
    units[unitId] = {
      attempts: u.attempts + 1,
      correct: u.correct + (correct ? 1 : 0),
    };
    writeRaw(units, UNIT_PROGRESS_KEY);
  }
}

/** 単元別の集計（この端末）。単元選択画面のマスター度表示に使う。 */
export function getUnitProgress(): Record<string, SubjectProgress> {
  return readRaw(UNIT_PROGRESS_KEY);
}

/** 進捗の全体像を返す（教科別＋合計）。SSR では空の集計を返す。 */
export function getProgress(): Progress {
  const bySubject = readRaw();
  let totalAttempts = 0;
  let totalCorrect = 0;
  for (const v of Object.values(bySubject)) {
    totalAttempts += v.attempts;
    totalCorrect += v.correct;
  }
  return { bySubject, totalAttempts, totalCorrect };
}

/**
 * この端末の学習者ID（childId）。初回に生成して localStorage に保存する。
 * サーバーの進捗保存・見守りでの集計キーに使う（同一端末で本人と保護者が使う前提）。
 * SSR では "" を返す。
 */
export function getActiveChild(): string {
  const s = storage();
  if (!s) return "";
  try {
    return s.getItem(ACTIVE_CHILD_KEY) ?? "";
  } catch {
    return "";
  }
}
export function setActiveChild(childId: string): void {
  const s = storage();
  if (!s) return;
  try {
    if (childId) s.setItem(ACTIVE_CHILD_KEY, childId);
    else s.removeItem(ACTIVE_CHILD_KEY);
  } catch {
    /* noop */
  }
}
export function clearActiveChild(): void {
  setActiveChild("");
}

export function getChildId(): string {
  const s = storage();
  if (!s) return "";
  const active = getActiveChild();
  if (active) return active;
  try {
    let id = s.getItem(CHILD_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      s.setItem(CHILD_ID_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

/** 保護者の一言を取得する。未設定なら既定の応援文を返す。 */
export function getParentMessage(): string {
  const s = storage();
  if (!s) return DEFAULT_PARENT_MESSAGE;
  try {
    const raw = s.getItem(PARENT_MSG_KEY);
    const msg = raw?.trim();
    return msg ? msg : DEFAULT_PARENT_MESSAGE;
  } catch {
    return DEFAULT_PARENT_MESSAGE;
  }
}

/** 保護者の一言を保存する（空文字なら既定に戻すため削除）。 */
export function setParentMessage(msg: string): void {
  const s = storage();
  if (!s) return;
  try {
    const trimmed = msg.trim();
    if (trimmed) {
      s.setItem(PARENT_MSG_KEY, trimmed);
    } else {
      s.removeItem(PARENT_MSG_KEY);
    }
  } catch {
    // 無視
  }
}
