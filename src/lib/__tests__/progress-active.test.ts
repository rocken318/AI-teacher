// このリポジトリの vitest は Node 環境（jsdom 未導入）で動くため、
// 最小限の localStorage モックを差し込む。
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
import {
  getChildId,
  getActiveChild,
  setActiveChild,
  clearActiveChild,
} from "@/lib/progress";

beforeEach(() => localStorage.clear());

test("アクティブ未設定なら匿名UUIDを返し、以後同じ値", () => {
  const a = getChildId();
  expect(a).not.toBe("");
  expect(getChildId()).toBe(a);
  expect(getActiveChild()).toBe("");
});
test("アクティブを設定すると getChildId はそれを返す。clear で匿名に戻る", () => {
  const anon = getChildId();
  setActiveChild("prof-1");
  expect(getActiveChild()).toBe("prof-1");
  expect(getChildId()).toBe("prof-1");
  clearActiveChild();
  expect(getActiveChild()).toBe("");
  expect(getChildId()).toBe(anon);
});
