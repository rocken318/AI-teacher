import { expect, test } from "vitest";
import { groupSubjects, DISPLAY_SUBJECTS, displaySubjectMeta } from "@/lib/progress-view";

type Share = { masteredUnits: number; targetUnits: number; percent: number };

test("groupSubjects は history/geography を social に合算し percent を再計算", () => {
  const bySubject: Record<string, Share> = {
    math: { masteredUnits: 2, targetUnits: 10, percent: 20 },
    science: { masteredUnits: 1, targetUnits: 4, percent: 25 },
    social: { masteredUnits: 0, targetUnits: 0, percent: 0 },
    history: { masteredUnits: 3, targetUnits: 6, percent: 50 },
    geography: { masteredUnits: 1, targetUnits: 4, percent: 25 },
    japanese: { masteredUnits: 0, targetUnits: 2, percent: 0 },
    english: { masteredUnits: 5, targetUnits: 5, percent: 100 },
  };
  const g = groupSubjects(bySubject);
  const social = g.find((x) => x.key === "social")!;
  // social(0/0) + history(3/6) + geography(1/4) = 4/10 = 40%
  expect(social.masteredUnits).toBe(4);
  expect(social.targetUnits).toBe(10);
  expect(social.percent).toBe(40);
  const math = g.find((x) => x.key === "math")!;
  expect(math.percent).toBe(20);
});

test("groupSubjects は常に5バケットを DISPLAY_SUBJECTS の順で返す", () => {
  const g = groupSubjects({});
  expect(g.map((x) => x.key)).toEqual(DISPLAY_SUBJECTS.map((d) => d.key));
  expect(g.every((x) => x.percent === 0 && x.targetUnits === 0)).toBe(true);
});

test("displaySubjectMeta はラベル/絵文字を返す", () => {
  expect(displaySubjectMeta("math").label).toBe("算数");
  expect(displaySubjectMeta("social").label).toBe("社会");
});
