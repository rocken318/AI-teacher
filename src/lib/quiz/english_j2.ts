// 中学2年 英語（中2）の問題バンク（english_j2）。
// 生成AIに作問・採点・解説をさせず、人手で作問・文法確認した正確な選択式問題を固定する。
// 採点はエンジン側が answerIndex とユーザー選択のインデックス比較で行う。
//
// - answerIndex は 0 始まりで、文法的に正しい選択肢を指す。
// - すべての item に choiceHints（choices と同じ長さ）を付け、誤答の選択肢には
//   「その選択肢を選んだ子への、ありがちな勘違いを正すやさしい一言」を、正解の index には null を入れる。
// - 単元 id は接頭辞 j2e- のケバブケースでグローバル一意。items の id も単元内で一意。
//   既存の english.ts（eng-* 系）とは衝突しない。

import type { QuizUnit } from "@/lib/quiz/types";

export const ENGLISH_UNITS_J2: QuizUnit[] = [
  // ================================================================
  // 過去形（規則動詞・不規則動詞、疑問・否定 did）
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
        id: "j2e-past-1",
        question: "I ___ soccer with my friends yesterday.（私は昨日、友だちとサッカーをした）",
        choices: ["play", "played", "plays", "playing"],
        answerIndex: 1,
        explanation:
          "「昨日した」という過去のことなので、規則動詞 play は語尾に -ed をつけて played にします。",
        choiceHints: [
          "play は現在形（原形）です。yesterday があるので過去形 played にします。",
          null,
          "plays は現在形で、しかも三人称単数のときの形です。過去のことなので played にします。",
          "playing は -ing 形です。単独で「〜した」を表せません。過去形は played です。",
        ],
      },
      {
        id: "j2e-past-2",
        question: "We ___ to the zoo last Sunday.（私たちはこの前の日曜日、動物園へ行った）",
        choices: ["goed", "went", "gone", "going"],
        answerIndex: 1,
        explanation:
          "go は不規則動詞で、過去形は went です。-ed はつけません。",
        choiceHints: [
          "go は不規則動詞なので goed とはなりません。正しい過去形は went です。",
          null,
          "gone は過去分詞で、have などといっしょに使う形です。ここでの過去形は went です。",
          "going は -ing 形です。「〜へ行った」という過去形は went です。",
        ],
      },
      {
        id: "j2e-past-3",
        question: "She ___ a beautiful bird in the park.（彼女は公園で美しい鳥を見た）",
        choices: ["seed", "saw", "seen", "sees"],
        answerIndex: 1,
        explanation:
          "see は不規則動詞で、過去形は saw です。",
        choiceHints: [
          "see に -ed はつきません。see は不規則動詞で、過去形は saw です。",
          null,
          "seen は過去分詞で、have などといっしょに使う形です。過去形は saw です。",
          "sees は現在形です。過去のことなので saw を使います。",
        ],
      },
      {
        id: "j2e-past-4",
        question: "「あなたは昨夜、宿題をしましたか」を表す英文はどれ？",
        choices: [
          "Did you do your homework last night?",
          "Do you did your homework last night?",
          "Did you did your homework last night?",
          "You did your homework last night?",
        ],
        answerIndex: 0,
        explanation:
          "過去の疑問文は Did で始め、そのあとの動詞は原形にします。do（する）の原形をそのまま使い Did you do 〜? となります。",
        choiceHints: [
          null,
          "Do は現在形の疑問文に使います。過去の疑問文は Did で始めます。",
          "Did のあとの動詞は原形にします。did を続けず Did you do 〜? とします。",
          "疑問文は文の最初に Did を置きます。ふつうの語順のままでは疑問文になりません。",
        ],
      },
      {
        id: "j2e-past-5",
        question: "I ___ a new bag last week.（私は先週、新しいかばんを買った）",
        choices: ["buyed", "buied", "bought", "buy"],
        answerIndex: 2,
        explanation:
          "buy は不規則動詞で、過去形は bought です。",
        choiceHints: [
          "buy に -ed はつきません。buy は不規則動詞で、過去形は bought です。",
          "buy を buied とはしません。正しい過去形は bought です。",
          null,
          "buy は原形です。last week があるので過去形 bought にします。",
        ],
      },
      {
        id: "j2e-past-6",
        question: "He ___ watch TV yesterday.（彼は昨日テレビを見なかった）",
        choices: ["doesn't", "didn't", "wasn't", "isn't"],
        answerIndex: 1,
        explanation:
          "過去の否定文は didn't（did not）を使い、そのあとの動詞は原形にします。didn't watch となります。",
        choiceHints: [
          "doesn't は現在形の否定に使います。過去の否定文は didn't を使います。",
          null,
          "wasn't は be動詞の過去の否定です。一般動詞 watch の否定には didn't を使います。",
          "isn't は be動詞の現在の否定です。過去の一般動詞の否定は didn't です。",
        ],
      },
    ],
  },

  // ================================================================
  // 過去進行形（was/were + -ing）
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
        id: "j2e-past-progressive-1",
        question: "I ___ reading a book at eight last night.（私は昨夜8時に本を読んでいた）",
        choices: ["am", "was", "were", "did"],
        answerIndex: 1,
        explanation:
          "主語が I のときの過去進行形は was を使います。was reading で「読んでいた」を表します。",
        choiceHints: [
          "am は現在の be動詞です。過去進行形なので was を使います。",
          null,
          "were は you や複数の主語に使います。主語 I には was を使います。",
          "did は一般動詞の過去の疑問・否定に使います。過去進行形は was reading です。",
        ],
      },
      {
        id: "j2e-past-progressive-2",
        question: "They ___ playing tennis then.（彼らはそのときテニスをしていた）",
        choices: ["was", "were", "are", "did"],
        answerIndex: 1,
        explanation:
          "主語が They（複数）のときの過去進行形は were を使います。were playing となります。",
        choiceHints: [
          "was は I や三人称単数に使います。複数の They には were を使います。",
          null,
          "are は現在の be動詞です。過去進行形なので were を使います。",
          "did は一般動詞の過去に使います。過去進行形は were playing です。",
        ],
      },
      {
        id: "j2e-past-progressive-3",
        question: "She was ___ dinner when I called her.（私が電話したとき、彼女は夕食を作っていた）",
        choices: ["cook", "cooks", "cooking", "cooked"],
        answerIndex: 2,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。was のあとは cooking にします。",
        choiceHints: [
          "was のあとは -ing 形にします。cook ではなく cooking です。",
          "cooks は現在形です。過去進行形は was cooking です。",
          null,
          "cooked は過去形です。was のあとは -ing 形の cooking にします。",
        ],
      },
      {
        id: "j2e-past-progressive-4",
        question: "「あなたはそのとき勉強していましたか」を表す英文はどれ？",
        choices: [
          "Were you studying then?",
          "Did you studying then?",
          "You were studying then?",
          "Was you studying then?",
        ],
        answerIndex: 0,
        explanation:
          "過去進行形の疑問文は was/were を主語の前に出します。主語 you には were を使い Were you studying 〜? となります。",
        choiceHints: [
          null,
          "過去進行形の疑問文に did は使いません。were を前に出して Were you studying 〜? とします。",
          "疑問文は were を主語の前に置きます。ふつうの語順のままでは疑問文になりません。",
          "主語 you には was ではなく were を使います。Were you 〜? が正しい形です。",
        ],
      },
      {
        id: "j2e-past-progressive-5",
        question: "It ___ raining when I got up this morning.（今朝起きたとき、雨が降っていた）",
        choices: ["were", "was", "is", "did"],
        answerIndex: 1,
        explanation:
          "主語 It は三人称単数なので、過去進行形では was を使います。was raining となります。",
        choiceHints: [
          "were は複数や you に使います。主語 It（三人称単数）には was を使います。",
          null,
          "is は現在の be動詞です。過去のことなので was を使います。",
          "did は一般動詞の過去に使います。過去進行形は was raining です。",
        ],
      },
      {
        id: "j2e-past-progressive-6",
        question: "We ___ watching TV at that time.（私たちはそのときテレビを見ていなかった）",
        choices: ["wasn't", "weren't", "didn't", "aren't"],
        answerIndex: 1,
        explanation:
          "過去進行形の否定は was/were のあとに not を置きます。主語 We（複数）には weren't（were not）を使います。",
        choiceHints: [
          "wasn't は I や三人称単数に使います。複数の We には weren't を使います。",
          null,
          "didn't は一般動詞の過去の否定です。過去進行形の否定は weren't を使います。",
          "aren't は現在の否定です。過去進行形の否定は weren't watching です。",
        ],
      },
    ],
  },

  // ================================================================
  // 未来（will / be going to、疑問・否定）
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
        id: "j2e-future-1",
        question: "I will ___ my grandmother next week.（私は来週、祖母を訪ねるつもりだ）",
        choices: ["visit", "visits", "visited", "visiting"],
        answerIndex: 0,
        explanation:
          "will のあとの動詞はいつも原形です。will visit となります。",
        choiceHints: [
          null,
          "visits は三人称単数の現在形です。will のあとは原形 visit にします。",
          "visited は過去形です。will のあとは原形 visit にします。",
          "visiting は -ing 形です。will のあとは原形 visit にします。",
        ],
      },
      {
        id: "j2e-future-2",
        question: "She is going to ___ tennis this afternoon.（彼女は今日の午後テニスをする予定だ）",
        choices: ["plays", "played", "play", "playing"],
        answerIndex: 2,
        explanation:
          "be going to のあとの動詞も原形です。is going to play となります。",
        choiceHints: [
          "plays は現在形です。going to のあとは原形 play にします。",
          "played は過去形です。going to のあとは原形 play にします。",
          null,
          "playing は -ing 形です。going to のあとは原形 play にします。",
        ],
      },
      {
        id: "j2e-future-3",
        question: "They ___ going to have a party tomorrow.（彼らは明日パーティーを開く予定だ）",
        choices: ["is", "am", "are", "will"],
        answerIndex: 2,
        explanation:
          "be going to の be動詞は主語に合わせます。主語 They（複数）には are を使います。",
        choiceHints: [
          "is は三人称単数に使います。複数の They には are を使います。",
          "am は主語 I だけに使います。They には are を使います。",
          null,
          "will のときは going to をつけません。be going to には are などの be動詞を使います。",
        ],
      },
      {
        id: "j2e-future-4",
        question: "「彼は明日来ないだろう」を表す英文はどれ？",
        choices: [
          "He won't come tomorrow.",
          "He doesn't come tomorrow.",
          "He won't comes tomorrow.",
          "He not will come tomorrow.",
        ],
        answerIndex: 0,
        explanation:
          "will の否定は won't（will not）です。そのあとの動詞は原形なので won't come となります。",
        choiceHints: [
          null,
          "doesn't は現在の否定です。未来の否定は won't を使います。",
          "won't のあとは原形にします。comes ではなく come です。",
          "not は will のあとに置きます。will not（won't）come tomorrow が正しい形です。",
        ],
      },
      {
        id: "j2e-future-5",
        question: "「あなたは今週末、何をするつもりですか」を表す英文はどれ？",
        choices: [
          "What are you going to do this weekend?",
          "What you are going to do this weekend?",
          "What do you going to do this weekend?",
          "What are you going to doing this weekend?",
        ],
        answerIndex: 0,
        explanation:
          "be going to の疑問文は be動詞を主語の前に出します。What are you going to do 〜? となり、do は原形です。",
        choiceHints: [
          null,
          "疑問文は are を主語 you の前に出します。What are you going to 〜? が正しい語順です。",
          "be going to の疑問文に do は使いません。are you going to do 〜? とします。",
          "going to のあとは原形にします。doing ではなく do です。",
        ],
      },
      {
        id: "j2e-future-6",
        question: "It ___ be sunny tomorrow.（明日は晴れるだろう）",
        choices: ["will", "wills", "is going", "are going to"],
        answerIndex: 0,
        explanation:
          "「〜だろう」という予想は will で表します。will be sunny となり、will のあとは原形 be です。",
        choiceHints: [
          null,
          "will に s はつきません。主語が何であっても will の形は変わりません。",
          "is going だけでは未来を表せません。is going to be のように to が必要です。",
          "主語 It（単数）には are ではなく is を使います。ここでは will be が自然です。",
        ],
      },
    ],
  },

  // ================================================================
  // 助動詞（can/could, must/have to, should, may）
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
        id: "j2e-modals-1",
        question: "She can ___ the piano very well.（彼女はとても上手にピアノをひける）",
        choices: ["plays", "play", "played", "playing"],
        answerIndex: 1,
        explanation:
          "助動詞 can のあとの動詞は原形です。can play となります。",
        choiceHints: [
          "can のあとに s はつきません。原形 play にします。",
          null,
          "played は過去形です。can のあとは原形 play にします。",
          "playing は -ing 形です。can のあとは原形 play にします。",
        ],
      },
      {
        id: "j2e-modals-2",
        question: "You ___ finish this work today.（あなたは今日この仕事を終えなければならない）",
        choices: ["must", "can", "may", "should not"],
        answerIndex: 0,
        explanation:
          "「〜しなければならない」という強い義務は must で表します。",
        choiceHints: [
          null,
          "can は「〜できる」という意味です。「〜しなければならない」は must です。",
          "may は「〜してもよい」という許可の意味です。義務は must です。",
          "should not は「〜すべきでない」です。「しなければならない」は must です。",
        ],
      },
      {
        id: "j2e-modals-3",
        question: "He ___ to get up early every morning.（彼は毎朝早く起きなければならない）",
        choices: ["have", "has", "must", "should"],
        answerIndex: 1,
        explanation:
          "「〜しなければならない」を have to で表すとき、主語が三人称単数 He なら has to になります。",
        choiceHints: [
          "主語が三人称単数 He なので have ではなく has を使います。",
          null,
          "must なら to はいりません。to があるので has to の has を入れます。",
          "should は「〜すべきだ」で、そのあとに to はつきません。ここは has to です。",
        ],
      },
      {
        id: "j2e-modals-4",
        question: "You ___ see a doctor. You look sick.（医者に診てもらったほうがいいよ。具合が悪そうだ）",
        choices: ["should", "must not", "can't", "may not"],
        answerIndex: 0,
        explanation:
          "「〜したほうがよい・〜すべきだ」というアドバイスは should で表します。",
        choiceHints: [
          null,
          "must not は「〜してはいけない」という禁止です。アドバイスは should です。",
          "can't は「〜できない」です。「〜したほうがよい」は should です。",
          "may not は「〜してはいけない／〜でないかもしれない」です。助言には should を使います。",
        ],
      },
      {
        id: "j2e-modals-5",
        question: "___ I use your pen? — Sure.（あなたのペンを使ってもいいですか。— いいですよ）",
        choices: ["Must", "May", "Should", "Am"],
        answerIndex: 1,
        explanation:
          "「〜してもいいですか」と許可を求めるときは May I 〜? を使います。",
        choiceHints: [
          "Must I 〜? は「〜しなければなりませんか」という義務の意味です。許可は May です。",
          null,
          "Should I 〜? は「〜すべきですか」という相談です。許可を求めるなら May です。",
          "Am は be動詞です。許可を求めるときは助動詞 May を使います。",
        ],
      },
      {
        id: "j2e-modals-6",
        question: "「私たちは今日、学校に行く必要がない」を表す英文はどれ？",
        choices: [
          "We don't have to go to school today.",
          "We must not go to school today.",
          "We haven't to go to school today.",
          "We don't must go to school today.",
        ],
        answerIndex: 0,
        explanation:
          "「〜する必要がない」は don't have to で表します。must not は「〜してはいけない」という禁止で意味がちがいます。",
        choiceHints: [
          null,
          "must not は「〜してはいけない」という禁止です。「必要がない」は don't have to です。",
          "have to の否定は don't have to です。haven't to とはしません。",
          "must は助動詞なので don't とはいっしょに使いません。don't have to にします。",
        ],
      },
    ],
  },

  // ================================================================
  // 不定詞（to + 動詞の原形：名詞的・形容詞的・副詞的用法）
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
        id: "j2e-infinitive-1",
        question: "I want ___ a soccer player.（私はサッカー選手になりたい）",
        choices: ["be", "to be", "being", "to being"],
        answerIndex: 1,
        explanation:
          "want のあとは不定詞〈to + 原形〉を続けます。to be で「〜になること」を表す名詞的用法です。",
        choiceHints: [
          "want のあとは to をつけて to be にします。",
          null,
          "want のあとは -ing ではなく to + 原形です。to be が正しい形です。",
          "to のあとは原形にします。to being ではなく to be です。",
        ],
      },
      {
        id: "j2e-infinitive-2",
        question: "She went to the store ___ some milk.（彼女は牛乳を買うためにお店へ行った）",
        choices: ["buy", "buys", "to buy", "buying"],
        answerIndex: 2,
        explanation:
          "「〜するために」と目的を表すのは副詞的用法の不定詞です。to buy となります。",
        choiceHints: [
          "「〜するために」は to をつけます。buy ではなく to buy です。",
          "buys は三人称単数の現在形です。「〜するために」は to buy です。",
          null,
          "「〜するために」は to + 原形で表します。buying ではなく to buy です。",
        ],
      },
      {
        id: "j2e-infinitive-3",
        question: "I have a lot of homework ___ today.（私は今日、やるべき宿題がたくさんある）",
        choices: ["do", "to do", "doing", "does"],
        answerIndex: 1,
        explanation:
          "名詞のあとに置いて「〜すべき・〜するための」と説明するのは形容詞的用法の不定詞です。homework to do で「やるべき宿題」を表します。",
        choiceHints: [
          "名詞を説明するときは to をつけます。homework to do とします。",
          null,
          "doing ではなく to + 原形で名詞を説明します。to do が正しい形です。",
          "does は三人称単数の現在形です。ここは to do にします。",
        ],
      },
      {
        id: "j2e-infinitive-4",
        question: "My dream is ___ around the world.（私の夢は世界中を旅することだ）",
        choices: ["travel", "to travel", "traveled", "travels"],
        answerIndex: 1,
        explanation:
          "「〜すること」と主語や補語になるのは名詞的用法の不定詞です。to travel となります。",
        choiceHints: [
          "「〜すること」は to をつけます。travel ではなく to travel です。",
          null,
          "traveled は過去形です。「〜すること」は to travel です。",
          "travels は現在形です。「〜すること」は to travel です。",
        ],
      },
      {
        id: "j2e-infinitive-5",
        question: "Would you like something ___?（何か飲むものはいかがですか）",
        choices: ["drink", "drinking", "to drink", "drinks"],
        answerIndex: 2,
        explanation:
          "something（何か）を説明する形容詞的用法の不定詞です。something to drink で「何か飲むもの」を表します。",
        choiceHints: [
          "something を説明するときは to をつけます。to drink にします。",
          "drinking ではなく to + 原形で something を説明します。to drink です。",
          null,
          "drinks は現在形です。ここは something to drink とします。",
        ],
      },
      {
        id: "j2e-infinitive-6",
        question: "He was very happy ___ the news.（彼はその知らせを聞いてとても喜んだ）",
        choices: ["hear", "to hear", "hearing", "heard"],
        answerIndex: 1,
        explanation:
          "「〜して（うれしい）」と感情の原因を表すのは副詞的用法の不定詞です。happy to hear で「聞いてうれしい」を表します。",
        choiceHints: [
          "感情の原因は to をつけて表します。hear ではなく to hear です。",
          null,
          "hearing ではなく to + 原形で表します。to hear が正しい形です。",
          "heard は過去形です。ここは to hear にします。",
        ],
      },
    ],
  },

  // ================================================================
  // 動名詞（-ing を目的語に：enjoy / finish / stop など）
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
        id: "j2e-gerund-1",
        question: "I enjoyed ___ soccer with my friends.（私は友だちとサッカーをして楽しんだ）",
        choices: ["play", "to play", "playing", "played"],
        answerIndex: 2,
        explanation:
          "enjoy は目的語に動名詞（-ing 形）をとります。enjoy playing となります。",
        choiceHints: [
          "enjoy のあとは原形ではなく -ing 形にします。playing です。",
          "enjoy は to 不定詞ではなく動名詞をとります。to play ではなく playing です。",
          null,
          "enjoy のあとは -ing 形です。played ではなく playing です。",
        ],
      },
      {
        id: "j2e-gerund-2",
        question: "Please finish ___ your homework before dinner.（夕食の前に宿題を終えなさい）",
        choices: ["doing", "to do", "do", "did"],
        answerIndex: 0,
        explanation:
          "finish は目的語に動名詞をとります。finish doing となります。",
        choiceHints: [
          null,
          "finish は to 不定詞ではなく動名詞をとります。to do ではなく doing です。",
          "finish のあとは -ing 形にします。do ではなく doing です。",
          "finish のあとは -ing 形にします。did ではなく doing です。",
        ],
      },
      {
        id: "j2e-gerund-3",
        question: "It stopped ___ in the afternoon.（午後には雨がやんだ）",
        choices: ["rain", "to rain", "raining", "rained"],
        answerIndex: 2,
        explanation:
          "stop は目的語に動名詞をとります。stop raining で「降るのをやめる＝雨がやむ」を表します。",
        choiceHints: [
          "stop のあとは -ing 形にします。rain ではなく raining です。",
          "「〜するのをやめる」は stop + -ing です。to rain ではなく raining です。",
          null,
          "stop のあとは -ing 形にします。rained ではなく raining です。",
        ],
      },
      {
        id: "j2e-gerund-4",
        question: "___ books is a lot of fun.（本を読むことはとても楽しい）",
        choices: ["Read", "Reading", "To reading", "Reads"],
        answerIndex: 1,
        explanation:
          "動名詞は主語（〜すること）になれます。Reading books で「本を読むこと」を表します。",
        choiceHints: [
          "主語には原形ではなく動名詞を使えます。Read ではなく Reading です。",
          null,
          "to のあとは原形です。to reading とはしません。主語は Reading です。",
          "Reads は現在形の動詞です。主語には動名詞 Reading を使います。",
        ],
      },
      {
        id: "j2e-gerund-5",
        question: "She is good at ___.（彼女は泳ぐのが得意だ）",
        choices: ["swim", "swims", "to swim", "swimming"],
        answerIndex: 3,
        explanation:
          "前置詞 at のあとは動名詞にします。good at swimming で「泳ぐのが得意」を表します。",
        choiceHints: [
          "前置詞 at のあとは -ing 形にします。swim ではなく swimming です。",
          "swims は現在形です。前置詞のあとは動名詞 swimming です。",
          "前置詞 at のあとに to 不定詞は続きません。swimming にします。",
          null,
        ],
      },
      {
        id: "j2e-gerund-6",
        question: "How about ___ tea?（お茶を飲むのはどうですか）",
        choices: ["have", "having", "to have", "had"],
        answerIndex: 1,
        explanation:
          "How about のあとや前置詞 about のあとは動名詞にします。having tea となります。",
        choiceHints: [
          "about のあとは -ing 形にします。have ではなく having です。",
          null,
          "about のあとに to 不定詞は続きません。having にします。",
          "about のあとは -ing 形にします。had ではなく having です。",
        ],
      },
    ],
  },

  // ================================================================
  // 比較（比較級・最上級・as ~ as、better/best）
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
        id: "j2e-comparison-1",
        question: "Ken is ___ than Tom.（ケンはトムより背が高い）",
        choices: ["tall", "taller", "tallest", "more tall"],
        answerIndex: 1,
        explanation:
          "2つを比べて「〜より高い」は比較級です。tall は短い語なので -er をつけて taller にします。than とセットで使います。",
        choiceHints: [
          "than があるので比較級にします。tall ではなく taller です。",
          null,
          "tallest は最上級（いちばん高い）です。2つを比べるときは比較級 taller です。",
          "tall は短い語なので more はつけません。-er をつけて taller にします。",
        ],
      },
      {
        id: "j2e-comparison-2",
        question: "This is the ___ mountain in Japan.（これは日本でいちばん高い山だ）",
        choices: ["high", "higher", "highest", "most high"],
        answerIndex: 2,
        explanation:
          "「いちばん高い」は最上級です。high は短い語なので -est をつけて highest にします。the をつけるのがふつうです。",
        choiceHints: [
          "the と in Japan があるので最上級にします。high ではなく highest です。",
          "higher は比較級（〜より高い）です。「いちばん」は最上級 highest です。",
          null,
          "high は短い語なので most はつけません。-est をつけて highest にします。",
        ],
      },
      {
        id: "j2e-comparison-3",
        question: "This book is ___ than that one.（この本はあの本よりおもしろい）",
        choices: ["interesting", "interestinger", "more interesting", "most interesting"],
        answerIndex: 2,
        explanation:
          "interesting は長い語なので、比較級は more をつけて more interesting にします。-er はつけません。",
        choiceHints: [
          "than があるので比較級にします。more interesting とします。",
          "長い語には -er をつけません。more interesting が正しい形です。",
          null,
          "most interesting は最上級です。2つを比べるときは more interesting です。",
        ],
      },
      {
        id: "j2e-comparison-4",
        question: "Soccer is ___ than baseball for me.（私にとって、サッカーは野球より人気がある）",
        choices: ["popularer", "more popular", "most popular", "popular"],
        answerIndex: 1,
        explanation:
          "popular は長めの語なので、比較級は more popular にします。-er はつけません。",
        choiceHints: [
          "popular に -er はつけません。more popular が正しい形です。",
          null,
          "most popular は最上級です。than があるので比較級 more popular です。",
          "than があるので比較級にします。popular ではなく more popular です。",
        ],
      },
      {
        id: "j2e-comparison-5",
        question: "She can run as ___ as her brother.（彼女はお兄さんと同じくらい速く走れる）",
        choices: ["fast", "faster", "fastest", "more fast"],
        answerIndex: 0,
        explanation:
          "〈as + 原級 + as〉は「〜と同じくらい…」を表します。as と as の間は比較級ではなく原級（もとの形）の fast にします。",
        choiceHints: [
          null,
          "as 〜 as の間は原級（もとの形）にします。faster ではなく fast です。",
          "fastest は最上級です。as 〜 as の間は原級 fast です。",
          "fast は短い語で more はつけません。as 〜 as の間は原級 fast です。",
        ],
      },
      {
        id: "j2e-comparison-6",
        question: "This computer is ___ than mine.（このコンピューターは私のより良い）",
        choices: ["gooder", "more good", "better", "best"],
        answerIndex: 2,
        explanation:
          "good は不規則に変化する語で、比較級は better です。gooder や more good とはしません。",
        choiceHints: [
          "good は不規則変化で gooder とはなりません。比較級は better です。",
          "good に more はつけません。比較級は better です。",
          null,
          "best は最上級（いちばん良い）です。than があるので比較級 better です。",
        ],
      },
    ],
  },

  // ================================================================
  // 接続詞（when / if / because / that、文の接続）
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
        id: "j2e-conjunction-1",
        question: "___ I was a child, I lived in Osaka.（私が子どものとき、大阪に住んでいた）",
        choices: ["When", "Because", "That", "If"],
        answerIndex: 0,
        explanation:
          "「〜するとき」と時を表すのは when です。",
        choiceHints: [
          null,
          "because は「〜だから」と理由を表します。「〜のとき」は when です。",
          "that は「〜ということ」を表します。「〜のとき」は when です。",
          "if は「もし〜なら」と条件を表します。「〜のとき」は when です。",
        ],
      },
      {
        id: "j2e-conjunction-2",
        question: "I was late ___ I missed the bus.（私はバスに乗り遅れたので遅刻した）",
        choices: ["when", "if", "because", "that"],
        answerIndex: 2,
        explanation:
          "「〜だから・〜なので」と理由を表すのは because です。",
        choiceHints: [
          "when は「〜のとき」です。理由を表すのは because です。",
          "if は「もし〜なら」です。理由を表すのは because です。",
          null,
          "that は「〜ということ」です。理由を表すのは because です。",
        ],
      },
      {
        id: "j2e-conjunction-3",
        question: "___ you are free tomorrow, let's go shopping.（もし明日ひまなら、買い物に行こう）",
        choices: ["When", "Because", "If", "That"],
        answerIndex: 2,
        explanation:
          "「もし〜なら」と条件を表すのは if です。",
        choiceHints: [
          "when は「〜のとき」です。「もし〜なら」は if です。",
          "because は「〜だから」です。条件を表すのは if です。",
          null,
          "that は「〜ということ」です。条件を表すのは if です。",
        ],
      },
      {
        id: "j2e-conjunction-4",
        question: "I think ___ this book is interesting.（私はこの本はおもしろいと思う）",
        choices: ["when", "if", "because", "that"],
        answerIndex: 3,
        explanation:
          "think のあとで「〜ということ」を表すのは接続詞 that です。この that は省略することもできます。",
        choiceHints: [
          "when は「〜のとき」です。think のあとで「〜ということ」は that です。",
          "if は「もし〜なら」です。ここでは「〜ということ」の that を使います。",
          "because は「〜だから」です。ここでは「〜ということ」の that を使います。",
          null,
        ],
      },
      {
        id: "j2e-conjunction-5",
        question: "When it ___ sunny tomorrow, we will go hiking.（明日晴れたら、ハイキングに行く）",
        choices: ["is", "will be", "was", "be"],
        answerIndex: 0,
        explanation:
          "when が導く文の中では、未来のことでも現在形を使うのがルールです。will は使わず is にします。",
        choiceHints: [
          null,
          "when の文の中では未来でも will を使いません。現在形 is にします。",
          "was は過去形です。明日のことなので現在形 is を使います。",
          "主語 it には be動詞の be ではなく is を使います。When it is sunny とします。",
        ],
      },
      {
        id: "j2e-conjunction-6",
        question: "I know ___ she is a good singer.（私は彼女が上手な歌手だと知っている）",
        choices: ["because", "if", "that", "when"],
        answerIndex: 2,
        explanation:
          "know のあとで「〜ということ」を表すのは接続詞 that です。",
        choiceHints: [
          "because は「〜だから」です。「〜ということ」を表すのは that です。",
          "if は「もし〜なら」です。ここでは「〜ということ」の that を使います。",
          null,
          "when は「〜のとき」です。「〜ということ」を表すのは that です。",
        ],
      },
    ],
  },
];
