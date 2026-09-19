// 中2英語 追加問題 A — 時制・助動詞・不定詞・動名詞の6単元を計15問に増補。
// 既存 english_j2d.ts の対象6単元と同じ id を使い、items を合体させる仕組みを利用。
// index.ts・english_j2d.ts は一切編集しない。
// 全 item id は <unitId>-m1〜-m7 で既存問題と衝突しない。
// 文法的に正解が一意に定まる問題のみ。不規則動詞スペル・大文字・句読点を確認済み。

import type { QuizUnit } from "@/lib/quiz/types";

export const ENGLISH_J2D_MORE_A: QuizUnit[] = [
  // ================================================================
  // 過去形（+7問）
  // ================================================================
  {
    id: "j2de2-past",
    subject: "english",
    grade: "中2",
    title: "過去形",
    lesson:
      "「〜した」と過去のことを表すのが過去形です。多くの動詞は語尾に -ed をつけます（walk→walked）。ただし不規則に変化する動詞もあります（come→came, make→made, get→got, write→wrote, eat→ate）。疑問文・否定文では did を使い、そのあとの動詞は原形にもどします（Did you eat? / didn't eat）。",
    items: [
      {
        id: "j2de2-past-m1",
        question: "I ___ a lot of pictures at the festival.（私はお祭りでたくさん写真を撮った）",
        choices: ["taked", "took", "take", "takes"],
        answerIndex: 1,
        explanation:
          "take は不規則動詞で、過去形は took です。",
        choiceHints: [
          "take に -ed はつきません。take は不規則動詞で、過去形は took です。",
          null,
          "take は原形です。過去のことなので過去形 took にします。",
          "takes は三人称単数の現在形です。過去のことなので took にします。",
        ],
      },
      {
        id: "j2de2-past-m2",
        question: "She ___ to the store to buy some snacks.（彼女はお菓子を買いに店へ行った）",
        choices: ["goed", "goes", "went", "go"],
        answerIndex: 2,
        explanation:
          "go は不規則動詞で、過去形は went です。",
        choiceHints: [
          "go に -ed はつきません。go は不規則動詞で、過去形は went です。",
          "goes は三人称単数の現在形です。過去のことなので went にします。",
          null,
          "go は原形です。過去のことなので過去形 went にします。",
        ],
      },
      {
        id: "j2de2-past-m3",
        question: "We ___ the movie at the cinema last Sunday.（私たちはこの前の日曜日に映画館でその映画を見た）",
        choices: ["seed", "seen", "saw", "see"],
        answerIndex: 2,
        explanation:
          "see は不規則動詞で、過去形は saw です。seen は過去分詞なので過去形には使いません。",
        choiceHints: [
          "see に -ed はつきません。see の過去形は saw です。",
          "seen は過去分詞です。have などといっしょに使う形で、過去形は saw です。",
          null,
          "see は原形です。last Sunday があるので過去形 saw にします。",
        ],
      },
      {
        id: "j2de2-past-m4",
        question: "My father ___ me a new bag for my birthday.（父は誕生日に新しいかばんを買ってくれた）",
        choices: ["buyed", "buy", "bought", "buys"],
        answerIndex: 2,
        explanation:
          "buy は不規則動詞で、過去形は bought です。",
        choiceHints: [
          "buy に -ed はつきません。buy は不規則動詞で、過去形は bought です。",
          "buy は原形です。過去のことなので過去形 bought にします。",
          null,
          "buys は三人称単数の現在形です。過去のことなので bought にします。",
        ],
      },
      {
        id: "j2de2-past-m5",
        question: "He ___ good English at the school event.（彼は学校行事でじょうずに英語を話した）",
        choices: ["speaked", "spoke", "speaks", "spoken"],
        answerIndex: 1,
        explanation:
          "speak は不規則動詞で、過去形は spoke です。",
        choiceHints: [
          "speak に -ed はつきません。speak の過去形は spoke です。",
          null,
          "speaks は三人称単数の現在形です。過去のことなので spoke にします。",
          "spoken は過去分詞です。have などといっしょに使う形で、過去形は spoke です。",
        ],
      },
      {
        id: "j2de2-past-m6",
        question: "「あなたは先週末、どこへ行きましたか」を表す英文はどれ？",
        choices: [
          "Where did you go last weekend?",
          "Where did you went last weekend?",
          "Where do you go last weekend?",
          "Where you did go last weekend?",
        ],
        answerIndex: 0,
        explanation:
          "過去の疑問文は Did で始め、そのあとの動詞は原形にします。Where did you go 〜? となります。",
        choiceHints: [
          null,
          "Did のあとの動詞は原形にします。went ではなく go です。",
          "Do は現在形の疑問文に使います。過去の疑問文は Did で始めます。",
          "疑問文は文の最初に疑問詞・Did を置きます。did は主語の前に出します。",
        ],
      },
      {
        id: "j2de2-past-m7",
        question: "I ___ the answer to the math problem.（私はその数学の問題の答えを知っていた）",
        choices: ["knowed", "knew", "know", "known"],
        answerIndex: 1,
        explanation:
          "know は不規則動詞で、過去形は knew です。",
        choiceHints: [
          "know に -ed はつきません。know の過去形は knew です。",
          null,
          "know は原形です。過去のことなので過去形 knew にします。",
          "known は過去分詞です。have などといっしょに使う形で、過去形は knew です。",
        ],
      },
    ],
  },

  // ================================================================
  // 過去進行形（+7問）
  // ================================================================
  {
    id: "j2de2-past-progressive",
    subject: "english",
    grade: "中2",
    title: "過去進行形",
    lesson:
      "「（そのとき）〜していた」と、過去のある時点で進行中だった動作を表すのが過去進行形です。〈was / were + 動詞の -ing 形〉で作ります。主語が I・三人称単数のときは was、you・複数のときは were を使います。疑問文は was/were を主語の前に出し、否定文は wasn't / weren't にします。",
    items: [
      {
        id: "j2de2-past-progressive-m1",
        question: "I ___ my homework when the phone rang.（電話が鳴ったとき、私は宿題をしていた）",
        choices: ["was doing", "did", "were doing", "do"],
        answerIndex: 0,
        explanation:
          "主語が I のときの過去進行形は was を使います。was doing となります。",
        choiceHints: [
          null,
          "did だけでは「そのときしていた」という進行の意味を表せません。was doing にします。",
          "were は you や複数の主語に使います。主語 I には was を使います。was doing が正しい形です。",
          "do は現在形です。過去のある時点での動作を表すには was doing にします。",
        ],
      },
      {
        id: "j2de2-past-progressive-m2",
        question: "Ken ___ the guitar at that time.（ケンはそのときギターを弾いていた）",
        choices: ["is playing", "was playing", "were playing", "played"],
        answerIndex: 1,
        explanation:
          "主語 Ken（三人称単数）の過去進行形は was を使います。was playing となります。",
        choiceHints: [
          "is playing は現在進行形です。過去のことなので was playing にします。",
          null,
          "were は複数や you に使います。三人称単数 Ken には was を使います。",
          "played は過去形で「弾いた」ですが、「（そのとき）弾いていた」は was playing です。",
        ],
      },
      {
        id: "j2de2-past-progressive-m3",
        question: "We ___ dinner when they arrived.（彼らが着いたとき、私たちは夕食を食べていた）",
        choices: ["was eating", "were eating", "ate", "is eating"],
        answerIndex: 1,
        explanation:
          "主語 We（複数）の過去進行形は were を使います。were eating となります。",
        choiceHints: [
          "was は I や三人称単数に使います。We には were を使います。",
          null,
          "ate は過去形で「食べた」ですが、「そのとき食べていた」は were eating です。",
          "is eating は現在進行形です。過去のことなので were eating にします。",
        ],
      },
      {
        id: "j2de2-past-progressive-m4",
        question: "My sister ___ not studying at that time.（私の妹はそのとき勉強していなかった）",
        choices: ["is", "did", "was", "were"],
        answerIndex: 2,
        explanation:
          "主語 My sister（三人称単数）の過去進行形の否定は was not（wasn't）を使います。was not studying となります。",
        choiceHints: [
          "is は現在の be動詞です。過去進行形の否定は was を使います。",
          "did は一般動詞の過去に使います。過去進行形の否定は was not です。",
          null,
          "were は複数や you に使います。三人称単数の主語には was を使います。",
        ],
      },
      {
        id: "j2de2-past-progressive-m5",
        question: "___ your brother sleeping when you got home?（あなたが帰ったとき、お兄さんは眠っていましたか）",
        choices: ["Did", "Was", "Were", "Is"],
        answerIndex: 1,
        explanation:
          "主語 your brother（三人称単数）の過去進行形の疑問文は Was を主語の前に出します。Was your brother sleeping 〜? となります。",
        choiceHints: [
          "Did は一般動詞の過去の疑問文に使います。過去進行形の疑問文は Was を使います。",
          null,
          "Were は複数や you に使います。三人称単数の主語には Was を使います。",
          "Is は現在の疑問文に使います。過去進行形は Was を使います。",
        ],
      },
      {
        id: "j2de2-past-progressive-m6",
        question: "It was ___ hard when we left school.（私たちが学校を出たとき、雨がひどく降っていた）",
        choices: ["rain", "rained", "raining", "rains"],
        answerIndex: 2,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。was のあとは raining にします。",
        choiceHints: [
          "was のあとは -ing 形にします。rain ではなく raining です。",
          "rained は過去形です。was のあとは -ing 形の raining にします。",
          null,
          "rains は現在形です。過去進行形は was raining です。",
        ],
      },
      {
        id: "j2de2-past-progressive-m7",
        question: "What ___ you doing at nine last night?（昨夜9時に何をしていましたか）",
        choices: ["did", "are", "were", "was"],
        answerIndex: 2,
        explanation:
          "主語 you の過去進行形の疑問文は Were を使います。What were you doing 〜? となります。",
        choiceHints: [
          "did は一般動詞の過去の疑問文に使います。過去進行形の疑問文は were を使います。",
          "are は現在の疑問文に使います。過去進行形なので were を使います。",
          null,
          "was は I や三人称単数に使います。主語 you には were を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // 未来（will / be going to）（+7問）
  // ================================================================
  {
    id: "j2de2-future",
    subject: "english",
    grade: "中2",
    title: "未来の文（will / be going to）",
    lesson:
      "「〜するつもり」「〜だろう」と未来のことを表すには、〈will + 動詞の原形〉か〈be going to + 動詞の原形〉を使います。will のあとの動詞はいつも原形です。be going to は主語に合わせて am / is / are を使い分けます。否定は won't（will not）や be動詞 + not、疑問は Will 〜? や Is he going to 〜? で表します。",
    items: [
      {
        id: "j2de2-future-m1",
        question: "I ___ going to study abroad next year.（私は来年、留学する予定だ）",
        choices: ["are", "is", "am", "will"],
        answerIndex: 2,
        explanation:
          "be going to の be動詞は主語に合わせます。主語 I には am を使います。am going to study となります。",
        choiceHints: [
          "are は you や複数に使います。主語 I には am を使います。",
          "is は三人称単数に使います。主語 I には am を使います。",
          null,
          "will のときは going to をつけません。be going to には am などの be動詞を使います。",
        ],
      },
      {
        id: "j2de2-future-m2",
        question: "We ___ going to have a party next Saturday.（私たちは次の土曜日にパーティーをする予定だ）",
        choices: ["am", "is", "are", "will"],
        answerIndex: 2,
        explanation:
          "be going to の be動詞は主語に合わせます。主語 We（複数）には are を使います。are going to have となります。",
        choiceHints: [
          "am は主語 I だけに使います。We には are を使います。",
          "is は三人称単数に使います。複数の We には are を使います。",
          null,
          "will のときは going to をつけません。be going to には are などの be動詞を使います。",
        ],
      },
      {
        id: "j2de2-future-m3",
        question: "She will ___ a letter to her friend tonight.（彼女は今夜、友だちに手紙を書くつもりだ）",
        choices: ["writes", "wrote", "written", "write"],
        answerIndex: 3,
        explanation:
          "will のあとの動詞はいつも原形です。will write となります。",
        choiceHints: [
          "will のあとに s はつきません。原形 write にします。",
          "wrote は過去形です。will のあとは原形 write にします。",
          "written は過去分詞です。will のあとは原形 write にします。",
          null,
        ],
      },
      {
        id: "j2de2-future-m4",
        question: "「彼らは明日、サッカーをする予定ですか」を表す英文はどれ？",
        choices: [
          "Are they going to play soccer tomorrow?",
          "Do they going to play soccer tomorrow?",
          "Is they going to play soccer tomorrow?",
          "Will they going to play soccer tomorrow?",
        ],
        answerIndex: 0,
        explanation:
          "be going to の疑問文は be動詞を主語の前に出します。主語 they（複数）には Are を使い、Are they going to play 〜? となります。",
        choiceHints: [
          null,
          "be going to の疑問文に do は使いません。Are they going to 〜? とします。",
          "they（複数）には Is ではなく Are を使います。Are they going to 〜? が正しい形です。",
          "will と be going to は同時には使えません。be going to の疑問文は Are they 〜? です。",
        ],
      },
      {
        id: "j2de2-future-m5",
        question: "It is going to ___ sunny tomorrow.（明日は晴れそうだ）",
        choices: ["is", "be", "being", "been"],
        answerIndex: 1,
        explanation:
          "be going to のあとの動詞は原形です。going to be sunny となります。",
        choiceHints: [
          "is は be動詞の現在形です。going to のあとは原形 be にします。",
          null,
          "being は -ing 形です。going to のあとは原形 be にします。",
          "been は過去分詞です。going to のあとは原形 be にします。",
        ],
      },
      {
        id: "j2de2-future-m6",
        question: "He ___ not going to come to the party.（彼はパーティーには来ない予定だ）",
        choices: ["will", "do", "is", "are"],
        answerIndex: 2,
        explanation:
          "be going to の否定は be動詞のあとに not を置きます。主語 He（三人称単数）には is を使い、is not going to come となります。",
        choiceHints: [
          "will going to とはいえません。be going to の be動詞は is です。",
          "do not going to とは言いません。否定は is not going to です。",
          null,
          "are は複数や you に使います。三人称単数 He には is を使います。",
        ],
      },
      {
        id: "j2de2-future-m7",
        question: "「私はその映画を見るつもりはありません」を表す英文はどれ？",
        choices: [
          "I won't watch the movie.",
          "I will not watching the movie.",
          "I won't watches the movie.",
          "I will watch not the movie.",
        ],
        answerIndex: 0,
        explanation:
          "will の否定は won't（will not）で、そのあとの動詞は原形です。won't watch となります。",
        choiceHints: [
          null,
          "will not のあとは原形にします。watching ではなく watch です。",
          "won't のあとは原形にします。watches ではなく watch です。",
          "not は will のあとに置きます。will not watch が正しい形です。",
        ],
      },
    ],
  },

  // ================================================================
  // 助動詞（+7問）
  // ================================================================
  {
    id: "j2de2-modals",
    subject: "english",
    grade: "中2",
    title: "助動詞（must, have to, may, should など）",
    lesson:
      "助動詞は動詞に意味をそえる言葉です。must（〜しなければならない）、have to（〜しなければならない）、should（〜すべきだ）、may（〜してもよい／〜かもしれない）などがあります。助動詞のあとの動詞はいつも原形です。have to だけは主語が三人称単数のとき has to になります。Will you 〜? は「〜してくれますか」という依頼を表します。",
    items: [
      {
        id: "j2de2-modals-m1",
        question: "You ___ be quiet in the library.（図書館では静かにしなければならない）",
        choices: ["must", "musts", "have", "are"],
        answerIndex: 0,
        explanation:
          "「〜しなければならない」という義務は must で表します。must のあとの動詞は原形です。must be となります。",
        choiceHints: [
          null,
          "must に s はつきません。主語が何であっても must の形は変わりません。",
          "have だけでは「〜しなければならない」の意味になりません。must be にします。",
          "are be とはいえません。「〜しなければならない」は must be です。",
        ],
      },
      {
        id: "j2de2-modals-m2",
        question: "He has to ___ to the hospital tomorrow.（彼は明日、病院へ行かなければならない）",
        choices: ["goes", "went", "going", "go"],
        answerIndex: 3,
        explanation:
          "has to のあとの動詞も原形です。has to go となります。",
        choiceHints: [
          "has to のあとに s はつきません。原形 go にします。",
          "went は過去形です。has to のあとは原形 go にします。",
          "going は -ing 形です。has to のあとは原形 go にします。",
          null,
        ],
      },
      {
        id: "j2de2-modals-m3",
        question: "You ___ run in the hallway.（廊下では走ってはいけません）",
        choices: ["don't have to", "must not", "should", "may"],
        answerIndex: 1,
        explanation:
          "「〜してはいけない」という禁止は must not で表します。don't have to は「〜する必要がない（しなくてもよい）」で意味がちがいます。",
        choiceHints: [
          "don't have to は「〜する必要がない」という意味です。「してはいけない」は must not です。",
          null,
          "should は「〜すべきだ」というアドバイスです。禁止には must not を使います。",
          "may は「〜してもよい」という許可です。禁止には must not を使います。",
        ],
      },
      {
        id: "j2de2-modals-m4",
        question: "___ I use your dictionary for a moment? — Go ahead.（少しの間、辞書を使ってもいいですか。— どうぞ）",
        choices: ["Should", "Will", "Can", "Must"],
        answerIndex: 2,
        explanation:
          "「〜してもいいですか」と許可を求めるとき、Can I 〜? もよく使われます（May I 〜? より少しくだけた表現）。ここでは Can が正解です。",
        choiceHints: [
          "Should I 〜? は「〜すべきですか」です。許可を求めるなら Can（または May）を使います。",
          "Will I 〜? は許可を求める文としてはふつう使いません。Can I 〜? が適切です。",
          null,
          "Must I 〜? は「〜しなければなりませんか」という義務の質問です。許可は Can を使います。",
        ],
      },
      {
        id: "j2de2-modals-m5",
        question: "You look tired. You ___ go home and rest.（疲れているね。家に帰って休んだほうがいい）",
        choices: ["must not", "don't have to", "should", "may not"],
        answerIndex: 2,
        explanation:
          "「〜したほうがよい・〜すべきだ」というアドバイスは should で表します。",
        choiceHints: [
          "must not は「〜してはいけない」という禁止です。アドバイスは should です。",
          "don't have to は「〜する必要がない」です。アドバイスには should を使います。",
          null,
          "may not は「〜してはいけない／〜でないかもしれない」です。助言には should を使います。",
        ],
      },
      {
        id: "j2de2-modals-m6",
        question: "「私は今日、スクールバスに乗らなくてもよい」を表す英文はどれ？",
        choices: [
          "I don't have to take the school bus today.",
          "I must not take the school bus today.",
          "I have not to take the school bus today.",
          "I cannot take the school bus today.",
        ],
        answerIndex: 0,
        explanation:
          "「〜しなくてもよい（必要がない）」は don't have to で表します。must not は「〜してはいけない」という禁止です。",
        choiceHints: [
          null,
          "must not は「〜してはいけない」という禁止です。「必要がない」は don't have to です。",
          "have to の否定は don't have to です。have not to とはしません。",
          "cannot は「〜できない」です。「必要がない」は don't have to です。",
        ],
      },
      {
        id: "j2de2-modals-m7",
        question: "___ you close the window? It's cold.（窓を閉めてくれますか。寒いので）",
        choices: ["Should", "May", "Must", "Could"],
        answerIndex: 3,
        explanation:
          "「〜してくれますか」という依頼には Could you 〜? がよく使われます（Will you 〜? よりていねいな表現）。ここでは Could が正解です。",
        choiceHints: [
          "Should you 〜? は「〜すべきですか」という意味です。依頼には Could（または Will）を使います。",
          "May you 〜? という依頼の言い方はふつうしません。依頼は Could you を使います。",
          "Must you 〜? は「〜しなければなりませんか」です。依頼には Could を使います。",
          null,
        ],
      },
    ],
  },

  // ================================================================
  // 不定詞（+7問）
  // ================================================================
  {
    id: "j2de2-infinitive",
    subject: "english",
    grade: "中2",
    title: "不定詞（to + 動詞の原形）",
    lesson:
      "〈to + 動詞の原形〉を不定詞といいます。to のあとの動詞はいつも原形です。使い方は3つ。名詞的用法「〜すること」（I like to swim.）、副詞的用法「〜するために・〜して」（I got up early to study.）、形容詞的用法「〜するための・〜すべき」（time to sleep）です。",
    items: [
      {
        id: "j2de2-infinitive-m1",
        question: "I decided ___ a new sport this year.（私は今年、新しいスポーツを始めることに決めた）",
        choices: ["try", "to try", "trying", "tried"],
        answerIndex: 1,
        explanation:
          "decide は不定詞〈to + 原形〉をとる動詞です。decide to try で「試みることに決める」を表す名詞的用法です。",
        choiceHints: [
          "decide のあとは to をつけます。try ではなく to try です。",
          null,
          "decide は -ing 形ではなく不定詞をとります。to try が正しい形です。",
          "tried は過去形です。decide のあとは to try にします。",
        ],
      },
      {
        id: "j2de2-infinitive-m2",
        question: "She went to the shop ___ some milk.（彼女は牛乳を買うために店へ行った）",
        choices: ["buy", "to buy", "buying", "bought"],
        answerIndex: 1,
        explanation:
          "「〜するために」と目的を表す副詞的用法の不定詞です。to buy となります。",
        choiceHints: [
          "「〜するために」は to をつけます。buy ではなく to buy です。",
          null,
          "「〜するために」は to + 原形で表します。buying ではなく to buy です。",
          "bought は過去形です。「〜するために」は to buy です。",
        ],
      },
      {
        id: "j2de2-infinitive-m3",
        question: "I need something cold ___.（私は何か冷たいものを飲みたい）",
        choices: ["drink", "to drink", "drinking", "drank"],
        answerIndex: 1,
        explanation:
          "名詞 something を説明する形容詞的用法の不定詞です。something cold to drink で「飲むための冷たい何か」を表します。",
        choiceHints: [
          "名詞 something を説明するときは to をつけます。to drink とします。",
          null,
          "drinking ではなく to + 原形で名詞を説明します。to drink が正しい形です。",
          "drank は過去形です。ここは to drink にします。",
        ],
      },
      {
        id: "j2de2-infinitive-m4",
        question: "It is easy ___ this problem.（この問題を解くのは簡単だ）",
        choices: ["solve", "to solve", "solving", "solved"],
        answerIndex: 1,
        explanation:
          "「It is + 形容詞 + to + 原形」の構文で、「〜するのは…だ」を表す名詞的用法の不定詞です。to solve となります。",
        choiceHints: [
          "「〜するのは簡単だ」は It is easy to + 原形 の形にします。to solve とします。",
          null,
          "solving ではなく to + 原形の形を使います。It is easy to solve が正しい文です。",
          "solved は過去形・過去分詞です。ここは to solve にします。",
        ],
      },
      {
        id: "j2de2-infinitive-m5",
        question: "He was happy ___ his old friend again.（彼は旧友に再会して喜んだ）",
        choices: ["meet", "to meet", "meeting", "met"],
        answerIndex: 1,
        explanation:
          "「〜して（うれしい）」と感情の原因を表す副詞的用法の不定詞です。happy to meet で「会えてうれしい」を表します。",
        choiceHints: [
          "感情の原因は to をつけて表します。meet ではなく to meet です。",
          null,
          "meeting ではなく to + 原形で感情の原因を表します。to meet が正しい形です。",
          "met は過去形です。ここは to meet にします。",
        ],
      },
      {
        id: "j2de2-infinitive-m6",
        question: "We need more time ___ this project.（私たちはこのプロジェクトを終えるためにもっと時間が必要だ）",
        choices: ["finish", "to finish", "finishing", "finished"],
        answerIndex: 1,
        explanation:
          "名詞 time を説明する形容詞的用法、または目的を表す副詞的用法の不定詞です。time to finish で「終えるための時間」を表します。",
        choiceHints: [
          "名詞 time を説明するときは to をつけます。to finish とします。",
          null,
          "finishing ではなく to + 原形で表します。to finish が正しい形です。",
          "finished は過去形・過去分詞です。ここは to finish にします。",
        ],
      },
      {
        id: "j2de2-infinitive-m7",
        question: "She tried ___ the piano every day.（彼女は毎日ピアノを練習しようとした）",
        choices: ["practice", "to practice", "practiced", "practicing"],
        answerIndex: 1,
        explanation:
          "try のあとに不定詞〈to + 原形〉を続けると「〜しようとする」を表します。try to practice となります。",
        choiceHints: [
          "try のあとは to をつけます。practice ではなく to practice です。",
          null,
          "practiced は過去形です。try のあとは to practice にします。",
          "try to do（〜しようとする）と try doing（試しに〜してみる）は意味がちがいます。ここは「しようとした」なので to practice です。",
        ],
      },
    ],
  },

  // ================================================================
  // 動名詞（+7問）
  // ================================================================
  {
    id: "j2de2-gerund",
    subject: "english",
    grade: "中2",
    title: "動名詞（動詞の -ing 形）",
    lesson:
      "動詞に -ing をつけると「〜すること」という意味の名詞（動名詞）になります。enjoy（楽しむ）、finish（終える）、stop（やめる）などの動詞は、目的語に動名詞をとります（enjoy playing）。一方 want（〜したい）や hope（望む）は不定詞をとります（want to play）。前置詞のあとも動名詞になります（before eating）。",
    items: [
      {
        id: "j2de2-gerund-m1",
        question: "I am good at ___ pictures.（私は絵をかくのが得意だ）",
        choices: ["draw", "draws", "drew", "drawing"],
        answerIndex: 3,
        explanation:
          "前置詞 at のあとは動名詞にします。be good at drawing で「絵をかくのが得意だ」を表します。",
        choiceHints: [
          "前置詞 at のあとは -ing 形にします。draw ではなく drawing です。",
          "draws は現在形です。前置詞のあとは動名詞 drawing にします。",
          "drew は過去形です。前置詞 at のあとは -ing 形の drawing にします。",
          null,
        ],
      },
      {
        id: "j2de2-gerund-m2",
        question: "She gave up ___ the piano after the concert.（彼女はコンサートのあとピアノをやめた）",
        choices: ["play", "to play", "played", "playing"],
        answerIndex: 3,
        explanation:
          "give up は目的語に動名詞をとります。give up playing で「弾くのをやめる」を表します。",
        choiceHints: [
          "give up のあとは -ing 形にします。play ではなく playing です。",
          "give up は to 不定詞ではなく動名詞をとります。to play ではなく playing です。",
          "played は過去形です。give up のあとは -ing 形の playing にします。",
          null,
        ],
      },
      {
        id: "j2de2-gerund-m3",
        question: "I'm looking forward to ___ you soon.（すぐにあなたに会えるのを楽しみにしています）",
        choices: ["see", "saw", "seen", "seeing"],
        answerIndex: 3,
        explanation:
          "look forward to の to は前置詞なので、そのあとは動名詞になります。look forward to seeing で「会えるのを楽しみにする」を表します。",
        choiceHints: [
          "look forward to の to は前置詞なので、あとは -ing 形にします。see ではなく seeing です。",
          "saw は過去形です。前置詞 to のあとは動名詞 seeing にします。",
          "seen は過去分詞です。前置詞 to のあとは動名詞 seeing にします。",
          null,
        ],
      },
      {
        id: "j2de2-gerund-m4",
        question: "My hobby is ___ coins from around the world.（私の趣味は世界中のコインを集めることです）",
        choices: ["collect", "collects", "collected", "collecting"],
        answerIndex: 3,
        explanation:
          "be動詞のあとで「〜すること」を表す動名詞を使います。is collecting で「集めることです」を表します。",
        choiceHints: [
          "「〜すること」を主語や補語に使うときは -ing 形にします。collect ではなく collecting です。",
          "collects は現在形です。「集めること」は動名詞 collecting にします。",
          "collected は過去形・過去分詞です。「集めること」は動名詞 collecting にします。",
          null,
        ],
      },
      {
        id: "j2de2-gerund-m5",
        question: "He stopped ___ because it was too hot.（暑すぎたので、彼は走るのをやめた）",
        choices: ["run", "to run", "running", "ran"],
        answerIndex: 2,
        explanation:
          "stop + 動名詞で「〜するのをやめる」を表します。stop running となります。",
        choiceHints: [
          "stop のあとは -ing 形にします。run ではなく running です。",
          "stop to run は「立ち止まって走り始める」という別の意味になってしまいます。「走るのをやめた」は stop running です。",
          null,
          "ran は過去形です。stop のあとは -ing 形の running にします。",
        ],
      },
      {
        id: "j2de2-gerund-m6",
        question: "「英語を話す練習をすることは大切だ」を表す英文はどれ？",
        choices: [
          "Practicing speaking English is important.",
          "To practicing speaking English is important.",
          "Practice speaking English is important.",
          "Practiced speaking English is important.",
        ],
        answerIndex: 0,
        explanation:
          "動名詞は主語になれます。Practicing で始めて「〜することは」を表します。Practicing speaking English is important. となります。",
        choiceHints: [
          null,
          "to のあとは原形にします。to practicing とはしません。主語は動名詞 Practicing です。",
          "動詞の原形 Practice は文頭で主語には使えません。動名詞 Practicing が正しい形です。",
          "Practiced は過去形・過去分詞です。主語には動名詞 Practicing を使います。",
        ],
      },
      {
        id: "j2de2-gerund-m7",
        question: "I'm thinking of ___ a new language this summer.（私はこの夏、新しい言語を学ぼうと考えている）",
        choices: ["learn", "to learn", "learned", "learning"],
        answerIndex: 3,
        explanation:
          "think of の of は前置詞なので、そのあとは動名詞にします。think of learning で「学ぼうと考える」を表します。",
        choiceHints: [
          "前置詞 of のあとは -ing 形にします。learn ではなく learning です。",
          "前置詞 of のあとに to 不定詞は続きません。learning にします。",
          "learned は過去形・過去分詞です。前置詞 of のあとは動名詞 learning にします。",
          null,
        ],
      },
    ],
  },
];
