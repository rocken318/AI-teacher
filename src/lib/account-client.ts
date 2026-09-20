"use client";
import type {
  OverallResponse, TodayResponse, SubjectResponse, Child,
} from "@/lib/progress-client-types";

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
}

/** signup。成功 true、失敗はエラーメッセージ。 */
export async function signup(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await postJson("/api/auth/signup", { email, password });
  if (res.ok) return { ok: true };
  const j = await res.json().catch(() => ({}));
  return { ok: false, error: j.error ?? "登録に失敗しました。" };
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const res = await postJson("/api/auth/login", { email, password });
  if (res.ok) return { ok: true };
  const j = await res.json().catch(() => ({}));
  return { ok: false, error: j.error ?? "メールかパスワードが違います。" };
}

export async function logout(): Promise<void> {
  await postJson("/api/auth/logout", {});
}

/** 子一覧。未ログイン(401)は null を返す（呼び出し側で /login へ）。 */
export async function fetchChildren(): Promise<Child[] | null> {
  const res = await fetch("/api/children", { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) return [];
  const j = await res.json();
  return (j.children ?? []) as Child[];
}

export async function createChild(name: string, stage: string): Promise<{ id?: string; error?: string }> {
  const res = await postJson("/api/children", { name, stage });
  const j = await res.json().catch(() => ({}));
  if (res.ok) return { id: j.id };
  return { error: j.error ?? "作成に失敗しました。" };
}

/** 引き継ぎ。fromChildId=この端末の匿名id、toChildId=新プロフィールid。*/
export async function claim(fromChildId: string, toChildId: string): Promise<boolean> {
  const res = await postJson("/api/children/claim", { fromChildId, toChildId });
  return res.ok;
}

/** 進捗系。401 は null（→ /login 誘導）。 */
async function getProgress<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export function fetchToday(childId: string) {
  return getProgress<TodayResponse>(`/api/progress/today?childId=${encodeURIComponent(childId)}`);
}
export function fetchOverall(childId: string) {
  return getProgress<OverallResponse>(`/api/progress/overall?childId=${encodeURIComponent(childId)}`);
}
export function fetchSubject(childId: string, subject: string) {
  return getProgress<SubjectResponse>(
    `/api/progress/subject?childId=${encodeURIComponent(childId)}&subject=${encodeURIComponent(subject)}`,
  );
}
