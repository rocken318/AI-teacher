"use client";
import type {
  OverallResponse, TodayResponse, SubjectResponse, DailyResponse, Child,
} from "@/lib/progress-client-types";
import { setActiveChild } from "@/lib/progress";
import { setStage, isStage } from "@/lib/stage";

/** サーバー集計（教科別 attempts/correct＋合計）。ホームのカード/レベル用。 */
export interface ProgressSummaryResponse {
  total: number;
  correct: number;
  bySubject: Record<string, { attempts: number; correct: number }>;
}

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
  if (!res.ok) return null;
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

/** 進捗系。401→"unauth"、403→"forbidden"、その他エラー→"unauth"。 */
async function getProgress<T>(url: string): Promise<T | "unauth" | "forbidden"> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (res.status === 401) return "unauth";
  if (res.status === 403) return "forbidden";
  if (!res.ok) return "unauth";
  return (await res.json()) as T;
}

export function fetchToday(childId: string): Promise<TodayResponse | "unauth" | "forbidden"> {
  return getProgress<TodayResponse>(`/api/progress/today?childId=${encodeURIComponent(childId)}`);
}
/** 指定日(YYYY-MM-DD)の内訳。形は today と同じ。未来/不正はサーバー側で今日にフォールバック。 */
export function fetchDay(childId: string, date: string): Promise<TodayResponse | "unauth" | "forbidden"> {
  return getProgress<TodayResponse>(
    `/api/progress/today?childId=${encodeURIComponent(childId)}&date=${encodeURIComponent(date)}`,
  );
}
export function fetchOverall(childId: string): Promise<OverallResponse | "unauth" | "forbidden"> {
  return getProgress<OverallResponse>(`/api/progress/overall?childId=${encodeURIComponent(childId)}`);
}
export function fetchSubject(childId: string, subject: string): Promise<SubjectResponse | "unauth" | "forbidden"> {
  return getProgress<SubjectResponse>(
    `/api/progress/subject?childId=${encodeURIComponent(childId)}&subject=${encodeURIComponent(subject)}`,
  );
}
/** 直近N日の日別学習量＋連続日数。401→"unauth"、403→"forbidden"。 */
export function fetchDaily(childId: string, days = 30): Promise<DailyResponse | "unauth" | "forbidden"> {
  return getProgress<DailyResponse>(
    `/api/progress/daily?childId=${encodeURIComponent(childId)}&days=${days}`,
  );
}
/** ホーム用の教科別集計（サーバー）。401/403 は sentinel。 */
export function fetchSummary(childId: string): Promise<ProgressSummaryResponse | "unauth" | "forbidden"> {
  return getProgress<ProgressSummaryResponse>(
    `/api/progress/summary?childId=${encodeURIComponent(childId)}`,
  );
}

/**
 * ログイン/新規登録の成功後に呼ぶ。
 * 子が1人ならその子を自動で「学習中」にして学齢テーマも合わせ、行き先 "/" を返す。
 * 子が0人/複数なら "/family"（選択・追加）を返す。
 * これにより「ログインしたのに子を選ばず学習→匿名IDに記録」を防ぐ。
 */
export async function pickPostAuthDestination(): Promise<string> {
  const children = await fetchChildren();
  if (children && children.length === 1) {
    const c = children[0];
    setActiveChild(c.id);
    if (isStage(c.stage)) setStage(c.stage);
    return "/";
  }
  return "/family";
}
