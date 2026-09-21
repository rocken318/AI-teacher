import { describe, expect, test } from "vitest";
import { buildVocabUnits } from "@/lib/quiz/vocab/build";
import type { VocabEntry, VocabUnitMeta } from "@/lib/quiz/vocab/types";
import { TOEIC500_UNITS, TOEIC500_VOCAB } from "@/lib/quiz/vocab/pack_toeic500";
import {
  TOEIC500_B_UNITS,
  TOEIC500_B_VOCAB,
} from "@/lib/quiz/vocab/pack_toeic500_b";
import {
  TOEIC500_C_UNITS,
  TOEIC500_C_VOCAB,
} from "@/lib/quiz/vocab/pack_toeic500_c";
import {
  TOEIC500_D_UNITS,
  TOEIC500_D_VOCAB,
} from "@/lib/quiz/vocab/pack_toeic500_d";
import {
  TOEIC500_E_UNITS,
  TOEIC500_E_VOCAB,
} from "@/lib/quiz/vocab/pack_toeic500_e";

/**
 * 語彙ジェネレーターの不変条件。
 * 生成AIを使わず決定的に4択を作るため、構造の健全性と「同じ入力→同じ出力」を担保する。
 */

const ALL_VOCAB = [
  ...TOEIC500_VOCAB,
  ...TOEIC500_B_VOCAB,
  ...TOEIC500_C_VOCAB,
  ...TOEIC500_D_VOCAB,
  ...TOEIC500_E_VOCAB,
];

const PACK = {
  subject: "eikaiwa" as const,
  grade: "TOEIC500" as const,
  idPrefix: "eikaiwa-500",
  units: [
    ...TOEIC500_UNITS,
    ...TOEIC500_B_UNITS,
    ...TOEIC500_C_UNITS,
    ...TOEIC500_D_UNITS,
    ...TOEIC500_E_UNITS,
  ],
  vocab: ALL_VOCAB,
};

