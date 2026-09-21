#!/usr/bin/env node
// ejdict-hand（CC0）→ 語彙パック(TS) 取込パイプライン。
//
// 生の辞書（src/a.txt..z.txt, 約4.7万件）はアプリに載せない。このスクリプトが
// 「頻度リストで単語を選定 → ejdict から1義のきれいな訳を抽出 → 品質ゲート →
// 意味の重複排除 → VocabEntry[] の TS」を出力する。アプリはその整形済み TS だけを
// 読む（バンドルを太らせない）。出力は buildVocabUnits がそのまま食える形。
//
// 使い方:
//   node scripts/vocab/ingest-ejdict.mjs \
//     --src <ejdict/src dir> --words <freq.txt> \
//     --subject eikaiwa --grade TOEIC500 --idPrefix eikaiwa-500 \
//     --skip 0 --take 60 --chunk 20 --title "頻出語" \
//     --out src/lib/quiz/vocab/generated/pack_xxx.ts --varPrefix TOEIC500
//
// 注意（正直な品質特性）:
// - 抽出は「辞書の第一義」。教材が推す語義とズレることがある（例 quality→特質）。
// - 近義語が誤答に混じる別解リスクは語数とともに上がる。ここでは意味の完全一致は
//   排除するが、近義は残る。最終的な出題品質は「頻度リストの選定＋抜き取り確認」で担保する。

import fs from "node:fs";
import path from "node:path";

// ---- 引数パース ----
function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k.startsWith("--")) {
      const key = k.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      a[key] = v;
    }
  }
  return a;
}

// ---- ejdict 読み込み（word→raw gloss のMap） ----
function loadEjdict(srcDir) {
  const map = new Map();
  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".txt"));
  for (const f of files) {
    const text = fs.readFileSync(path.join(srcDir, f), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const tab = line.indexOf("\t");
      if (tab < 0) continue;
      const word = line.slice(0, tab).trim();
      const gloss = line.slice(tab + 1).trim();
      if (word && gloss && !map.has(word)) map.set(word.toLowerCase(), gloss);
    }
  }
  return map;
}

// ---- 訳のクレンジング（1義のきれいな日本語を1つ取り出す） ----
const MARKER_RE = /[〈《(（{〔［][^〉》)）}〕］]*[〉》)）}〕］]/g;
const BAD_GLOSS_RE =
  /短縮形|接尾辞|接頭辞|の複数形|の過去|の三人称|省略|記号|＝|の変形|の比較級|の最上級/;

function stripMarkers(s) {
  let prev;
  let out = s;
  // 入れ子・連続の括弧マーカーを消えるまで除去
  do {
    prev = out;
    out = out.replace(MARKER_RE, "");
  } while (out !== prev);
  out = out.replace(/[『』「」]/g, ""); // 強調引用符を外す
  out = out.replace(/^[…・\s]+/, "").replace(/[…・\s]+$/, "");
  out = out.replace(/^(を|に|が|は|と|の|へ)/, ""); // 先頭の格助詞を落とす
  return out.trim();
}

function isGoodGloss(s) {
  if (!s) return false;
  if (s.length < 1 || s.length > 12) return false;
  if (/[A-Za-z]/.test(s)) return false; // 相互参照(=them)や英字残りを除外
  if (BAD_GLOSS_RE.test(s)) return false;
  if (/^[0-9０-９]+$/.test(s)) return false;
  return true;
}

/** raw gloss → 1義のきれいな訳（取れなければ null）。 */
function cleanGloss(raw) {
  const senses = raw.split(" / ");
  for (const sense of senses) {
    // まず強調 『...』 を最優先で拾う（＝辞書が推す第一義）。
    const m = sense.match(/『([^』]+)』/);
    let cand = m ? m[1] : sense;
    cand = stripMarkers(cand);
    // 抽出後も区切りが残ることがあるので、最初の1語義に切り詰めてから再整形。
    cand = cand.split(/[,;、；]/)[0];
    cand = stripMarkers(cand);
    if (isGoodGloss(cand)) return cand;
  }
  return null;
}

// ---- メイン ----
const args = parseArgs(process.argv);
const need = ["src", "words", "subject", "grade", "idPrefix", "out", "varPrefix"];
for (const k of need) {
  if (!args[k]) {
    console.error(`missing --${k}`);
    process.exit(1);
  }
}
const skip = Number(args.skip ?? 0);
const take = Number(args.take ?? 60);
const chunk = Number(args.chunk ?? 20);
const title = args.title ?? "語彙";

const dict = loadEjdict(args.src);
const words = fs
  .readFileSync(args.words, "utf8")
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter(Boolean);

const entries = [];
const usedJa = new Set();
let dropped = 0;
let missing = 0;
let dupJa = 0;

for (let i = skip; i < words.length && entries.length < take; i++) {
  const word = words[i];
  if (!/^[a-z][a-z-]*$/.test(word)) continue; // 単一語のみ（記号・句を除外）
  const raw = dict.get(word);
  if (!raw) {
    missing++;
    continue;
  }
  const ja = cleanGloss(raw);
  if (!ja) {
    dropped++;
    continue;
  }
  if (usedJa.has(ja)) {
    dupJa++; // 意味が既出（別解回避のため採用しない）
    continue;
  }
  usedJa.add(ja);
  entries.push({ word, ja, unit: Math.floor(entries.length / chunk) + 1 });
}

const unitCount = Math.max(1, Math.ceil(entries.length / chunk));
const units = [];
for (let u = 1; u <= unitCount; u++) {
  units.push({
    unit: u,
    title: `${title}（${args.grade}・その${u}）`,
    lesson: `${title}を英語→日本語の4択でおぼえよう。誤答は他の語の実在の意味だから、いっしょに語彙が増えるよ。`,
  });
}

// ---- TS 出力 ----
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
const lines = [];
lines.push(
  "// 自動生成ファイル（scripts/vocab/ingest-ejdict.mjs）。手で編集しない。",
  "// 出典: ejdict-hand（CC0）https://github.com/kujirahand/EJDict",
  '// 訳は辞書の第一義を機械抽出したもの。出題前に抜き取り確認すること。',
  'import type { VocabEntry, VocabUnitMeta } from "../types";',
  "",
  `export const ${args.varPrefix}_UNITS: VocabUnitMeta[] = [`,
);
for (const m of units) {
  lines.push(
    `  { unit: ${m.unit}, title: "${esc(m.title)}", lesson: "${esc(m.lesson)}" },`,
  );
}
lines.push("];", "");
lines.push(`export const ${args.varPrefix}_VOCAB: VocabEntry[] = [`);
for (const e of entries) {
  lines.push(`  { word: "${esc(e.word)}", ja: "${esc(e.ja)}", unit: ${e.unit} },`);
}
lines.push("];", "");

fs.mkdirSync(path.dirname(args.out), { recursive: true });
fs.writeFileSync(args.out, lines.join("\n"), "utf8");

console.error(
  `[ingest] 出力=${entries.length}語 / ${unitCount}単元  ` +
    `(候補=${words.length} skip=${skip} 欠落=${missing} 品質除外=${dropped} 意味重複=${dupJa})`,
);
console.error(`[ingest] wrote ${args.out}`);
