// vitest は Node 環境（jsdom 未導入）のため最小 localStorage モックを差し込む。
class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  key(i: number) {
    return Array.from(this.m.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  clear() {
    this.m.clear();
  }
}
const mem = new MemStorage();
globalThis.window = (globalThis.window ?? {}) as Window & typeof globalThis;
globalThis.window.localStorage = mem;
globalThis.localStorage = mem;

import { beforeEach, expect, test } from "vitest";
import { recordAttempt, getUnitProgress, getProgress } from "@/lib/progress";

beforeEach(() => localStorage.clear());

test("recordAttempt は単元別にも積む", () => {
  recordAttempt("science", "sci-1", true);
  recordAttempt("science", "sci-1", false);
  recordAttempt("science", "sci-2", true);
  const units = getUnitProgress();
  expect(units["sci-1"]).toEqual({ attempts: 2, correct: 1 });
  expect(units["sci-2"]).toEqual({ attempts: 1, correct: 1 });
});

test("教科別集計は従来どおり（単元別追加の影響を受けない）", () => {
  recordAttempt("math", "m-1", true);
  recordAttempt("math", "m-2", false);
  const p = getProgress();
  expect(p.bySubject["math"]).toEqual({ attempts: 2, correct: 1 });
  expect(p.totalAttempts).toBe(2);
  expect(p.totalCorrect).toBe(1);
});

test("ランダムのダミー単元(__random__)は単元別に積まない", () => {
  recordAttempt("math", "__random__", true);
  expect(getUnitProgress()["__random__"]).toBeUndefined();
  // 教科別には積まれる。
  expect(getProgress().bySubject["math"].attempts).toBe(1);
});
