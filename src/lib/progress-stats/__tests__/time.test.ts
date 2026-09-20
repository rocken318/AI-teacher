// src/lib/progress-stats/__tests__/time.test.ts
import { expect, test } from "vitest";
import { toJstDateKey, jstMonthKey, addDaysKey } from "@/lib/progress-stats/time";

test("UTC エポックmsを JST 日付キーに変換（+9h 境界）", () => {
  // 2026-09-20T14:59:59Z は JST では 2026-09-20 23:59:59
  expect(toJstDateKey(Date.parse("2026-09-20T14:59:59Z"))).toBe("2026-09-20");
  // 2026-09-20T15:00:00Z は JST では 2026-09-21 00:00:00（日付が繰り上がる）
  expect(toJstDateKey(Date.parse("2026-09-20T15:00:00Z"))).toBe("2026-09-21");
});

test("jstMonthKey は YYYY-MM", () => {
  expect(jstMonthKey(Date.parse("2026-09-20T15:00:00Z"))).toBe("2026-09");
});

test("addDaysKey は日付キーを暦どおりに加減算（月跨ぎ）", () => {
  expect(addDaysKey("2026-09-20", -1)).toBe("2026-09-19");
  expect(addDaysKey("2026-03-01", -1)).toBe("2026-02-28");
  expect(addDaysKey("2026-12-31", 1)).toBe("2027-01-01");
});
