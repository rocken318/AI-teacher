// 語彙パック → クイズ単元（QuizUnit[]）の決定的ジェネレーター。
//
// 生成AIは使わない。純ロジックで4択を組み立てる。
//
// 【なぜ決定的でなければならないか】
// 単元はモジュール読み込み時に一度だけ生成される。出題APIは in-memory の
// answerIndex をトークンに封入し、採点APIは同じ in-memory の answerIndex と
// 突き合わせる。サーバーレスで別インスタンスが採点する場合でも一致するよう、
// Math.random / Date を使わず、単語文字列のハッシュだけで安定生成する。
//
// 【誤答の作り方】
// パック内の「他の実在語の意味」から決定的に3つ選ぶ。造語ダミーは出ない。
// 各誤答には「その意味はどの語のものか」を choiceHints で添える（学習効果）。

import type { QuizItem, QuizUnit } from "@/lib/quiz/types";
import type { VocabEntry, VocabPack } from "./types";

/** FNV-1a 32bit ハッシュ（決定的・非負整数）。 */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 1語から4択の QuizItem を決定的に作る。
 * @param entry  対象の語
 * @param pool   誤答の抽出元（通常は同一バンドの全語）
 * @param unitId 単元 id（item id の接頭辞）
 * @param n      単元内の連番（1始まり）
 */
function buildItem(
  entry: VocabEntry,
  pool: VocabEntry[],
  unitId: string,
  n: number,
): QuizItem {
  const answerJa = entry.ja;

  // 誤答候補: 別の語で、意味が正解と異なるもの。
  // this 単語を種にした決定的な順序に並べ、先頭から意味が重複しないよう3つ採る。
  const ordered = pool
    .filter((e) => e.word !== entry.word && e.ja !== answerJa)
    .map((e) => ({ e, k: hash32(`${entry.word}|${e.word}`) }))
    .sort((a, b) => a.k - b.k || (a.e.word < b.e.word ? -1 : 1))
    .map((x) => x.e);

  const distractors: VocabEntry[] = [];
  const usedJa = new Set<string>([answerJa]);
  for (const cand of ordered) {
    if (distractors.length >= 3) break;
    if (usedJa.has(cand.ja)) continue; // 選択肢の重複を避ける
    usedJa.add(cand.ja);
    distractors.push(cand);
  }

  if (distractors.length < 3) {
    // パックが小さすぎる / 同義語だらけ、の作問ミス。ビルド前に気づけるよう即エラー。
    throw new Error(
      `vocab build: "${entry.word}" の誤答が3つ揃いません（パックを増やすか意味の重複を解消してください）`,
    );
  }

  // 正解位置を0〜3に分散（単語ごとに安定）。
  const answerIndex = hash32(entry.word) % 4;

  const choices: string[] = [];
  const hints: (string | null)[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === answerIndex) {
      choices.push(answerJa);
      hints.push(null);
    } else {
      const d = distractors[di++];
      choices.push(d.ja);
      // 「その意味はどの語か」を教える一言（誤答を選んだ子への学習ヒント）。
      hints.push(`「${d.ja}」は ${d.word}。`);
    }
  }

  const posLabel = entry.pos ? `（${entry.pos}）` : "";
  const explanation = entry.example
    ? `${answerJa}${posLabel}。例: ${entry.example}`
    : `${answerJa}${posLabel}。`;

  return {
    id: `${unitId}-${n}`,
    question: `${entry.word} の意味は？`,
    choices,
    answerIndex,
    explanation,
    choiceHints: hints,
  };
}

/**
 * 語彙パックから QuizUnit[] を生成する（決定的）。
 * 誤答はバンド全体の語から選ぶ（ユニットをまたいで復習効果も出る）。
 */
export function buildVocabUnits(pack: VocabPack): QuizUnit[] {
  const pool = pack.vocab;
  return pack.units.map((meta) => {
    const unitId = `${pack.idPrefix}-${meta.unit}`;
    const entries = pool.filter((e) => e.unit === meta.unit);
    const items = entries.map((e, i) => buildItem(e, pool, unitId, i + 1));
    return {
      id: unitId,
      subject: pack.subject,
      grade: pack.grade,
      title: meta.title,
      lesson: meta.lesson,
      items,
    };
  });
}
