import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

test("hashPassword は毎回異なる（salt）が verify で一致する", () => {
  const h1 = hashPassword("correct horse");
  const h2 = hashPassword("correct horse");
  expect(h1).not.toBe(h2);
  expect(verifyPassword("correct horse", h1)).toBe(true);
  expect(verifyPassword("correct horse", h2)).toBe(true);
});
test("違うパスワードは false", () => {
  const h = hashPassword("secret1");
  expect(verifyPassword("secret2", h)).toBe(false);
});
test("壊れたハッシュは false（throwしない）", () => {
  expect(verifyPassword("x", "garbage")).toBe(false);
});
