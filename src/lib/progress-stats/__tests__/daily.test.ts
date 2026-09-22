import { describe, expect, test } from "vitest";
import { dailyActivity } from "../daily";
import type { AttemptRecord } from "../types";

/** テスト用 attempt。createdAtMs は UTC エポックms。 */
function at(ms: number): AttemptRecord {
  return { subject: "math", unitId: "u", correct: true, createdAtMs: ms };
}

/** JST 暦日 key の 12:00(JST)=03:00Z 相当の ms を作る（境界を避けた昼）。 */
function jstNoon(y: number, m: number, d: number): number {
  // JST 12:00 = UTC 03:00
  return Date.UTC(y, m - 1, d, 3, 0, 0);
}

const TODAY = "2026-09-22";

describe("dailyActivity", () => {
  test("空なら 30日ぶん全て 0（窓を埋める）", () => {
    const r = dailyActivity([], TODAY, 30);
    expect(r.days).toHaveLength(30);
    expect(r.days[0].date).toBe("2026-08-24"); // 29日前
    expect(r.days[29].date).toBe("2026-09-22"); // 今日
    expect(r.activeDays).toBe(0);
    expect(r.maxCount).toBe(0);
    expect(r.days.every((d) => d.count === 0)).toBe(true);
  });

  test("days 指定を尊重（7日窓）", () => {
    const r = dailyActivity([], TODAY, 7);
    expect(r.days).toHaveLength(7);
    expect(r.days[0].date).toBe("2026-09-16");
    expect(r.days[6].date).toBe("2026-09-22");
  });

  test("日別に件数を数える（今日3・2日前1）", () => {
    const recs = [
      at(jstNoon(2026, 9, 22)),
      at(jstNoon(2026, 9, 22)),
      at(jstNoon(2026, 9, 22)),
      at(jstNoon(2026, 9, 20)),
    ];
    const r = dailyActivity(recs, TODAY, 30);
    const today = r.days[29];
    const twoAgo = r.days.find((d) => d.date === "2026-09-20")!;
    expect(today.count).toBe(3);
    expect(twoAgo.count).toBe(1);
    expect(r.activeDays).toBe(2);
    expect(r.maxCount).toBe(3);
  });

  test("JST 境界: UTC15:00は翌JST日、UTC14:59は当JST日", () => {
    const recs = [
      at(Date.UTC(2026, 8, 21, 15, 0, 0)), // → JST 2026-09-22
      at(Date.UTC(2026, 8, 21, 14, 59, 0)), // → JST 2026-09-21
    ];
    const r = dailyActivity(recs, TODAY, 30);
    expect(r.days.find((d) => d.date === "2026-09-22")!.count).toBe(1);
    expect(r.days.find((d) => d.date === "2026-09-21")!.count).toBe(1);
  });

  test("窓の外（40日前）は含めない", () => {
    const r = dailyActivity([at(jstNoon(2026, 8, 13))], TODAY, 30);
    expect(r.days.some((d) => d.date === "2026-08-13")).toBe(false);
    expect(r.activeDays).toBe(0);
    expect(r.maxCount).toBe(0);
  });
});
