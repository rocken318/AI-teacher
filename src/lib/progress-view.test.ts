import { expect, test } from "vitest";
import { groupSubjects, DISPLAY_SUBJECTS, displaySubjectMeta, apiSubjectLabel, groupTodayBySubject } from "@/lib/progress-view";

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

test("apiSubjectLabel は API教科キーを日本語に", () => {
  expect(apiSubjectLabel("history")).toBe("歴史");
  expect(apiSubjectLabel("unknown")).toBe("unknown");
});

test("groupTodayBySubject は今日の内訳を5教科へ合算し、0問の教科は除く", () => {
  const bySubject = {
    math: { attempts: 3, correct: 2 },
    history: { attempts: 2, correct: 2 },
    geography: { attempts: 1, correct: 0 },
    english: { attempts: 4, correct: 4 },
  };
  const g = groupTodayBySubject(bySubject);
  // social = history(2/2) + geography(1/0) = 3/2
  const social = g.find((x) => x.key === "social")!;
  expect(social.attempts).toBe(3);
  expect(social.correct).toBe(2);
  expect(social.label).toBe("社会");
  // 出たのは math / social / english のみ（理科・国語は0問で除外）
  expect(g.map((x) => x.key)).toEqual(["math", "social", "english"]);
});

test("groupTodayBySubject は空なら空配列", () => {
  expect(groupTodayBySubject({})).toEqual([]);
});
