// 中学2年 英語（中2）追加問題バンク（english_j2_more）。
// 既存の english_j2.ts の各単元 id と同じ id で追加問題を定義し、
// アプリエンジンが items を合体して各単元を計15問に増やす。
// ※ index.ts の編集は行わない（統合は監督が行う）。
// 文法的に正解が一意に定まる問題のみを収録する。

import type { QuizUnit } from "@/lib/quiz/types";

export const ENGLISH_J2_MORE: QuizUnit[] = [
  // ================================================================
  // 過去形 — 追加 9 問（j2e-past-m1 〜 j2e-past-m9）
  // ================================================================
  {
    id: "j2e-past",
    subject: "english",
    grade: "中2",
    title: "過去形",
    lesson:
      "「〜した」と過去のことを表すのが過去形です。多くの動詞は語尾に -ed をつけます（play→played）。ただし不規則に変化する動詞もあります（go→went, see→saw, have→had, buy→bought）。疑問文・否定文では did を使い、そのあとの動詞は原形にもどします（Did you go? / didn't go）。",
    items: [
      {
        id: "j2e-past-m1",
        question: "They ___ a lot of food at the party last night.（昨夜のパーティーで、彼らはたくさんの食べ物を食べた）",
        choices: ["eat", "eated", "ate", "eaten"],
        answerIndex: 2,
        explanation:
          "eat は不規則動詞で、過去形は ate です。",
        choiceHints: [
          "eat は原形（現在形）です。過去のことなので過去形 ate にします。",
          "eat に -ed はつきません。eat は不規則動詞で、過去形は ate です。",
          null,
          "eaten は過去分詞で、have などといっしょに使う形です。過去形は ate です。",
        ],
      },
      {
        id: "j2e-past-m2",
        question: "She ___ a letter to her friend yesterday.（彼女は昨日、友だちに手紙を書いた）",
        choices: ["writed", "written", "write", "wrote"],
        answerIndex: 3,
        explanation:
          "write は不規則動詞で、過去形は wrote です。",
        choiceHints: [
          "write に -ed はつきません。過去形は wrote です。",
          "written は過去分詞です。過去形は wrote です。",
          "write は原形です。過去のことなので過去形 wrote にします。",
          null,
        ],
      },
      {
        id: "j2e-past-m3",
        question: "He ___ home early because he was tired.（彼は疲れていたので早く家に着いた）",
        choices: ["comed", "came", "come", "comes"],
        answerIndex: 1,
        explanation:
          "come は不規則動詞で、過去形は came です。",
        choiceHints: [
          "come に -ed はつきません。過去形は came です。",
          null,
          "come は原形です。過去のことなので過去形 came にします。",
          "comes は三人称単数の現在形です。過去形は came です。",
        ],
      },
      {
        id: "j2e-past-m4",
        question: "I ___ some pictures at the festival.（私はお祭りで写真を何枚か撮った）",
        choices: ["taked", "tooked", "took", "takes"],
        answerIndex: 2,
        explanation:
          "take は不規則動詞で、過去形は took です。",
        choiceHints: [
          "take に -ed はつきません。過去形は took です。",
          "tooked という形はありません。take の過去形は took です。",
          null,
          "takes は現在形です。過去のことなので過去形 took にします。",
        ],
      },
      {
        id: "j2e-past-m5",
        question: "We ___ fun at the amusement park last Sunday.（私たちはこの前の日曜日、遊園地で楽しんだ）",
        choices: ["have", "haved", "has", "had"],
        answerIndex: 3,
        explanation:
          "have は不規則動詞で、過去形は had です。have fun で「楽しむ」を表します。",
        choiceHints: [
          "have は原形（現在形）です。過去のことなので過去形 had にします。",
          "have に -ed はつきません。過去形は had です。",
          "has は三人称単数の現在形です。過去のことなので had にします。",
          null,
        ],
      },
      {
        id: "j2e-past-m6",
        question: "「あなたは昨日どこへ行きましたか」を表す英文はどれ？",
        choices: [
          "Where did you go yesterday?",
          "Where you went yesterday?",
          "Where did you went yesterday?",
          "Where do you go yesterday?",
        ],
        answerIndex: 0,
        explanation:
          "過去の疑問文は Did で始め、そのあとの動詞は原形にします。Where did you go 〜? となります。",
        choiceHints: [
          null,
          "疑問文は did を主語の前に置きます。Where did you go? が正しい語順です。",
          "did のあとの動詞は原形にします。went ではなく go にします。",
          "do は現在の疑問文に使います。過去の疑問文は did を使います。",
        ],
      },
      {
        id: "j2e-past-m7",
        question: "My father ___ in this company ten years ago.（私の父は10年前、この会社で働いていた）",
        choices: ["work", "works", "worked", "working"],
        answerIndex: 2,
        explanation:
          "ten years ago（10年前）があるので過去形を使います。work は規則動詞で、語尾に -ed をつけて worked になります。",
        choiceHints: [
          "work は原形です。ten years ago があるので過去形 worked にします。",
          "works は現在形です。過去のことなので worked にします。",
          null,
          "working は -ing 形です。単独で過去を表せません。過去形は worked です。",
        ],
      },
      {
        id: "j2e-past-m8",
        question: "She ___ get up late this morning.（彼女は今朝、遅起きしなかった）",
        choices: ["don't", "didn't", "wasn't", "not"],
        answerIndex: 1,
        explanation:
          "一般動詞 get up の過去の否定は didn't（did not）を使います。didn't get up となり、get up は原形のままです。",
        choiceHints: [
          "don't は現在形の否定です。過去の否定は didn't を使います。",
          null,
          "wasn't は be動詞の過去の否定です。一般動詞 get up の否定には didn't を使います。",
          "not だけでは否定文にできません。didn't get up とします。",
        ],
      },
      {
        id: "j2e-past-m9",
        question: "They ___ to a concert last weekend.（彼らはこの前の週末、コンサートに行った）",
        choices: ["goed", "goes", "go", "went"],
        answerIndex: 3,
        explanation:
          "go は不規則動詞で、過去形は went です。last weekend があるので過去形を使います。",
        choiceHints: [
          "go は不規則動詞なので goed とはなりません。過去形は went です。",
          "goes は三人称単数の現在形です。過去のことなので went にします。",
          "go は原形（現在形）です。過去のことなので went にします。",
          null,
        ],
      },
    ],
  },

  // ================================================================
  // 過去進行形 — 追加 9 問（j2e-past-progressive-m1 〜 -m9）
  // ================================================================
  {
    id: "j2e-past-progressive",
    subject: "english",
    grade: "中2",
    title: "過去進行形",
    lesson:
      "「（そのとき）〜していた」と、過去のある時点で進行中だった動作を表すのが過去進行形です。〈was / were + 動詞の -ing 形〉で作ります。主語が I・三人称単数のときは was、you・複数のときは were を使います。疑問文は was/were を主語の前に出し、否定文は wasn't / weren't にします。",
    items: [
      {
        id: "j2e-past-progressive-m1",
        question: "He ___ swimming in the pool at three yesterday.（彼は昨日の3時にプールで泳いでいた）",
        choices: ["is", "was", "were", "did"],
        answerIndex: 1,
        explanation:
          "主語 He（三人称単数）の過去進行形は was を使います。was swimming となります。",
        choiceHints: [
          "is は現在の be動詞です。過去進行形なので was を使います。",
          null,
          "were は you や複数の主語に使います。三人称単数 He には was を使います。",
          "did は一般動詞の過去に使います。過去進行形は was swimming です。",
        ],
      },
      {
        id: "j2e-past-progressive-m2",
        question: "My sister was ___ at the library when I called her.（私が電話したとき、妹は図書館で勉強していた）",
        choices: ["study", "studies", "studied", "studying"],
        answerIndex: 3,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。was のあとは studying にします。",
        choiceHints: [
          "was のあとは -ing 形にします。study ではなく studying です。",
          "studies は現在形です。was のあとは -ing 形の studying にします。",
          "studied は過去形です。was のあとは -ing 形の studying にします。",
          null,
        ],
      },
      {
        id: "j2e-past-progressive-m3",
        question: "What ___ you doing at nine last night?（昨夜9時に、あなたは何をしていましたか）",
        choices: ["was", "were", "did", "are"],
        answerIndex: 1,
        explanation:
          "過去進行形の疑問文は was/were を前に出します。主語 you には were を使い What were you doing 〜? となります。",
        choiceHints: [
          "was は I や三人称単数に使います。主語 you には were を使います。",
          null,
          "did は一般動詞の過去の疑問に使います。過去進行形は were を使います。",
          "are は現在の be動詞です。過去進行形なので were を使います。",
        ],
      },
      {
        id: "j2e-past-progressive-m4",
        question: "The children were ___ a movie then.（子どもたちはそのとき映画を観ていた）",
        choices: ["watch", "watched", "watches", "watching"],
        answerIndex: 3,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。were のあとは watching にします。",
        choiceHints: [
          "were のあとは -ing 形にします。watch ではなく watching です。",
          "watched は過去形です。were のあとは -ing 形の watching にします。",
          "watches は現在形です。were のあとは -ing 形の watching にします。",
          null,
        ],
      },
      {
        id: "j2e-past-progressive-m5",
        question: "I ___ sleeping when the phone rang.（電話が鳴ったとき、私は眠っていなかった）",
        choices: ["wasn't", "weren't", "didn't", "don't"],
        answerIndex: 0,
        explanation:
          "過去進行形の否定は was/were のあとに not を置きます。主語 I には wasn't（was not）を使います。",
        choiceHints: [
          null,
          "weren't は you や複数に使います。主語 I には wasn't を使います。",
          "didn't は一般動詞の過去の否定です。過去進行形の否定は wasn't を使います。",
          "don't は現在の否定です。過去進行形の否定は wasn't sleeping です。",
        ],
      },
      {
        id: "j2e-past-progressive-m6",
        question: "「あなたのお母さんはそのとき台所で料理をしていましたか」を表す英文はどれ？",
        choices: [
          "Was your mother cooking in the kitchen then?",
          "Did your mother cooking in the kitchen then?",
          "Were your mother cooking in the kitchen then?",
          "Was your mother cooked in the kitchen then?",
        ],
        answerIndex: 0,
        explanation:
          "過去進行形の疑問文は was/were を主語の前に出します。主語 your mother（三人称単数）には was を使い Was your mother cooking 〜? となります。",
        choiceHints: [
          null,
          "過去進行形の疑問文に did は使いません。was を前に出して Was your mother cooking 〜? とします。",
          "your mother は三人称単数なので were ではなく was を使います。",
          "was のあとは -ing 形にします。cooked ではなく cooking です。",
        ],
      },
      {
        id: "j2e-past-progressive-m7",
        question: "My parents were ___ TV when I came home.（私が帰宅したとき、両親はテレビを観ていた）",
        choices: ["watching", "watched", "watch", "watches"],
        answerIndex: 0,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。were のあとは watching にします。",
        choiceHints: [
          null,
          "watched は過去形です。were のあとは -ing 形の watching にします。",
          "watch は原形です。were のあとは -ing 形の watching にします。",
          "watches は現在形です。were のあとは -ing 形の watching にします。",
        ],
      },
      {
        id: "j2e-past-progressive-m8",
        question: "Ken and I ___ playing basketball at that time.（ケンと私はそのときバスケットボールをしていた）",
        choices: ["was", "is", "am", "were"],
        answerIndex: 3,
        explanation:
          "主語 Ken and I（複数）の過去進行形は were を使います。were playing となります。",
        choiceHints: [
          "was は I や三人称単数に使います。複数の Ken and I には were を使います。",
          "is は現在の be動詞で、しかも単数用です。過去進行形は were を使います。",
          "am は主語 I（単数）に使います。Ken and I（複数）には were を使います。",
          null,
        ],
      },
      {
        id: "j2e-past-progressive-m9",
        question: "It ___ snowing heavily when I woke up.（目が覚めたとき、雪が激しく降っていた）",
        choices: ["were", "was", "is", "did"],
        answerIndex: 1,
        explanation:
          "主語 It は三人称単数なので、過去進行形では was を使います。was snowing となります。",
        choiceHints: [
          "were は複数や you に使います。主語 It（三人称単数）には was を使います。",
          null,
          "is は現在の be動詞です。過去進行形なので was を使います。",
          "did は一般動詞の過去に使います。過去進行形は was snowing です。",
        ],
      },
    ],
  },

  // ================================================================
  // 未来 — 追加 9 問（j2e-future-m1 〜 j2e-future-m9）
  // ================================================================
  {
    id: "j2e-future",
    subject: "english",
    grade: "中2",
    title: "未来の文（will / be going to）",
    lesson:
      "「〜するつもり」「〜だろう」と未来のことを表すには、〈will + 動詞の原形〉か〈be going to + 動詞の原形〉を使います。will のあとの動詞はいつも原形です。be going to は主語に合わせて am / is / are を使い分けます。否定は won't（will not）や be動詞 + not、疑問は Will 〜? や Are you going to 〜? で表します。",
    items: [
      {
        id: "j2e-future-m1",
        question: "I am going to ___ a new bike next month.（私は来月、新しい自転車を買うつもりだ）",
        choices: ["buys", "bought", "buy", "buying"],
        answerIndex: 2,
        explanation:
          "be going to のあとの動詞は原形です。am going to buy となります。",
        choiceHints: [
          "buys は三人称単数の現在形です。going to のあとは原形 buy にします。",
          "bought は過去形です。going to のあとは原形 buy にします。",
          null,
          "buying は -ing 形です。going to のあとは原形 buy にします。",
        ],
      },
      {
        id: "j2e-future-m2",
        question: "She ___ going to study math tonight.（彼女は今夜、数学を勉強するつもりだ）",
        choices: ["am", "are", "is", "will"],
        answerIndex: 2,
        explanation:
          "be going to の be動詞は主語に合わせます。主語 She（三人称単数）には is を使います。",
        choiceHints: [
          "am は主語 I だけに使います。She には is を使います。",
          "are は you や複数の主語に使います。She には is を使います。",
          null,
          "will のときは going to を続けません。be going to には is などの be動詞を使います。",
        ],
      },
      {
        id: "j2e-future-m3",
        question: "Will you ___ me tomorrow?（明日、私を手伝ってくれますか）",
        choices: ["helping", "helped", "helps", "help"],
        answerIndex: 3,
        explanation:
          "Will のあとの動詞は原形です。Will you help 〜? となります。",
        choiceHints: [
          "will のあとは -ing 形ではなく原形にします。help にします。",
          "helped は過去形です。will のあとは原形 help にします。",
          "helps は三人称単数の現在形です。will のあとは原形 help にします。",
          null,
        ],
      },
      {
        id: "j2e-future-m4",
        question: "「私は明日、ピアノの練習をするつもりはない」を表す英文はどれ？",
        choices: [
          "I'm not going to practice the piano tomorrow.",
          "I don't going to practice the piano tomorrow.",
          "I won't to practice the piano tomorrow.",
          "I'm going to not practice the piano tomorrow.",
        ],
        answerIndex: 0,
        explanation:
          "be going to の否定は be動詞に not をつけます。am not going to practice となります。",
        choiceHints: [
          null,
          "be going to の否定は be動詞に not をつけます。don't ではなく am not going to とします。",
          "won't のあとには to はつけません。will not practice か am not going to practice にします。",
          "not は am の直後に置きます。am not going to practice が正しい語順です。",
        ],
      },
      {
        id: "j2e-future-m5",
        question: "My brother will ___ a doctor in the future.（私の兄は将来、医者になるだろう）",
        choices: ["is", "be", "been", "being"],
        answerIndex: 1,
        explanation:
          "will のあとの動詞は原形です。be動詞の原形は be なので will be となります。",
        choiceHints: [
          "is は現在形です。will のあとは原形 be にします。",
          null,
          "been は過去分詞です。will のあとは原形 be にします。",
          "being は -ing 形です。will のあとは原形 be にします。",
        ],
      },
      {
        id: "j2e-future-m6",
        question: "「彼はその仕事を明日終わらせるつもりですか」を表す英文はどれ？",
        choices: [
          "Is he going to finish the work tomorrow?",
          "Does he going to finish the work tomorrow?",
          "Will he going to finish the work tomorrow?",
          "Is he go to finish the work tomorrow?",
        ],
        answerIndex: 0,
        explanation:
          "be going to の疑問文は be動詞を主語の前に出します。主語 he（三人称単数）には is を使い Is he going to finish 〜? となります。",
        choiceHints: [
          null,
          "be going to の疑問文に does は使いません。is を前に出して Is he going to 〜? とします。",
          "will と be going to は同時に使いません。Is he going to finish 〜? が正しい形です。",
          "going to の going は省略しません。Is he going to finish 〜? とします。",
        ],
      },
      {
        id: "j2e-future-m7",
        question: "It ___ be cold tonight.（今夜は寒くなるだろう）",
        choices: ["wills", "is going", "will", "are going to"],
        answerIndex: 2,
        explanation:
          "「〜だろう」という予想は will で表します。will のあとの be動詞は原形 be です。",
        choiceHints: [
          "will に s はつきません。主語に関係なく will の形は変わりません。",
          "is going だけでは未来を表せません。is going to be のように to が必要です。",
          null,
          "主語 It（単数）には are ではなく is を使います。ここでは will be が自然です。",
        ],
      },
      {
        id: "j2e-future-m8",
        question: "I ___ going to visit Kyoto this summer.（私は今年の夏、京都を訪れるつもりだ）",
        choices: ["is", "are", "am", "will"],
        answerIndex: 2,
        explanation:
          "be going to の be動詞は主語に合わせます。主語 I には am を使います。am going to visit となります。",
        choiceHints: [
          "is は三人称単数に使います。主語 I には am を使います。",
          "are は you や複数に使います。主語 I には am を使います。",
          null,
          "will のときは going to を続けません。be going to には am などの be動詞を使います。",
        ],
      },
      {
        id: "j2e-future-m9",
        question: "They won't ___ to the beach next week.（彼らは来週、ビーチには行かないだろう）",
        choices: ["went", "going", "goes", "go"],
        answerIndex: 3,
        explanation:
          "won't（will not）のあとの動詞は原形です。won't go となります。",
        choiceHints: [
          "went は過去形です。won't のあとは原形 go にします。",
          "going は -ing 形です。won't のあとは原形 go にします。",
          "goes は三人称単数の現在形です。won't のあとは原形 go にします。",
          null,
        ],
      },
    ],
  },

  // ================================================================
  // 助動詞 — 追加 9 問（j2e-modals-m1 〜 j2e-modals-m9）
  // ================================================================
  {
    id: "j2e-modals",
    subject: "english",
    grade: "中2",
    title: "助動詞（can, must, should など）",
    lesson:
      "助動詞は動詞に意味をそえる言葉です。can（〜できる）、could（〜できた／ていねいな依頼）、must（〜しなければならない）、have to（〜しなければならない）、should（〜すべきだ）、may（〜してもよい／〜かもしれない）などがあります。助動詞のあとの動詞はいつも原形です。have to だけは主語が三人称単数のとき has to になります。",
    items: [
      {
        id: "j2e-modals-m1",
        question: "You ___ run in the hallway.（廊下を走ってはいけません）",
        choices: ["must", "must not", "don't have to", "should"],
        answerIndex: 1,
        explanation:
          "「〜してはいけない」という禁止は must not で表します。don't have to は「〜する必要がない」で意味がちがいます。",
        choiceHints: [
          "must は「〜しなければならない」で意味が逆です。禁止は must not です。",
          null,
          "don't have to は「〜する必要がない（不要）」です。禁止は must not です。",
          "should は「〜すべきだ」というアドバイスです。禁止は must not です。",
        ],
      },
      {
        id: "j2e-modals-m2",
        question: "She ___ swim, but she can't run fast.（彼女は泳げるが、速く走れない）",
        choices: ["can", "could", "must", "should"],
        answerIndex: 0,
        explanation:
          "「〜できる」という現在の能力は can で表します。",
        choiceHints: [
          null,
          "could は「〜できた（過去）」か、ていねいな依頼に使います。現在の能力は can です。",
          "must は「〜しなければならない」です。能力を表すのは can です。",
          "should は「〜すべきだ」です。能力を表すのは can です。",
        ],
      },
      {
        id: "j2e-modals-m3",
        question: "I had a bad cold, so I ___ stay home yesterday.（風邪をひいていたので、昨日は家にいなければならなかった）",
        choices: ["must", "have to", "had to", "should"],
        answerIndex: 2,
        explanation:
          "「〜しなければならなかった」という過去の義務は had to で表します。must に過去形はなく、had to を代わりに使います。",
        choiceHints: [
          "must には過去形がありません。「〜しなければならなかった」は had to です。",
          "have to は現在形です。過去の義務は had to にします。",
          null,
          "should は「〜すべきだ」で過去の義務は表せません。had to が正しい形です。",
        ],
      },
      {
        id: "j2e-modals-m4",
        question: "You ___ eat more vegetables. They're good for you.（もっと野菜を食べたほうがいいよ。体にいいから）",
        choices: ["must not", "don't have to", "should", "may not"],
        answerIndex: 2,
        explanation:
          "「〜したほうがよい・〜すべきだ」というアドバイスは should で表します。",
        choiceHints: [
          "must not は「〜してはいけない」という禁止です。アドバイスは should です。",
          "don't have to は「〜する必要がない」です。アドバイスは should です。",
          null,
          "may not は「〜してはいけない／〜でないかもしれない」です。アドバイスは should です。",
        ],
      },
      {
        id: "j2e-modals-m5",
        question: "You ___ bring a dictionary to the test tomorrow.（明日のテストには辞書を持ってこなくていいです）",
        choices: ["must not", "must", "don't have to", "should"],
        answerIndex: 2,
        explanation:
          "「〜する必要がない（しなくていい）」は don't have to で表します。must not（〜してはいけない）とは意味がちがいます。",
        choiceHints: [
          "must not は「〜してはいけない」という禁止です。「必要がない」は don't have to です。",
          "must は「〜しなければならない」で意味が逆です。「必要がない」は don't have to です。",
          null,
          "should は「〜すべきだ」です。「必要がない」は don't have to です。",
        ],
      },
      {
        id: "j2e-modals-m6",
        question: "___ you speak Japanese? — Yes, a little.（日本語を話せますか。— はい、少し）",
        choices: ["Should", "May", "Must", "Can"],
        answerIndex: 3,
        explanation:
          "「〜できますか」と能力を尋ねるときは Can 〜? を使います。",
        choiceHints: [
          "Should は「〜すべきですか」です。能力を尋ねるのは Can です。",
          "May は「〜してもいいですか」という許可です。能力は Can です。",
          "Must は「〜しなければなりませんか」です。能力を尋ねるのは Can です。",
          null,
        ],
      },
      {
        id: "j2e-modals-m7",
        question: "He ___ practice the guitar every day.（彼は毎日ギターを練習しなければならない）",
        choices: ["have to", "has to", "must to", "should to"],
        answerIndex: 1,
        explanation:
          "have to は主語が三人称単数 He のとき has to になります。must to や should to という形はありません。",
        choiceHints: [
          "主語が三人称単数 He なので have to ではなく has to を使います。",
          null,
          "must のあとに to はつきません。must to という形はありません。",
          "should のあとに to はつきません。should to という形はありません。",
        ],
      },
      {
        id: "j2e-modals-m8",
        question: "It ___ rain this afternoon.（今日の午後、雨が降るかもしれない）",
        choices: ["can", "must", "may", "should"],
        answerIndex: 2,
        explanation:
          "「〜かもしれない」という不確かな推量は may で表します。",
        choiceHints: [
          "can は「〜できる」という能力です。推量は may を使います。",
          "must は「〜にちがいない」という強い確信や、「〜しなければならない」という義務です。推量は may です。",
          null,
          "should は「〜すべきだ」です。推量は may を使います。",
        ],
      },
      {
        id: "j2e-modals-m9",
        question: "「窓を開けてもらえますか」をていねいに頼む英文はどれ？",
        choices: [
          "Could you open the window?",
          "Must you open the window?",
          "Should you open the window?",
          "May you open the window?",
        ],
        answerIndex: 0,
        explanation:
          "Could you 〜? は「〜してもらえますか」というていねいな依頼の表現です。",
        choiceHints: [
          null,
          "Must you 〜? は「あなたは〜しなければなりませんか」という意味です。依頼には Could you を使います。",
          "Should you 〜? は「あなたは〜すべきですか」という意味です。依頼には Could you を使います。",
          "May you 〜? は依頼の表現として使いません。依頼は Could you を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // 不定詞 — 追加 9 問（j2e-infinitive-m1 〜 j2e-infinitive-m9）
  // ================================================================
  {
    id: "j2e-infinitive",
    subject: "english",
    grade: "中2",
    title: "不定詞（to + 動詞の原形）",
    lesson:
      "〈to + 動詞の原形〉を不定詞といいます。to のあとの動詞はいつも原形です。使い方は3つ。名詞的用法「〜すること」（I want to play.）、副詞的用法「〜するために」（I went there to see him.）、形容詞的用法「〜するための・〜すべき」（something to eat）です。",
    items: [
      {
        id: "j2e-infinitive-m1",
        question: "She decided ___ a nurse.（彼女は看護師になることを決めた）",
        choices: ["become", "becoming", "to become", "becomes"],
        answerIndex: 2,
        explanation:
          "decide のあとは不定詞〈to + 原形〉を続けます。to become で「なること」を表す名詞的用法です。",
        choiceHints: [
          "decide のあとは to をつけて to become にします。",
          "decide のあとは -ing ではなく to + 原形です。to become が正しい形です。",
          null,
          "becomes は現在形です。decide のあとは to become にします。",
        ],
      },
      {
        id: "j2e-infinitive-m2",
        question: "I hope ___ you again soon.（私はすぐにまたあなたに会えることを望んでいます）",
        choices: ["see", "seeing", "to see", "saw"],
        answerIndex: 2,
        explanation:
          "hope のあとは不定詞〈to + 原形〉を続けます。hope to see で「会えることを望む」を表します。",
        choiceHints: [
          "hope のあとは to をつけて to see にします。",
          "hope のあとは -ing ではなく to + 原形です。to see が正しい形です。",
          null,
          "saw は過去形です。hope のあとは to see にします。",
        ],
      },
      {
        id: "j2e-infinitive-m3",
        question: "He went to the library ___ some books.（彼は本を何冊か借りるために図書館へ行った）",
        choices: ["borrowing", "borrow", "borrowed", "to borrow"],
        answerIndex: 3,
        explanation:
          "「〜するために」と目的を表すのは副詞的用法の不定詞です。to borrow となります。",
        choiceHints: [
          "「〜するために」は to をつけます。borrowing ではなく to borrow です。",
          "「〜するために」は to + 原形で表します。borrow ではなく to borrow です。",
          "borrowed は過去形です。「〜するために」は to borrow です。",
          null,
        ],
      },
      {
        id: "j2e-infinitive-m4",
        question: "Do you have something ___ now?（今、何か食べるものはありますか）",
        choices: ["eat", "eating", "to eat", "eats"],
        answerIndex: 2,
        explanation:
          "something（何か）を説明する形容詞的用法の不定詞です。something to eat で「何か食べるもの」を表します。",
        choiceHints: [
          "something を説明するときは to をつけます。eat ではなく to eat です。",
          "eating ではなく to + 原形で something を説明します。to eat です。",
          null,
          "eats は現在形です。ここは something to eat とします。",
        ],
      },
      {
        id: "j2e-infinitive-m5",
        question: "I need ___ the homework by tomorrow.（私は明日までに宿題を終える必要がある）",
        choices: ["finish", "to finish", "finishing", "finishes"],
        answerIndex: 1,
        explanation:
          "need のあとは不定詞〈to + 原形〉を続けます。need to finish で「終える必要がある」を表します。",
        choiceHints: [
          "need のあとは to をつけて to finish にします。",
          null,
          "need のあとは -ing ではなく to + 原形です。to finish が正しい形です。",
          "finishes は現在形です。need のあとは to finish にします。",
        ],
      },
      {
        id: "j2e-infinitive-m6",
        question: "We were surprised ___ the news.（私たちはその知らせを聞いて驚いた）",
        choices: ["hear", "hearing", "heard", "to hear"],
        answerIndex: 3,
        explanation:
          "「〜して（驚いた）」と感情の原因を表すのは副詞的用法の不定詞です。surprised to hear で「聞いて驚いた」を表します。",
        choiceHints: [
          "感情の原因は to をつけて表します。hear ではなく to hear です。",
          "hearing ではなく to + 原形で表します。to hear が正しい形です。",
          "heard は過去形です。ここは to hear にします。",
          null,
        ],
      },
      {
        id: "j2e-infinitive-m7",
        question: "She has a lot of friends ___ to.（彼女には話しかける友だちがたくさんいる）",
        choices: ["talk", "talked", "talking", "to talk"],
        answerIndex: 3,
        explanation:
          "名詞 friends を説明する形容詞的用法の不定詞です。friends to talk to で「話しかける友だち」を表します。",
        choiceHints: [
          "名詞を説明するときは to をつけます。friends to talk to とします。",
          "talked は過去形です。名詞を説明するには to talk を使います。",
          "talking ではなく to + 原形で名詞を説明します。to talk が正しい形です。",
          null,
        ],
      },
      {
        id: "j2e-infinitive-m8",
        question: "My father stopped at the café ___ a cup of coffee.（父はコーヒーを一杯飲むためにカフェに寄った）",
        choices: ["have", "having", "had", "to have"],
        answerIndex: 3,
        explanation:
          "「〜するために」と目的を表すのは副詞的用法の不定詞です。to have となります。",
        choiceHints: [
          "「〜するために」は to をつけます。have ではなく to have です。",
          "「〜するために」は to + 原形で表します。having ではなく to have です。",
          "had は過去形です。「〜するために」は to have です。",
          null,
        ],
      },
      {
        id: "j2e-infinitive-m9",
        question: "「彼の夢は宇宙飛行士になることだ」を表す英文はどれ？",
        choices: [
          "His dream is to be an astronaut.",
          "His dream is being an astronaut.",
          "His dream is be an astronaut.",
          "His dream is to being an astronaut.",
        ],
        answerIndex: 0,
        explanation:
          "「〜すること」を表す名詞的用法の不定詞を使います。to be で「〜になること」を表し、to のあとは原形 be にします。",
        choiceHints: [
          null,
          "is のあとに「〜すること」を表すには to + 原形を使います。being ではなく to be です。",
          "be だけでは「〜すること」になりません。to be にします。",
          "to のあとは原形にします。to being ではなく to be です。",
        ],
      },
    ],
  },

  // ================================================================
  // 動名詞 — 追加 9 問（j2e-gerund-m1 〜 j2e-gerund-m9）
  // ================================================================
  {
    id: "j2e-gerund",
    subject: "english",
    grade: "中2",
    title: "動名詞（動詞の -ing 形）",
    lesson:
      "動詞に -ing をつけると「〜すること」という意味の名詞（動名詞）になります。enjoy（楽しむ）、finish（終える）、stop（やめる）などの動詞は、目的語に不定詞ではなく動名詞をとります（enjoy playing）。前置詞のあとも動名詞になります（good at swimming）。動名詞は主語にもなれます（Reading is fun.）。",
    items: [
      {
        id: "j2e-gerund-m1",
        question: "He gave up ___ the piano.（彼はピアノを弾くのをあきらめた）",
        choices: ["play", "to play", "played", "playing"],
        answerIndex: 3,
        explanation:
          "give up（あきらめる）は目的語に動名詞をとります。give up playing となります。",
        choiceHints: [
          "give up のあとは -ing 形にします。play ではなく playing です。",
          "give up は to 不定詞ではなく動名詞をとります。to play ではなく playing です。",
          "give up のあとは -ing 形にします。played ではなく playing です。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m2",
        question: "___ a foreign language is very useful.（外国語を学ぶことはとても役に立つ）",
        choices: ["Learn", "To learning", "Learning", "Learns"],
        answerIndex: 2,
        explanation:
          "動名詞は主語「〜すること」になれます。Learning a foreign language で「外国語を学ぶこと」を表します。",
        choiceHints: [
          "主語には原形ではなく動名詞 Learning を使えます。",
          "to のあとは原形です。to learning とはしません。主語は Learning です。",
          null,
          "Learns は現在形の動詞です。主語には動名詞 Learning を使います。",
        ],
      },
      {
        id: "j2e-gerund-m3",
        question: "I'm interested in ___ Japanese history.（私は日本の歴史を勉強することに興味がある）",
        choices: ["study", "to study", "studies", "studying"],
        answerIndex: 3,
        explanation:
          "前置詞 in のあとは動名詞にします。interested in studying で「勉強することに興味がある」を表します。",
        choiceHints: [
          "前置詞 in のあとは -ing 形にします。study ではなく studying です。",
          "前置詞 in のあとに to 不定詞は続きません。studying にします。",
          "studies は現在形です。前置詞のあとは動名詞 studying です。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m4",
        question: "Thank you for ___ me.（私を手伝ってくれてありがとう）",
        choices: ["help", "to help", "helped", "helping"],
        answerIndex: 3,
        explanation:
          "前置詞 for のあとは動名詞にします。Thank you for helping 〜 で「〜してくれてありがとう」を表します。",
        choiceHints: [
          "前置詞 for のあとは -ing 形にします。help ではなく helping です。",
          "前置詞 for のあとに to 不定詞は続きません。helping にします。",
          "helped は過去形です。前置詞のあとは動名詞 helping です。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m5",
        question: "Please stop ___ in class.（授業中に話すのをやめなさい）",
        choices: ["talk", "to talk", "talked", "talking"],
        answerIndex: 3,
        explanation:
          "stop は「〜するのをやめる」の意味では目的語に動名詞をとります。stop talking で「話すのをやめる」を表します。",
        choiceHints: [
          "stop のあとは -ing 形にします。talk ではなく talking です。",
          "「〜するのをやめる」は stop + -ing です。to talk ではなく talking です。",
          "stop のあとは -ing 形にします。talked ではなく talking です。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m6",
        question: "She is afraid of ___ in public.（彼女は人前で話すことを怖がっている）",
        choices: ["speak", "spoke", "to speak", "speaking"],
        answerIndex: 3,
        explanation:
          "前置詞 of のあとは動名詞にします。afraid of speaking で「話すことを怖がっている」を表します。",
        choiceHints: [
          "前置詞 of のあとは -ing 形にします。speak ではなく speaking です。",
          "spoke は過去形です。前置詞のあとは動名詞 speaking です。",
          "前置詞 of のあとに to 不定詞は続きません。speaking にします。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m7",
        question: "He enjoys ___ in the mountains on weekends.（彼は週末に山をハイキングして楽しんでいる）",
        choices: ["hike", "to hike", "hiked", "hiking"],
        answerIndex: 3,
        explanation:
          "enjoy は目的語に動名詞をとります。enjoy hiking で「ハイキングを楽しむ」を表します。",
        choiceHints: [
          "enjoy のあとは -ing 形にします。hike ではなく hiking です。",
          "enjoy は to 不定詞ではなく動名詞をとります。to hike ではなく hiking です。",
          "enjoy のあとは -ing 形にします。hiked ではなく hiking です。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m8",
        question: "I'm looking forward to ___ you next week.（来週あなたに会えることを楽しみにしています）",
        choices: ["see", "saw", "to see", "seeing"],
        answerIndex: 3,
        explanation:
          "look forward to の to は前置詞なので、そのあとは動名詞にします。looking forward to seeing となります。",
        choiceHints: [
          "look forward to の to は前置詞なのでそのあとは -ing 形にします。see ではなく seeing です。",
          "saw は過去形です。前置詞 to のあとは動名詞 seeing にします。",
          "to see の to は不定詞の to ではありません。look forward to は前置詞の to なので seeing にします。",
          null,
        ],
      },
      {
        id: "j2e-gerund-m9",
        question: "My hobby is ___ pictures.（私の趣味は写真を撮ることだ）",
        choices: ["take", "took", "to taking", "taking"],
        answerIndex: 3,
        explanation:
          "動名詞は補語「〜すること」になれます。taking pictures で「写真を撮ること」を表します。",
        choiceHints: [
          "補語に動名詞を使えます。take ではなく taking にします。",
          "took は過去形です。補語には動名詞 taking を使います。",
          "to のあとは原形です。to taking とはしません。taking が正しい形です。",
          null,
        ],
      },
    ],
  },

  // ================================================================
  // 比較 — 追加 9 問（j2e-comparison-m1 〜 j2e-comparison-m9）
  // ================================================================
  {
    id: "j2e-comparison",
    subject: "english",
    grade: "中2",
    title: "比較（比較級・最上級）",
    lesson:
      "2つを比べて「〜より…だ」は比較級、3つ以上で「いちばん…だ」は最上級を使います。短い語は -er / -est（tall→taller→tallest）、長い語は more / most（famous→more famous→most famous）をつけます。good / well は better / best と不規則に変化します。〈as + 原級 + as〉は「〜と同じくらい…」を表します。",
    items: [
      {
        id: "j2e-comparison-m1",
        question: "January is ___ than February.（1月は2月より長い）",
        choices: ["long", "longer", "longest", "more long"],
        answerIndex: 1,
        explanation:
          "2つを比べて「〜より長い」は比較級です。long は短い語なので -er をつけて longer にします。than とセットで使います。",
        choiceHints: [
          "than があるので比較級にします。long ではなく longer です。",
          null,
          "longest は最上級（いちばん長い）です。2つを比べるときは比較級 longer です。",
          "long は短い語なので more はつけません。-er をつけて longer にします。",
        ],
      },
      {
        id: "j2e-comparison-m2",
        question: "Mt. Fuji is the ___ mountain in Japan.（富士山は日本でいちばん高い山だ）",
        choices: ["high", "higher", "highest", "most high"],
        answerIndex: 2,
        explanation:
          "「いちばん高い」は最上級です。high は短い語なので -est をつけて highest にします。the とセットで使います。",
        choiceHints: [
          "the と in Japan があるので最上級にします。high ではなく highest です。",
          "higher は比較級（〜より高い）です。「いちばん」は最上級 highest です。",
          null,
          "high は短い語なので most はつけません。-est をつけて highest にします。",
        ],
      },
      {
        id: "j2e-comparison-m3",
        question: "This bag is ___ than that one.（このかばんはあれより高価だ）",
        choices: ["expensive", "expensiver", "most expensive", "more expensive"],
        answerIndex: 3,
        explanation:
          "expensive は長い語なので、比較級は more をつけて more expensive にします。-er はつけません。",
        choiceHints: [
          "than があるので比較級にします。more expensive とします。",
          "長い語には -er をつけません。more expensive が正しい形です。",
          "most expensive は最上級です。than があるので比較級 more expensive です。",
          null,
        ],
      },
      {
        id: "j2e-comparison-m4",
        question: "Spring is the ___ season of all for me.（私にとって、春はすべての季節のなかでいちばん好きだ）",
        choices: ["good", "better", "goodest", "best"],
        answerIndex: 3,
        explanation:
          "good は不規則に変化し、最上級は best です。of all（すべての中で）があるので最上級を使います。",
        choiceHints: [
          "of all があるので最上級にします。good ではなく best です。",
          "better は比較級（〜より良い）です。「いちばん」は最上級 best です。",
          "good の最上級は goodest ではなく best です。",
          null,
        ],
      },
      {
        id: "j2e-comparison-m5",
        question: "My sister is as ___ as I am.（妹は私と同じくらい背が高い）",
        choices: ["tall", "taller", "tallest", "more tall"],
        answerIndex: 0,
        explanation:
          "〈as + 原級 + as〉は「〜と同じくらい…」を表します。as と as の間は原級（もとの形）の tall にします。",
        choiceHints: [
          null,
          "as 〜 as の間は原級（もとの形）にします。taller ではなく tall です。",
          "tallest は最上級です。as 〜 as の間は原級 tall です。",
          "tall は短い語で more はつけません。as 〜 as の間は原級 tall です。",
        ],
      },
      {
        id: "j2e-comparison-m6",
        question: "Today is ___ than yesterday.（今日は昨日より寒い）",
        choices: ["cold", "colder", "coldest", "more cold"],
        answerIndex: 1,
        explanation:
          "than があるので比較級です。cold は短い語なので -er をつけて colder にします。",
        choiceHints: [
          "than があるので比較級にします。cold ではなく colder です。",
          null,
          "coldest は最上級（いちばん寒い）です。than があるので比較級 colder です。",
          "cold は短い語なので more はつけません。-er をつけて colder にします。",
        ],
      },
      {
        id: "j2e-comparison-m7",
        question: "This is the ___ movie I've ever watched.（これは私がこれまで見た中でいちばん面白い映画だ）",
        choices: ["more interesting", "interesting", "most interesting", "interestingest"],
        answerIndex: 2,
        explanation:
          "「いちばん面白い」は最上級で、interesting は長い語なので most interesting にします。",
        choiceHints: [
          "more interesting は比較級です。「いちばん」は最上級 most interesting です。",
          "the があるので最上級にします。most interesting とします。",
          null,
          "長い語には -est はつけません。most interesting が正しい形です。",
        ],
      },
      {
        id: "j2e-comparison-m8",
        question: "He plays tennis ___ than his brother.（彼はお兄さんより上手にテニスをする）",
        choices: ["good", "well", "better", "best"],
        answerIndex: 2,
        explanation:
          "well（上手に）は不規則に変化し、比較級は better です。than があるので比較級を使います。",
        choiceHints: [
          "good は形容詞です。副詞は well で、比較級は better です。than があるので better にします。",
          "well は原級（もとの形）です。than があるので比較級 better にします。",
          null,
          "best は最上級です。than があるので比較級 better です。",
        ],
      },
      {
        id: "j2e-comparison-m9",
        question: "This river is not as ___ as the Amazon.（この川はアマゾン川ほど長くない）",
        choices: ["longer", "longest", "long", "more long"],
        answerIndex: 2,
        explanation:
          "〈not as + 原級 + as〉は「〜ほど…でない」を表します。as と as の間は原級の long にします。",
        choiceHints: [
          "as 〜 as の間は原級にします。longer ではなく long です。",
          "longest は最上級です。as 〜 as の間は原級 long です。",
          null,
          "long は短い語で more はつけません。as 〜 as の間は原級 long です。",
        ],
      },
    ],
  },

  // ================================================================
  // 接続詞 — 追加 9 問（j2e-conjunction-m1 〜 j2e-conjunction-m9）
  // ================================================================
  {
    id: "j2e-conjunction",
    subject: "english",
    grade: "中2",
    title: "接続詞（when, if, because, that）",
    lesson:
      "接続詞は2つの文をつなぐ言葉です。when（〜するとき）、if（もし〜なら）、because（〜だから・理由）、that（〜ということ）などがあります。when や if が導く文が未来のことでも、その中では現在形を使うのがルールです（When it is fine, we will play.）。that は think や know のあとで「〜ということ」を表します。",
    items: [
      {
        id: "j2e-conjunction-m1",
        question: "She was happy ___ she got a good score on the test.（テストで高得点を取ったので、彼女は嬉しかった）",
        choices: ["when", "if", "that", "because"],
        answerIndex: 3,
        explanation:
          "「〜だから・〜なので」と理由を表すのは because です。",
        choiceHints: [
          "when は「〜のとき」です。理由を表すのは because です。",
          "if は「もし〜なら」です。理由を表すのは because です。",
          "that は「〜ということ」です。理由を表すのは because です。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m2",
        question: "I believe ___ he will come back soon.（彼がすぐに戻ってくると私は信じている）",
        choices: ["when", "because", "if", "that"],
        answerIndex: 3,
        explanation:
          "believe のあとで「〜ということ」を表すのは接続詞 that です。",
        choiceHints: [
          "when は「〜のとき」です。believe のあとで「〜ということ」は that です。",
          "because は「〜だから」です。「〜ということ」を表すのは that です。",
          "if は「もし〜なら」です。ここでは「〜ということ」の that を使います。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m3",
        question: "___ you study hard, you will pass the exam.（一生懸命勉強すれば、試験に合格するだろう）",
        choices: ["Because", "When", "That", "If"],
        answerIndex: 3,
        explanation:
          "「もし〜なら」と条件を表すのは if です。",
        choiceHints: [
          "because は「〜だから」です。条件を表すのは if です。",
          "when は「〜のとき」です。「もし〜なら」は if です。",
          "that は「〜ということ」です。条件を表すのは if です。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m4",
        question: "Please call me ___ you arrive at the station.（駅に着いたら電話してください）",
        choices: ["because", "that", "if", "when"],
        answerIndex: 3,
        explanation:
          "「〜したとき・〜したら」と時を表すのは when です。",
        choiceHints: [
          "because は「〜だから」です。「〜したとき」は when です。",
          "that は「〜ということ」です。「〜したとき」は when です。",
          "if は「もし〜なら」です。ここは確実に起きることなので when を使います。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m5",
        question: "If it ___ tomorrow, we will cancel the game.（もし明日雨なら、試合を中止する）",
        choices: ["will rain", "rained", "rains", "raining"],
        answerIndex: 2,
        explanation:
          "if が導く文の中では、未来のことでも現在形を使うのがルールです。will は使わず rains にします。",
        choiceHints: [
          "if の文の中では未来でも will を使いません。現在形 rains にします。",
          "rained は過去形です。ここは現在形 rains を使います。",
          null,
          "raining は -ing 形です。単独では使えません。現在形 rains にします。",
        ],
      },
      {
        id: "j2e-conjunction-m6",
        question: "I was sad ___ my dog was sick.（私は犬が病気だったので悲しかった）",
        choices: ["when", "that", "if", "because"],
        answerIndex: 3,
        explanation:
          "「〜だから・〜なので」と理由を表すのは because です。",
        choiceHints: [
          "when は「〜のとき」です。理由を表すのは because です。",
          "that は「〜ということ」です。理由を表すのは because です。",
          "if は「もし〜なら」です。理由を表すのは because です。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m7",
        question: "___ I got home, dinner was already ready.（私が帰宅したとき、夕食はすでに準備ができていた）",
        choices: ["Because", "If", "That", "When"],
        answerIndex: 3,
        explanation:
          "「〜したとき」と時を表すのは when です。",
        choiceHints: [
          "because は「〜だから」です。「〜のとき」は when です。",
          "if は「もし〜なら」です。「〜のとき」は when です。",
          "that は「〜ということ」です。「〜のとき」は when です。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m8",
        question: "Do you know ___ Tom lives in this town?（トムがこの町に住んでいるって知っていますか）",
        choices: ["when", "because", "if", "that"],
        answerIndex: 3,
        explanation:
          "know のあとで「〜ということ」を表すのは接続詞 that です。",
        choiceHints: [
          "when は「〜のとき」です。「〜ということ」を表すのは that です。",
          "because は「〜だから」です。「〜ということ」を表すのは that です。",
          "if は「〜かどうか」という間接疑問にも使いますが、この文では that が自然です。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-m9",
        question: "When I ___ up, I will be a scientist.（大人になったら、私は科学者になりたい）",
        choices: ["will grow", "grew", "growing", "grow"],
        answerIndex: 3,
        explanation:
          "when が導く文の中では、未来のことでも現在形を使うのがルールです。will は使わず grow にします。",
        choiceHints: [
          "when の文の中では未来でも will を使いません。現在形 grow にします。",
          "grew は過去形です。ここは現在形 grow を使います。",
          "growing は -ing 形です。単独では使えません。現在形 grow にします。",
          null,
        ],
      },
    ],
  },
];
