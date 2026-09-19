import { describe, expect, test } from "vitest";
import { UNITS } from "@/lib/math";
import { QUIZ_UNITS } from "@/lib/quiz";

/**
 * コンテンツ機械監査。
 * 単元を増やすたびに、id 重複・answerIndex 範囲外・choiceHints 長さ不一致を
 * 早期に検知する（人手の作問ミスをビルド前に止める）。事実の正しさは別途
 * 事実監査で担保する（ここは構造の健全性のみ）。
 */

describe("算数（生成単元）", () => {
  test("単元 id は一意", () => {
    const ids = UNITS.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("クイズ（authored バンク）", () => {
  test("単元 id は一意", () => {
    const ids = QUIZ_UNITS.map((u) => u.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dup).toEqual([]);
  });

  test("問題 id は単元内で一意（採点は unitId+itemId の複合キー）", () => {
    // 既存バンク（social 等）は単元をまたいで "q1".."q6" を使い回すため、
    // グローバル一意ではなく「単元内で一意」を不変条件とする。
    for (const u of QUIZ_UNITS) {
      const ids = u.items.map((it) => it.id);
      const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(dup, `${u.id} 内で重複 item id`).toEqual([]);
    }
  });

  test("answerIndex は choices の範囲内", () => {
    for (const u of QUIZ_UNITS) {
      for (const it of u.items) {
        expect(
          it.answerIndex >= 0 && it.answerIndex < it.choices.length,
          `${it.id}: answerIndex=${it.answerIndex} / choices=${it.choices.length}`,
        ).toBe(true);
      }
    }
  });

  test("choices は2つ以上・空文字なし・重複なし", () => {
    for (const u of QUIZ_UNITS) {
      for (const it of u.items) {
        expect(it.choices.length, `${it.id}`).toBeGreaterThanOrEqual(2);
        expect(it.choices.every((c) => c.trim().length > 0), `${it.id}`).toBe(
          true,
        );
        expect(new Set(it.choices).size, `${it.id} 重複選択肢`).toBe(
          it.choices.length,
        );
      }
    }
  });

  test("choiceHints があれば choices と同じ長さで、正解 index は null", () => {
    for (const u of QUIZ_UNITS) {
      for (const it of u.items) {
        if (!it.choiceHints) continue;
        expect(it.choiceHints.length, `${it.id} hints長`).toBe(
          it.choices.length,
        );
        expect(it.choiceHints[it.answerIndex], `${it.id} 正解hintはnull`).toBe(
          null,
        );
      }
    }
  });

  test("explanation は非空", () => {
    for (const u of QUIZ_UNITS) {
      for (const it of u.items) {
        expect(it.explanation.trim().length, `${it.id}`).toBeGreaterThan(0);
      }
    }
  });
});
