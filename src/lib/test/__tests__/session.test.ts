import { expect, test } from "vitest";
import {
  buildTestKey,
  buildRandomTestKey,
  distributeCount,
  pickRandomSlots,
} from "@/lib/test/session";

test("buildTestKey は単元をソート・重複除去して subject と連結する", () => {
  expect(buildTestKey("math", ["div-basic", "dec-mul"])).toBe(
    "math|dec-mul,div-basic",
  );
  expect(buildTestKey("math", ["dec-mul", "dec-mul"])).toBe("math|dec-mul");
});

test("distributeCount は指定数を単元へ均等配分し、端数は先頭単元へ", () => {
  const slots = distributeCount(["a", "b", "c"], 10);
  expect(slots.length).toBe(10);
  const count = (u: string) => slots.filter((s) => s === u).length;
  expect(count("a")).toBe(4);
  expect(count("b")).toBe(3);
  expect(count("c")).toBe(3);
});

test("distributeCount は空単元で空配列", () => {
  expect(distributeCount([], 10)).toEqual([]);
});

test("buildRandomTestKey は 教科×学年 で固定（実出単元に依らない）", () => {
  expect(buildRandomTestKey("science", "中2")).toBe("science|中2|__ALL__");
  expect(buildRandomTestKey("math", "中1")).toBe("math|中1|__ALL__");
});

test("pickRandomSlots は count 個・全てプール内・空プールで空", () => {
  const pool = ["a", "b", "c", "d"];
  const slots = pickRandomSlots(pool, 10);
  expect(slots.length).toBe(10);
  expect(slots.every((s) => pool.includes(s))).toBe(true);
  expect(pickRandomSlots([], 10)).toEqual([]);
  expect(pickRandomSlots(pool, 0)).toEqual([]);
});
