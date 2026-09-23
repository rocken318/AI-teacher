/** API JSON レスポンスのクライアント用型（server-only 依存を避けるため独立定義）。 */
export interface Share {
  masteredUnits: number;
  targetUnits: number;
  percent: number;
}
export interface OverallResponse {
  stage: string;
  overall: Share;
  bySubject: Record<string, Share>;
  totalAttempts: number;
  totalCorrect: number;
  level: { level: number; current: number; span: number; toNext: number };
  streak: { current: number; thisMonth: number; totalDays: number };
}
export interface TodayResponse {
  total: number;
  correct: number;
  rate: number;
  bySubject: Record<string, { attempts: number; correct: number }>;
  byUnit: { subject: string; unitId: string; title: string; attempts: number; correct: number }[];
  todayMistakes: { id: string; subject: string; unitId: string; kind: "quiz" | "math"; preview: string }[];
  testCount: number;
  tests: { subject: string; total: number; score: number }[];
}
export interface UnitProgressResponse {
  unitId: string;
  attempts: number;
  correct: number;
  rate: number;
  mastered: boolean;
  trend: { spark: number[]; direction: "up" | "flat" | "down" };
}
export interface SubjectResponse {
  subject: string;
  masteredUnits: number;
  targetUnits: number;
  percent: number;
  units: UnitProgressResponse[];
}
export interface DailyResponse {
  days: { date: string; count: number }[];
  activeDays: number;
  maxCount: number;
  streak: { current: number; thisMonth: number };
}
export interface Child {
  id: string;
  accountId: string;
  name: string;
  stage: string;
  createdAt: string;
}