describe("buildVocabUnits（TOEIC500）", () => {
  const units = buildVocabUnits(PACK);
  const items = units.flatMap((u) => u.items);

  test("メタどおりの単元数・id・教科・バンド", () => {
    // A(1-3)+B(4-6)+C(7-16)+D(17-27)+E(28-39) の39単元。
    expect(units.map((u) => u.id)).toEqual(
      Array.from({ length: 39 }, (_, i) => `eikaiwa-500-${i + 1}`),
    );
    for (const u of units) {
      expect(u.subject).toBe("eikaiwa");
      expect(u.grade).toBe("TOEIC500");
      expect(u.items.length).toBeGreaterThan(0);
    }
  });

  test("各語が1問になっている（全語→同数の問題）", () => {
    expect(items.length).toBe(ALL_VOCAB.length);
  });

  test("各問は4択・空文字なし・重複なし", () => {
    for (const it of items) {
      expect(it.choices.length, it.id).toBe(4);
      expect(it.choices.every((c) => c.trim().length > 0), it.id).toBe(true);
      expect(new Set(it.choices).size, `${it.id} 重複選択肢`).toBe(4);
    }
  });

  test("answerIndex は範囲内で、正解の選択肢が語の意味と一致", () => {
    const byWord = new Map(ALL_VOCAB.map((e) => [e.word, e]));
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      expect(it.answerIndex >= 0 && it.answerIndex < 4, it.id).toBe(true);
      const word = it.question.replace(" の意味は？", "");
      const entry = byWord.get(word)!;
      expect(it.choices[it.answerIndex], it.id).toBe(entry.ja);
    }
  });

  test("誤答に正解の意味が混ざらない（別解の即死回避）", () => {
    const byWord = new Map(ALL_VOCAB.map((e) => [e.word, e]));
    for (const it of items) {
      const word = it.question.replace(" の意味は？", "");
      const entry = byWord.get(word)!;
      const distractors = it.choices.filter((_, i) => i !== it.answerIndex);
      expect(distractors.includes(entry.ja), `${it.id} 誤答に正解が混入`).toBe(
        false,
      );
    }
  });

  test("choiceHints は4つ・正解はnull・誤答は非null", () => {
    for (const it of items) {
      expect(it.choiceHints?.length, it.id).toBe(4);
      for (let i = 0; i < 4; i++) {
        if (i === it.answerIndex) {
          expect(it.choiceHints![i], `${it.id} 正解hint`).toBeNull();
        } else {
          expect(
            (it.choiceHints![i] ?? "").length,
            `${it.id} 誤答hint非空`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  test("決定的: 二度生成しても完全一致（サーバーレスでも採点がぶれない）", () => {
    const again = buildVocabUnits(PACK);
    expect(again).toEqual(units);
  });

  test("正解位置が0〜3に分散している（一箇所に偏らない）", () => {
    const counts = [0, 0, 0, 0];
    for (const it of items) counts[it.answerIndex]++;
    // 60問なら4位置すべてに最低1問は乗るはず。
    expect(counts.every((n) => n > 0), `分布=${counts.join(",")}`).toBe(true);
  });

  test("同一バンド内で ja（意味）が一意（キュレーション健全性）", () => {
    const jas = ALL_VOCAB.map((e) => e.ja);
    const dup = jas.filter((j, i) => jas.indexOf(j) !== i);
    expect(dup, `重複した意味: ${dup.join(",")}`).toEqual([]);
  });

  test("ja2en（日→英）: 問題文は意味、選択肢は英単語、正解は語そのもの", () => {
    const rev = buildVocabUnits({ ...PACK, idPrefix: "rev", direction: "ja2en" });
    const revItems = rev.flatMap((u) => u.items);
    expect(revItems.length).toBe(ALL_VOCAB.length);
    const byJa = new Map(ALL_VOCAB.map((e) => [e.ja, e]));
    for (const it of revItems) {
      // 問題文は「〈意味〉の英語は？」の形
      const ja = it.question.replace("」の英語は？", "").replace("「", "");
      const entry = byJa.get(ja);
      expect(entry, `${it.id} 問題文の意味が不明`).toBeTruthy();
      if (!entry) continue;
      // 4択・重複なし・空なし
      expect(it.choices.length, it.id).toBe(4);
      expect(new Set(it.choices).size, `${it.id} 重複`).toBe(4);
      // 正解の選択肢は英単語そのもの
      expect(it.choices[it.answerIndex], it.id).toBe(entry.word);
      // すべての選択肢が英字（英単語）
      expect(
        it.choices.every((c) => /^[A-Za-z][A-Za-z-]*$/.test(c)),
        `${it.id} 選択肢=${it.choices.join(",")}`,
      ).toBe(true);
    }
  });

  test("ja2en も決定的（二度生成で一致）", () => {
    const a = buildVocabUnits({ ...PACK, idPrefix: "rev", direction: "ja2en" });
    const b = buildVocabUnits({ ...PACK, idPrefix: "rev", direction: "ja2en" });
    expect(a).toEqual(b);
  });

  test("TOEIC600 パック: ja（意味）が一意・各問4択・双方向で生成できる", async () => {
    const { TOEIC600_UNITS, TOEIC600_VOCAB } = await import(
      "@/lib/quiz/vocab/pack_toeic600"
    );
    // 意味の一意性（別解回避の肝）
    const jas = TOEIC600_VOCAB.map((e) => e.ja);
    expect(jas.filter((j, i) => jas.indexOf(j) !== i)).toEqual([]);
    // 英単語の一意性（ja2en の選択肢重複回避）
    const words = TOEIC600_VOCAB.map((e) => e.word);
    expect(words.filter((w, i) => words.indexOf(w) !== i)).toEqual([]);

    const pack600 = {
      subject: "eikaiwa" as const,
      grade: "TOEIC600" as const,
      idPrefix: "eikaiwa-600",
      units: TOEIC600_UNITS,
      vocab: TOEIC600_VOCAB,
    };
    for (const dir of ["en2ja", "ja2en"] as const) {
      const items = buildVocabUnits({ ...pack600, direction: dir }).flatMap(
        (u) => u.items,
      );
      expect(items.length).toBe(TOEIC600_VOCAB.length);
      for (const it of items) {
        expect(it.choices.length, it.id).toBe(4);
        expect(new Set(it.choices).size, `${it.id} 重複`).toBe(4);
      }
    }
  });

  test("TOEIC730 パック: ja・word 一意で双方向に生成できる", async () => {
    const { TOEIC730_UNITS, TOEIC730_VOCAB } = await import(
      "@/lib/quiz/vocab/pack_toeic730"
    );
    const jas = TOEIC730_VOCAB.map((e) => e.ja);
    expect(jas.filter((j, i) => jas.indexOf(j) !== i)).toEqual([]);
    const words = TOEIC730_VOCAB.map((e) => e.word);
    expect(words.filter((w, i) => words.indexOf(w) !== i)).toEqual([]);
    expect(TOEIC730_VOCAB.length).toBe(100);

    const pack730 = {
      subject: "eikaiwa" as const,
      grade: "TOEIC730" as const,
      idPrefix: "eikaiwa-730",
      units: TOEIC730_UNITS,
      vocab: TOEIC730_VOCAB,
    };
    for (const dir of ["en2ja", "ja2en"] as const) {
      const items = buildVocabUnits({ ...pack730, direction: dir }).flatMap(
        (u) => u.items,
      );
      expect(items.length).toBe(100);
      for (const it of items) {
        expect(it.choices.length, it.id).toBe(4);
        expect(new Set(it.choices).size, `${it.id} 重複`).toBe(4);
      }
    }
  });

  test("誤答が3つ揃わないパックはエラーになる（作問ミス検知）", () => {
    const tiny: VocabEntry[] = [
      { word: "a", pos: "名", ja: "あ", unit: 1 },
      { word: "b", pos: "名", ja: "い", unit: 1 },
    ];
    const meta: VocabUnitMeta[] = [{ unit: 1, title: "t", lesson: "l" }];
    expect(() =>
      buildVocabUnits({
        subject: "eikaiwa",
        grade: "TOEIC500",
        idPrefix: "tiny",
        units: meta,
        vocab: tiny,
      }),
    ).toThrow();
  });
});
