// このリポジトリの vitest は Node 環境（jsdom 未導入）で動くため、
// 最小限の localStorage モックを差し込む。
class MemStorage implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
const mem = new MemStorage();
globalThis.window = (globalThis.window ?? {}) as Window & typeof globalThis;
globalThis.window.localStorage = mem;
globalThis.localStorage = mem;

import { afterEach, expect, test } from "vitest";
import { getTrack, setTrack, clearTrack } from "@/lib/track";

afterEach(() => {
  try { window.localStorage.clear(); } catch { /* noop */ }
});

test("setTrack/getTrack/clearTrack が往復する", () => {
  expect(getTrack()).toBeNull();
  setTrack("eikaiwa");
  expect(getTrack()).toBe("eikaiwa");
  clearTrack();
  expect(getTrack()).toBeNull();
});

test("不正な値は null 扱い", () => {
  try { window.localStorage.setItem("ai-sensei-track-v1", "bogus"); } catch { /* noop */ }
  expect(getTrack()).toBeNull();
});
