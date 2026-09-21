# 語彙パック取込パイプライン（ejdict-hand → VocabEntry TS）

英会話（英単語）トラックの語彙を、辞書データから半自動で量産するためのツール。
生の辞書はアプリに載せず、このスクリプトが「整形済みの語彙パック(TS)」だけを出力する。
出力は `src/lib/quiz/vocab/build.ts` の `buildVocabUnits` がそのまま食える形。

## データ源（CC0）

- ejdict-hand: https://github.com/kujirahand/EJDict （**CC0**＝表示不要・商用可・再配布可）
  - 訳: `src/a.txt`〜`src/z.txt`（`word\tgloss` のタブ区切り、約4.7万件）
  - 単語選定用の頻度リスト: `frequency/100.txt` `frequency/850.txt` `frequency/2000.txt`

取得例（リポジトリ外の作業ディレクトリへ）:

```bash
base=https://raw.githubusercontent.com/kujirahand/EJDict/master
mkdir -p /tmp/ejdict/src /tmp/ejdict/freq
for f in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  curl -sSL -o /tmp/ejdict/src/$f.txt "$base/src/$f.txt"; done
for n in 100 850 2000; do curl -sSL -o /tmp/ejdict/freq/$n.txt "$base/frequency/$n.txt"; done
```

## 使い方

```bash
node scripts/vocab/ingest-ejdict.mjs \
  --src /tmp/ejdict/src --words /tmp/ejdict/freq/2000.txt \
  --subject eikaiwa --grade TOEIC500 --idPrefix eikaiwa-500 \
  --skip 100 --take 60 --chunk 20 --title "頻出語" \
  --varPrefix TOEIC500_GEN --out src/lib/quiz/vocab/generated/pack_gen.ts
```

出力ログに `出力=N語 / M単元 (候補/欠落/品質除外/意味重複)` の内訳が出る（無言の間引きはしない）。

## 品質特性（正直な注意）※重要

- 訳は **辞書の第一義を機械抽出** したもの。次の限界があるため **出題前に人が抜き取り確認** すること:
  - 辞書の第一義が学習者の欲しい語義とズレることがある（例 `bank→土手`／`back→背`）。
    これはクレンジングでは直らない。**語義の選定は人手のキュレーションが要る**。
  - まれに助詞などが残る端例がある（例 `ask→ついて質問する`）。
- 誤答は生成器がパック内の他語の実在意味から選ぶため造語は出ないが、語数が増えると
  近義語が誤答に入る「別解」リスクが上がる。同一パック内で **意味(ja)が重複しない** ように
  スクリプトが自動排除するが、近義は残る。
- したがって本パイプラインは **量産の下書き** 用。学齢の子に出す確定コンテンツは、
  下書きにキュレーション（語義の是正・不適語の除去）を通してから採用する。
