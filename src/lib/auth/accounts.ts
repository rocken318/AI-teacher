import "server-only";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import type { AccountRow, ChildRow } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/auth/session";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
export async function createAccount(email: string, passwordHash: string): Promise<string> {
  const id = randomUUID();
  await getStore().createAccount(id, normalizeEmail(email), passwordHash);
  return id;
}
export async function findAccountByEmail(email: string): Promise<AccountRow | null> {
  return getStore().getAccountByEmail(normalizeEmail(email));
}
export async function findAccountById(id: string): Promise<AccountRow | null> {
  return getStore().getAccountById(id);
}
export async function addChild(accountId: string, name: string, stage: string): Promise<string> {
  const id = randomUUID();
  await getStore().createChild(id, accountId, name, stage);
  return id;
}
export async function listChildren(accountId: string): Promise<ChildRow[]> {
  return getStore().listChildren(accountId);
}
export async function getChild(id: string): Promise<ChildRow | null> {
  return getStore().getChild(id);
}
export function currentAccountId(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token)?.accountId ?? null;
}
export async function ownsChild(accountId: string, childId: string): Promise<boolean> {
  const child = await getStore().getChild(childId);
  return !!child && child.accountId === accountId;
}
