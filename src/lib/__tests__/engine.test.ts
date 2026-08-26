import { describe, it, expect } from "vitest";
import {
  buildSocraticSystemPrompt,
  buildRewriteToQuestionPrompt,
  PRACTICE_MODE_REPLY,
  GENTLE_REDIRECT,
} from "@/lib/prompts";
import { GRADE_PROFILES, GRADE_BANDS, getProfile } from "@/lib/grade/gradeProfiles";
import { TOPICS, getTopic } from "@/lib/topics";
import { parseModeration } from "@/lib/safety/moderateInput";
import { parseOutputVerdict } from "@/lib/safety/moderateOutput";

describe("ソクラテス型システムプロンプトが profile を反映する", () => {
  it("学年帯・語彙・文の長さが system 文に含まれる", () => {
    const p = GRADE_PROFILES["小1-3"];
    const s = buildSocraticSystemPrompt(p);
    expect(s).toContain(p.gradeBand);
    expect(s).toContain(p.vocabularyLevel);
    expect(s).toContain(p.sentenceLength);
  });

  it("答えを直接言わない原則が明記されている", () => {
    const s = buildSocraticSystemPrompt(GRADE_PROFILES["小4-6"]);
    expect(s).toContain("直接言わない");
    expect(s).toContain("問い");
  });

  it("strictness=high と low で足場かけの方針が変わる", () => {
    const high = buildSocraticSystemPrompt(GRADE_PROFILES["小1-3"]); // high
    const low = buildSocraticSystemPrompt(GRADE_PROFILES["高"]); // low
    expect(high).not.toEqual(low);
    expect(high).toContain("足場を多めに");
    expect(low).toContain("多くを委ねて");
  });

  it("topicTitle を渡すと system に反映される", () => {
    const s = buildSocraticSystemPrompt(GRADE_PROFILES["小1-3"], "なぜ空は青いの？");
    expect(s).toContain("なぜ空は青いの？");
  });

  it("ひらがな寄りプロファイルでは やさしい言葉づかいの指示が入る", () => {
    const s = buildSocraticSystemPrompt(GRADE_PROFILES["小1-3"]);
    expect(s).toContain("ひらがなを多めに");
  });
});

describe("書き換えプロンプト・定型文", () => {
  it("rewriteプロンプトは『答えを含めない』を必ず要求する", () => {
    const s = buildRewriteToQuestionPrompt(GRADE_PROFILES["中"]);
    expect(s).toContain("答え");
    expect(s).toContain("含めない");
  });
  it("練習モード・切り返しの定型文が空でない", () => {
    expect(PRACTICE_MODE_REPLY.length).toBeGreaterThan(0);
    expect(GENTLE_REDIRECT.length).toBeGreaterThan(0);
  });
});

describe("学年プロファイル", () => {
  it("GRADE_BANDS の全てで getProfile が有効なプロファイルを返す", () => {
    for (const band of GRADE_BANDS) {
      const p = getProfile(band);
      expect(p.gradeBand).toBe(band);
      expect(["high", "medium", "low"]).toContain(p.strictness);
      expect(["high", "medium", "low"]).toContain(p.safetyLevel);
    }
  });
});

describe("探究テーマの整合", () => {
  it("各テーマが id/title/seedQuestion を持ち、gradeBands が有効値のみ", () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(5);
    for (const t of TOPICS) {
      expect(t.id).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.seedQuestion).toBeTruthy();
      expect(t.gradeBands.length).toBeGreaterThan(0);
      for (const b of t.gradeBands) expect(GRADE_BANDS).toContain(b);
    }
  });
  it("id は一意", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("getTopic は既存idを返し、未知idは undefined", () => {
    expect(getTopic(TOPICS[0].id)?.id).toBe(TOPICS[0].id);
    expect(getTopic("no-such-topic")).toBeUndefined();
  });
});

describe("モデレーションのJSONパーサ", () => {
  it("入力: directAnswer相当の ok=false を検知（前後にテキスト混在でも拾う）", () => {
    expect(parseModeration('前置き {"ok": false, "reason": "個人情報"} 後書き')).toEqual({
      ok: false,
      reason: "個人情報",
    });
    expect(parseModeration('{"ok": true, "reason": ""}').ok).toBe(true);
  });
  it("入力: パース不能なら安全側(ok=false)に倒す", () => {
    expect(parseModeration("これはJSONではない").ok).toBe(false);
  });
  it("出力: directAnswer=true を検知する", () => {
    const v = parseOutputVerdict('{"directAnswer": true, "inappropriate": false, "reason": "答えを言った"}');
    expect(v.directAnswer).toBe(true);
  });
  it("出力: パース不能なら false 扱い（本文はそのまま通す方針）", () => {
    const v = parseOutputVerdict("not json");
    expect(v.directAnswer).toBe(false);
    expect(v.inappropriate).toBe(false);
  });
});
