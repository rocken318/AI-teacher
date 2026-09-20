import { expect, test } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

test("sign→verify で accountId が復元できる", () => {
  const token = signSession("acc-1", 60_000);
  const v = verifySession(token);
  expect(v?.accountId).toBe("acc-1");
});
test("改ざんトークンは null", () => {
  const token = signSession("acc-1", 60_000);
  const tampered = token.slice(0, -2) + (token.endsWith("aa") ? "bb" : "aa");
  expect(verifySession(tampered)).toBeNull();
});
test("期限切れは null", () => {
  const token = signSession("acc-1", -1000);
  expect(verifySession(token)).toBeNull();
});
test("ゴミ文字列は null（throwしない）", () => {
  expect(verifySession("garbage")).toBeNull();
  expect(verifySession("a.b.c")).toBeNull();
});
