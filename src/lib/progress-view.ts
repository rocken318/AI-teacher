/**
 * 進捗の表示ヘルパー（クライアント安全・純関数）。
 * API の 7 教科（TEST_SUBJECTS）を、画面の 5 教科ドーナツ（算/理/社/英/国）へ集約する。
 * 中学の history / geography は social（社会）へ合算する。
 */

export interface SubjectShare {
  masteredUnits: number;
  targetUnits: number;
  percent: number;
}

/** 表示用 5 教科。key は「集約後」の教科キー。 */
export interface DisplaySubject {
  key: "math" | "science" | "social" | "japanese" | "english";
  label: string;
  emoji: string;
  /** その表示バケットに合算する API 教科キー。 */
  sources: string[];
}

export const DISPLAY_SUBJECTS: DisplaySubject[] = [
  { key: "math", label: "算数", emoji: "🔢", sources: ["math"] },
  { key: "science", label: "理科", emoji: "🔬", sources: ["science"] },
  { key: "social", label: "社会", emoji: "🗺️", sources: ["social", "history", "geography"] },
  { key: "japanese", label: "国語", emoji: "✍️", sources: ["japanese"] },
  { key: "english", label: "英語", emoji: "🔤", sources: ["english"] },
];

export interface GroupedShare extends SubjectShare {
  key: DisplaySubject["key"];
  label: string;
  emoji: string;
}

/** API の bySubject（7教科）を 5 表示教科へ集約。percent は合算後に再計算。 */
export function groupSubjects(
  bySubject: Record<string, SubjectShare>,
): GroupedShare[] {
  return DISPLAY_SUBJECTS.map((d) => {
    let mastered = 0;
    let target = 0;
    for (const src of d.sources) {
      const s = bySubject[src];
      if (s) {
        mastered += s.masteredUnits;
        target += s.targetUnits;
      }
    }
    return {
      key: d.key,
      label: d.label,
      emoji: d.emoji,
      masteredUnits: mastered,
      targetUnits: target,
      percent: target > 0 ? Math.round((mastered / target) * 100) : 0,
    };
  });
}

/** 表示教科メタ（ラベル/絵文字）を返す。未知キーは算数扱いのフォールバック。 */
export function displaySubjectMeta(key: string): DisplaySubject {
  return DISPLAY_SUBJECTS.find((d) => d.key === key) ?? DISPLAY_SUBJECTS[0];
}
