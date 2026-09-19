// 中学2年 英語（中2）の追加問題バンク（english_j2d）。
// 生成AIに作問・採点・解説をさせず、人手で作問・文法確認した正確な選択式問題を固定する。
// 採点はエンジン側が answerIndex とユーザー選択のインデックス比較で行う。
//
// - answerIndex は 0 始まりで、文法的に正しい選択肢を指す。
// - すべての item に choiceHints（choices と同じ長さ）を付け、誤答の選択肢には
//   「その選択肢を選んだ子への、ありがちな勘違いを正すやさしい一言」を、正解の index には null を入れる。
// - 単元 id は接頭辞 j2de2- のケバブケースでグローバル一意。items の id も単元内で一意。
//   既存の english.ts（eng-* 系）や english_j2.ts（j2e-* 系）とは衝突しない。

import type { QuizUnit } from "@/lib/quiz/types";

export const ENGLISH_UNITS_J2D: QuizUnit[] = [
  // ================================================================
  // 過去形（規則動詞・不規則動詞・疑問否定）
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
        id: "j2de2-past-1",
        question: "I ___ to school with Ken yesterday.（私は昨日、ケンといっしょに学校へ歩いていった）",
        choices: ["walk", "walks", "walked", "walking"],
        answerIndex: 2,
        explanation:
          "「昨日した」という過去のことなので、規則動詞 walk は語尾に -ed をつけて walked にします。",
        choiceHints: [
          "walk は現在形（原形）です。yesterday があるので過去形 walked にします。",
          "walks は三人称単数の現在形です。過去のことなので walked にします。",
          null,
          "walking は -ing 形です。単独で「〜した」を表せません。過去形は walked です。",
        ],
      },
      {
        id: "j2de2-past-2",
        question: "He ___ home late last night.（彼は昨夜おそく家に帰ってきた）",
        choices: ["comed", "came", "come", "comes"],
        answerIndex: 1,
        explanation:
          "come は不規則動詞で、過去形は came です。-ed はつけません。",
        choiceHints: [
          "come は不規則動詞なので comed とはなりません。正しい過去形は came です。",
          null,
          "come は原形です。last night があるので過去形 came にします。",
          "comes は三人称単数の現在形です。過去のことなので came にします。",
        ],
      },
      {
        id: "j2de2-past-3",
        question: "She ___ a cake for the party.（彼女はパーティーのためにケーキを作った）",
        choices: ["maked", "made", "make", "makes"],
        answerIndex: 1,
        explanation:
          "make は不規則動詞で、過去形は made です。",
        choiceHints: [
          "make に -ed はつきません。make は不規則動詞で、過去形は made です。",
          null,
          "make は原形です。過去のことなので made にします。",
          "makes は三人称単数の現在形です。過去のことなので made にします。",
        ],
      },
      {
        id: "j2de2-past-4",
        question: "We ___ curry for dinner last night.（私たちは昨夜、夕食にカレーを食べた）",
        choices: ["eat", "eated", "ate", "eaten"],
        answerIndex: 2,
        explanation:
          "eat は不規則動詞で、過去形は ate です。",
        choiceHints: [
          "eat は原形です。last night があるので過去形 ate にします。",
          "eat に -ed はつきません。eat は不規則動詞で、過去形は ate です。",
          null,
          "eaten は過去分詞で、have などといっしょに使う形です。過去形は ate です。",
        ],
      },
      {
        id: "j2de2-past-5",
        question: "Tom ___ a letter to his friend.（トムは友だちに手紙を書いた）",
        choices: ["writed", "wrote", "written", "writes"],
        answerIndex: 1,
        explanation:
          "write は不規則動詞で、過去形は wrote です。",
        choiceHints: [
          "write に -ed はつきません。write は不規則動詞で、過去形は wrote です。",
          null,
          "written は過去分詞で、have などといっしょに使う形です。過去形は wrote です。",
          "writes は三人称単数の現在形です。過去のことなので wrote にします。",
        ],
      },
      {
        id: "j2de2-past-6",
        question: "「あなたは昨日、テニスをしましたか」を表す英文はどれ？",
        choices: [
          "Did you play tennis yesterday?",
          "Do you play tennis yesterday?",
          "Did you played tennis yesterday?",
          "You did play tennis yesterday?",
        ],
        answerIndex: 0,
        explanation:
          "過去の疑問文は Did で始め、そのあとの動詞は原形にします。play をそのまま使い Did you play 〜? となります。",
        choiceHints: [
          null,
          "Do は現在形の疑問文に使います。過去の疑問文は Did で始めます。",
          "Did のあとの動詞は原形にします。played ではなく play です。",
          "疑問文は文の最初に Did を置きます。ふつうの語順では疑問文になりません。",
        ],
      },
      {
        id: "j2de2-past-7",
        question: "I ___ my key this morning.（私は今朝、かぎをなくした）",
        choices: ["losed", "lost", "lose", "loses"],
        answerIndex: 1,
        explanation:
          "lose は不規則動詞で、過去形は lost です。",
        choiceHints: [
          "lose に -ed はつきません。lose は不規則動詞で、過去形は lost です。",
          null,
          "lose は原形です。this morning があるので過去形 lost にします。",
          "loses は三人称単数の現在形です。過去のことなので lost にします。",
        ],
      },
      {
        id: "j2de2-past-8",
        question: "She ___ study math last night.（彼女は昨夜、数学を勉強しなかった）",
        choices: ["doesn't", "don't", "didn't", "wasn't"],
        answerIndex: 2,
        explanation:
          "過去の否定文は didn't（did not）を使い、そのあとの動詞は原形にします。didn't study となります。",
        choiceHints: [
          "doesn't は現在形の否定に使います。過去の否定文は didn't を使います。",
          "don't も現在形の否定です。過去の一般動詞の否定は didn't です。",
          null,
          "wasn't は be動詞の過去の否定です。一般動詞 study の否定には didn't を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // 過去進行形（was/were + -ing）
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
        id: "j2de2-past-progressive-1",
        question: "He ___ sleeping when I came home.（私が帰ってきたとき、彼は眠っていた）",
        choices: ["was", "were", "is", "did"],
        answerIndex: 0,
        explanation:
          "主語が He（三人称単数）のときの過去進行形は was を使います。was sleeping となります。",
        choiceHints: [
          null,
          "were は you や複数の主語に使います。主語 He には was を使います。",
          "is は現在の be動詞です。過去進行形なので was を使います。",
          "did は一般動詞の過去に使います。過去進行形は was sleeping です。",
        ],
      },
      {
        id: "j2de2-past-progressive-2",
        question: "The children ___ playing in the park then.（子どもたちはそのとき公園で遊んでいた）",
        choices: ["was", "is", "were", "are"],
        answerIndex: 2,
        explanation:
          "主語が The children（複数）のときの過去進行形は were を使います。were playing となります。",
        choiceHints: [
          "was は I や三人称単数に使います。複数の主語には were を使います。",
          "is は現在の be動詞で、単数に使います。ここは were です。",
          null,
          "are は現在の be動詞です。過去進行形なので were を使います。",
        ],
      },
      {
        id: "j2de2-past-progressive-3",
        question: "I was ___ a letter at that time.（私はそのとき手紙を書いていた）",
        choices: ["write", "writes", "writing", "wrote"],
        answerIndex: 2,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。was のあとは writing にします。",
        choiceHints: [
          "was のあとは -ing 形にします。write ではなく writing です。",
          "writes は現在形です。過去進行形は was writing です。",
          null,
          "wrote は過去形です。was のあとは -ing 形の writing にします。",
        ],
      },
      {
        id: "j2de2-past-progressive-4",
        question: "「彼らはそのとき何をしていましたか」を表す英文はどれ？",
        choices: [
          "What were they doing then?",
          "What did they doing then?",
          "What was they doing then?",
          "What they were doing then?",
        ],
        answerIndex: 0,
        explanation:
          "過去進行形の疑問文は was/were を主語の前に出します。主語 they には were を使い What were they doing 〜? となります。",
        choiceHints: [
          null,
          "過去進行形の疑問文に did は使いません。were を前に出して What were they doing 〜? とします。",
          "主語 they（複数）には was ではなく were を使います。What were they 〜? が正しい形です。",
          "疑問詞のあとは were を主語の前に置きます。ふつうの語順のままでは疑問文になりません。",
        ],
      },
      {
        id: "j2de2-past-progressive-5",
        question: "My mother ___ cooking when I got up.（私が起きたとき、母は料理をしていた）",
        choices: ["were", "was", "is", "did"],
        answerIndex: 1,
        explanation:
          "主語 My mother は三人称単数なので、過去進行形では was を使います。was cooking となります。",
        choiceHints: [
          "were は複数や you に使います。三人称単数の主語には was を使います。",
          null,
          "is は現在の be動詞です。過去のことなので was を使います。",
          "did は一般動詞の過去に使います。過去進行形は was cooking です。",
        ],
      },
      {
        id: "j2de2-past-progressive-6",
        question: "You ___ listening to me then.（あなたはそのとき私の話を聞いていなかった）",
        choices: ["wasn't", "weren't", "didn't", "aren't"],
        answerIndex: 1,
        explanation:
          "過去進行形の否定は was/were のあとに not を置きます。主語 You には weren't（were not）を使います。",
        choiceHints: [
          "wasn't は I や三人称単数に使います。主語 You には weren't を使います。",
          null,
          "didn't は一般動詞の過去の否定です。過去進行形の否定は weren't を使います。",
          "aren't は現在の否定です。過去進行形の否定は weren't listening です。",
        ],
      },
      {
        id: "j2de2-past-progressive-7",
        question: "They ___ having lunch at noon.（彼らは正午に昼食を食べていた）",
        choices: ["was", "were", "are", "did"],
        answerIndex: 1,
        explanation:
          "主語 They（複数）の過去進行形は were を使います。were having となります。",
        choiceHints: [
          "was は I や三人称単数に使います。複数の They には were を使います。",
          null,
          "are は現在の be動詞です。過去進行形なので were を使います。",
          "did は一般動詞の過去に使います。過去進行形は were having です。",
        ],
      },
      {
        id: "j2de2-past-progressive-8",
        question: "I was ___ for the bus at that time.（私はそのときバスを待っていた）",
        choices: ["wait", "waits", "waiting", "waited"],
        answerIndex: 2,
        explanation:
          "過去進行形は〈was/were + 動詞の -ing 形〉です。was のあとは waiting にします。",
        choiceHints: [
          "was のあとは -ing 形にします。wait ではなく waiting です。",
          "waits は現在形です。過去進行形は was waiting です。",
          null,
          "waited は過去形です。was のあとは -ing 形の waiting にします。",
        ],
      },
    ],
  },

  // ================================================================
  // 未来表現（will / be going to）
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
        id: "j2de2-future-1",
        question: "I will ___ my homework after dinner.（私は夕食後に宿題をするつもりだ）",
        choices: ["do", "does", "did", "doing"],
        answerIndex: 0,
        explanation:
          "will のあとの動詞はいつも原形です。will do となります。",
        choiceHints: [
          null,
          "does は三人称単数の現在形です。will のあとは原形 do にします。",
          "did は過去形です。will のあとは原形 do にします。",
          "doing は -ing 形です。will のあとは原形 do にします。",
        ],
      },
      {
        id: "j2de2-future-2",
        question: "He is going to ___ his uncle next month.（彼は来月おじさんを訪ねる予定だ）",
        choices: ["visits", "visited", "visit", "visiting"],
        answerIndex: 2,
        explanation:
          "be going to のあとの動詞も原形です。is going to visit となります。",
        choiceHints: [
          "visits は現在形です。going to のあとは原形 visit にします。",
          "visited は過去形です。going to のあとは原形 visit にします。",
          null,
          "visiting は -ing 形です。going to のあとは原形 visit にします。",
        ],
      },
      {
        id: "j2de2-future-3",
        question: "She ___ going to buy a new bike.（彼女は新しい自転車を買う予定だ）",
        choices: ["are", "am", "is", "will"],
        answerIndex: 2,
        explanation:
          "be going to の be動詞は主語に合わせます。主語 She（三人称単数）には is を使います。",
        choiceHints: [
          "are は you や複数に使います。三人称単数の She には is を使います。",
          "am は主語 I だけに使います。She には is を使います。",
          null,
          "will のときは going to をつけません。be going to には is などの be動詞を使います。",
        ],
      },
      {
        id: "j2de2-future-4",
        question: "「私は明日、テレビを見ないつもりだ」を表す英文はどれ？",
        choices: [
          "I won't watch TV tomorrow.",
          "I don't watch TV tomorrow.",
          "I won't watches TV tomorrow.",
          "I not will watch TV tomorrow.",
        ],
        answerIndex: 0,
        explanation:
          "will の否定は won't（will not）です。そのあとの動詞は原形なので won't watch となります。",
        choiceHints: [
          null,
          "don't は現在の否定です。未来の否定は won't を使います。",
          "won't のあとは原形にします。watches ではなく watch です。",
          "not は will のあとに置きます。will not（won't）watch が正しい形です。",
        ],
      },
      {
        id: "j2de2-future-5",
        question: "「彼は明日ここに来ますか」を表す英文はどれ？",
        choices: [
          "Will he come here tomorrow?",
          "He will come here tomorrow?",
          "Will he comes here tomorrow?",
          "Does he will come here tomorrow?",
        ],
        answerIndex: 0,
        explanation:
          "will の疑問文は will を主語の前に出します。Will he come 〜? となり、come は原形です。",
        choiceHints: [
          null,
          "疑問文は will を主語 he の前に出します。ふつうの語順のままでは疑問文になりません。",
          "will のあとは原形にします。comes ではなく come です。",
          "will の疑問文に does は使いません。Will he come 〜? とします。",
        ],
      },
      {
        id: "j2de2-future-6",
        question: "They are going to ___ a movie tonight.（彼らは今夜、映画を見る予定だ）",
        choices: ["watch", "watches", "watched", "watching"],
        answerIndex: 0,
        explanation:
          "be going to のあとの動詞は原形です。are going to watch となります。",
        choiceHints: [
          null,
          "watches は現在形です。going to のあとは原形 watch にします。",
          "watched は過去形です。going to のあとは原形 watch にします。",
          "watching は -ing 形です。going to のあとは原形 watch にします。",
        ],
      },
      {
        id: "j2de2-future-7",
        question: "It ___ be cold tomorrow.（明日は寒くなるだろう）",
        choices: ["will", "wills", "is going", "does"],
        answerIndex: 0,
        explanation:
          "「〜だろう」という予想は will で表します。will be cold となり、will のあとは原形 be です。",
        choiceHints: [
          null,
          "will に s はつきません。主語が何であっても will の形は変わりません。",
          "is going だけでは未来を表せません。is going to be のように to が必要です。",
          "does は現在形の助動詞です。未来は will be を使います。",
        ],
      },
      {
        id: "j2de2-future-8",
        question: "I am going to ___ my grandparents this weekend.（私は今週末、祖父母を訪ねる予定だ）",
        choices: ["see", "sees", "saw", "seeing"],
        answerIndex: 0,
        explanation:
          "be going to のあとの動詞は原形です。am going to see となります。",
        choiceHints: [
          null,
          "sees は現在形です。going to のあとは原形 see にします。",
          "saw は過去形です。going to のあとは原形 see にします。",
          "seeing は -ing 形です。going to のあとは原形 see にします。",
        ],
      },
    ],
  },

  // ================================================================
  // 助動詞（must / have to / may / should / Will you〜? など）
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
        id: "j2de2-modals-1",
        question: "You must ___ your room today.（あなたは今日、部屋をそうじしなければならない）",
        choices: ["cleans", "clean", "cleaned", "cleaning"],
        answerIndex: 1,
        explanation:
          "助動詞 must のあとの動詞は原形です。must clean となります。",
        choiceHints: [
          "must のあとに s はつきません。原形 clean にします。",
          null,
          "cleaned は過去形です。must のあとは原形 clean にします。",
          "cleaning は -ing 形です。must のあとは原形 clean にします。",
        ],
      },
      {
        id: "j2de2-modals-2",
        question: "She ___ to cook dinner tonight.（彼女は今夜、夕食を作らなければならない）",
        choices: ["have", "has", "must", "should"],
        answerIndex: 1,
        explanation:
          "「〜しなければならない」を have to で表すとき、主語が三人称単数 She なら has to になります。",
        choiceHints: [
          "主語が三人称単数 She なので have ではなく has を使います。",
          null,
          "must なら to はいりません。to があるので has to の has を入れます。",
          "should は「〜すべきだ」で、そのあとに to はつきません。ここは has to です。",
        ],
      },
      {
        id: "j2de2-modals-3",
        question: "You ___ study harder for the test.（あなたはテストに向けてもっと勉強したほうがいい）",
        choices: ["should", "must not", "may not", "can't"],
        answerIndex: 0,
        explanation:
          "「〜したほうがよい・〜すべきだ」というアドバイスは should で表します。",
        choiceHints: [
          null,
          "must not は「〜してはいけない」という禁止です。アドバイスは should です。",
          "may not は「〜してはいけない／〜でないかもしれない」です。助言には should を使います。",
          "can't は「〜できない」です。「〜したほうがよい」は should です。",
        ],
      },
      {
        id: "j2de2-modals-4",
        question: "___ I open the window? — Sure.（窓を開けてもいいですか。— いいですよ）",
        choices: ["Must", "May", "Should", "Do"],
        answerIndex: 1,
        explanation:
          "「〜してもいいですか」と許可を求めるときは May I 〜? を使います。",
        choiceHints: [
          "Must I 〜? は「〜しなければなりませんか」という義務の意味です。許可は May です。",
          null,
          "Should I 〜? は「〜すべきですか」という相談です。許可を求めるなら May です。",
          "Do I 〜? では許可を求める意味になりません。許可には助動詞 May を使います。",
        ],
      },
      {
        id: "j2de2-modals-5",
        question: "___ you help me with my homework? — OK.（宿題を手伝ってくれますか。— いいよ）",
        choices: ["Will", "Must", "May", "Should"],
        answerIndex: 0,
        explanation:
          "「〜してくれますか」と依頼するときは Will you 〜? を使います。",
        choiceHints: [
          null,
          "Must you 〜? は「〜しなければなりませんか」という意味です。依頼は Will you です。",
          "May you 〜? という依頼の言い方はふつうしません。依頼は Will you です。",
          "Should you 〜? は「〜すべきですか」です。依頼するなら Will you を使います。",
        ],
      },
      {
        id: "j2de2-modals-6",
        question: "「あなたは今日、早く起きる必要はない」を表す英文はどれ？",
        choices: [
          "You don't have to get up early today.",
          "You must not get up early today.",
          "You haven't to get up early today.",
          "You don't must get up early today.",
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
      {
        id: "j2de2-modals-7",
        question: "It ___ rain this afternoon, so take an umbrella.（今日の午後は雨が降るかもしれないので、かさを持っていきなさい）",
        choices: ["may", "must", "should", "has to"],
        answerIndex: 0,
        explanation:
          "「〜かもしれない」という推量は may で表します。may rain となります。",
        choiceHints: [
          null,
          "must は「〜しなければならない／〜にちがいない」です。「かもしれない」は may です。",
          "should は「〜すべきだ」です。「かもしれない」は may です。",
          "has to は「〜しなければならない」です。「かもしれない」は may です。",
        ],
      },
      {
        id: "j2de2-modals-8",
        question: "We had to ___ early this morning.（私たちは今朝、早く起きなければならなかった）",
        choices: ["got up", "get up", "gets up", "getting up"],
        answerIndex: 1,
        explanation:
          "had to（have to の過去）のあとの動詞も原形です。had to get up となります。",
        choiceHints: [
          "had to のあとは原形にします。got up ではなく get up です。",
          null,
          "had to のあとは原形にします。gets up ではなく get up です。",
          "had to のあとは原形にします。getting up ではなく get up です。",
        ],
      },
    ],
  },

  // ================================================================
  // 不定詞（名詞的・形容詞的・副詞的用法）
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
        id: "j2de2-infinitive-1",
        question: "I like ___ books in my free time.（私はひまなときに本を読むのが好きだ）",
        choices: ["read", "to read", "reads", "to reads"],
        answerIndex: 1,
        explanation:
          "like のあとに不定詞〈to + 原形〉を続けて「〜することが好き」を表す名詞的用法です。to read となります。",
        choiceHints: [
          "「〜すること」は to をつけます。read ではなく to read です。",
          null,
          "reads は三人称単数の現在形です。ここは to read にします。",
          "to のあとは原形にします。to reads ではなく to read です。",
        ],
      },
      {
        id: "j2de2-infinitive-2",
        question: "He got up early ___ the first train.（彼は始発電車に乗るために早く起きた）",
        choices: ["catch", "to catch", "caught", "catching"],
        answerIndex: 1,
        explanation:
          "「〜するために」と目的を表すのは副詞的用法の不定詞です。to catch となります。",
        choiceHints: [
          "「〜するために」は to をつけます。catch ではなく to catch です。",
          null,
          "caught は過去形です。「〜するために」は to catch です。",
          "「〜するために」は to + 原形で表します。catching ではなく to catch です。",
        ],
      },
      {
        id: "j2de2-infinitive-3",
        question: "It's time ___ to bed.（もう寝る時間だ）",
        choices: ["go", "to go", "going", "goes"],
        answerIndex: 1,
        explanation:
          "名詞のあとに置いて「〜するための・〜すべき」と説明するのは形容詞的用法の不定詞です。time to go で「行くべき時間」を表します。",
        choiceHints: [
          "名詞 time を説明するときは to をつけます。to go とします。",
          null,
          "going ではなく to + 原形で名詞を説明します。to go が正しい形です。",
          "goes は三人称単数の現在形です。ここは to go にします。",
        ],
      },
      {
        id: "j2de2-infinitive-4",
        question: "To ___ English is important.（英語を勉強することは大切だ）",
        choices: ["study", "studies", "studied", "studying"],
        answerIndex: 0,
        explanation:
          "不定詞は〈to + 原形〉です。To study English で「英語を勉強すること」を表す名詞的用法（主語）です。",
        choiceHints: [
          null,
          "to のあとは原形です。studies ではなく study です。",
          "to のあとは原形です。studied ではなく study です。",
          "to のあとは原形です。studying ではなく study です。",
        ],
      },
      {
        id: "j2de2-infinitive-5",
        question: "I have many things ___ today.（私は今日、するべきことがたくさんある）",
        choices: ["do", "to do", "doing", "did"],
        answerIndex: 1,
        explanation:
          "名詞 things を説明する形容詞的用法の不定詞です。things to do で「するべきこと」を表します。",
        choiceHints: [
          "名詞 things を説明するときは to をつけます。to do とします。",
          null,
          "doing ではなく to + 原形で名詞を説明します。to do が正しい形です。",
          "did は過去形です。ここは to do にします。",
        ],
      },
      {
        id: "j2de2-infinitive-6",
        question: "She was sad ___ the bad news.（彼女はその悪い知らせを聞いて悲しかった）",
        choices: ["hear", "to hear", "hearing", "hears"],
        answerIndex: 1,
        explanation:
          "「〜して（悲しい）」と感情の原因を表すのは副詞的用法の不定詞です。sad to hear で「聞いて悲しい」を表します。",
        choiceHints: [
          "感情の原因は to をつけて表します。hear ではなく to hear です。",
          null,
          "hearing ではなく to + 原形で表します。to hear が正しい形です。",
          "hears は現在形です。ここは to hear にします。",
        ],
      },
      {
        id: "j2de2-infinitive-7",
        question: "He wants ___ a new smartphone.（彼は新しいスマートフォンを買いたがっている）",
        choices: ["buy", "to buy", "buying", "buys"],
        answerIndex: 1,
        explanation:
          "want のあとは不定詞〈to + 原形〉を続けます。to buy で「買うこと」を表す名詞的用法です。",
        choiceHints: [
          "want のあとは to をつけて to buy にします。",
          null,
          "want のあとは -ing ではなく to + 原形です。to buy が正しい形です。",
          "buys は現在形です。want のあとは to buy にします。",
        ],
      },
      {
        id: "j2de2-infinitive-8",
        question: "We went to the library ___ books.（私たちは本を借りるために図書館へ行った）",
        choices: ["borrow", "to borrow", "borrowed", "borrowing"],
        answerIndex: 1,
        explanation:
          "「〜するために」と目的を表すのは副詞的用法の不定詞です。to borrow となります。",
        choiceHints: [
          "「〜するために」は to をつけます。borrow ではなく to borrow です。",
          null,
          "borrowed は過去形です。「〜するために」は to borrow です。",
          "「〜するために」は to + 原形で表します。borrowing ではなく to borrow です。",
        ],
      },
    ],
  },

  // ================================================================
  // 動名詞（動詞の目的語・enjoy/finish/want to の使い分け）
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
        id: "j2de2-gerund-1",
        question: "We enjoyed ___ in the sea last summer.（私たちはこの前の夏、海で泳いで楽しんだ）",
        choices: ["swim", "to swim", "swimming", "swam"],
        answerIndex: 2,
        explanation:
          "enjoy は目的語に動名詞（-ing 形）をとります。enjoy swimming となります。",
        choiceHints: [
          "enjoy のあとは原形ではなく -ing 形にします。swimming です。",
          "enjoy は to 不定詞ではなく動名詞をとります。to swim ではなく swimming です。",
          null,
          "enjoy のあとは -ing 形です。swam（過去形）ではなく swimming です。",
        ],
      },
      {
        id: "j2de2-gerund-2",
        question: "I ___ to visit Kyoto someday.（私はいつか京都を訪れたい）",
        choices: ["enjoy", "finish", "want", "stop"],
        answerIndex: 2,
        explanation:
          "空所のあとが to visit（不定詞）なので、不定詞をとる動詞 want が入ります。want to 〜 で「〜したい」を表します。",
        choiceHints: [
          "enjoy は動名詞（-ing）をとります。to visit と続くのは want です。",
          "finish は動名詞（-ing）をとります。to visit と続くのは want です。",
          null,
          "stop は動名詞（-ing）をとります。to visit と続くのは want です。",
        ],
      },
      {
        id: "j2de2-gerund-3",
        question: "Have you finished ___ lunch yet?（あなたはもう昼食を食べ終えましたか）",
        choices: ["eat", "to eat", "eating", "ate"],
        answerIndex: 2,
        explanation:
          "finish は目的語に動名詞をとります。finish eating となります。",
        choiceHints: [
          "finish のあとは -ing 形にします。eat ではなく eating です。",
          "finish は to 不定詞ではなく動名詞をとります。to eat ではなく eating です。",
          null,
          "finish のあとは -ing 形にします。ate ではなく eating です。",
        ],
      },
      {
        id: "j2de2-gerund-4",
        question: "Wash your hands before ___.（食べる前に手を洗いなさい）",
        choices: ["eat", "eating", "to eat", "ate"],
        answerIndex: 1,
        explanation:
          "前置詞 before のあとは動名詞にします。before eating で「食べる前に」を表します。",
        choiceHints: [
          "前置詞 before のあとは -ing 形にします。eat ではなく eating です。",
          null,
          "前置詞 before のあとに to 不定詞は続きません。eating にします。",
          "before のあとは -ing 形にします。ate ではなく eating です。",
        ],
      },
      {
        id: "j2de2-gerund-5",
        question: "He hopes ___ a doctor in the future.（彼は将来、医者になることを望んでいる）",
        choices: ["become", "becomes", "to become", "becoming"],
        answerIndex: 2,
        explanation:
          "hope は不定詞をとる動詞です。hope to become で「〜になることを望む」を表します。",
        choiceHints: [
          "hope のあとは to をつけます。become ではなく to become です。",
          "becomes は現在形です。hope のあとは to become にします。",
          null,
          "hope は動名詞ではなく不定詞をとります。becoming ではなく to become です。",
        ],
      },
      {
        id: "j2de2-gerund-6",
        question: "___ is good for your health.（歩くことは健康によい）",
        choices: ["Walk", "Walks", "Walking", "To walks"],
        answerIndex: 2,
        explanation:
          "動名詞は主語（〜すること）になれます。Walking で「歩くこと」を表します。",
        choiceHints: [
          "主語には原形ではなく動名詞を使えます。Walk ではなく Walking です。",
          "Walks は現在形の動詞です。主語には動名詞 Walking を使います。",
          null,
          "to のあとは原形です。To walks とはしません。主語は Walking です。",
        ],
      },
      {
        id: "j2de2-gerund-7",
        question: "It stopped ___ , so we went outside.（雪がやんだので、私たちは外に出た）",
        choices: ["snow", "to snow", "snowing", "snowed"],
        answerIndex: 2,
        explanation:
          "stop は目的語に動名詞をとります。stop snowing で「降るのをやめる＝雪がやむ」を表します。",
        choiceHints: [
          "stop のあとは -ing 形にします。snow ではなく snowing です。",
          "「〜するのをやめる」は stop + -ing です。to snow ではなく snowing です。",
          null,
          "stop のあとは -ing 形にします。snowed ではなく snowing です。",
        ],
      },
      {
        id: "j2de2-gerund-8",
        question: "Thank you for ___ me.（私を手伝ってくれてありがとう）",
        choices: ["help", "helping", "to help", "helped"],
        answerIndex: 1,
        explanation:
          "前置詞 for のあとは動名詞にします。for helping で「手伝ってくれて」を表します。",
        choiceHints: [
          "前置詞 for のあとは -ing 形にします。help ではなく helping です。",
          null,
          "前置詞 for のあとに to 不定詞は続きません。helping にします。",
          "for のあとは -ing 形にします。helped ではなく helping です。",
        ],
      },
    ],
  },

  // ================================================================
  // 接続詞（when / if / that / because）
  // ================================================================
  {
    id: "j2de2-conjunction",
    subject: "english",
    grade: "中2",
    title: "接続詞（when, if, that, because）",
    lesson:
      "接続詞は2つの文をつなぐ言葉です。when（〜するとき）、if（もし〜なら）、because（〜だから・理由）、that（〜ということ）などがあります。when や if が導く文が未来のことでも、その中では現在形を使うのがルールです。that は think や know のあとで「〜ということ」を表し、省略できます。",
    items: [
      {
        id: "j2de2-conjunction-1",
        question: "___ I got home, my mother was cooking.（私が家に着いたとき、母は料理をしていた）",
        choices: ["When", "Because", "If", "That"],
        answerIndex: 0,
        explanation:
          "「〜するとき」と時を表すのは when です。",
        choiceHints: [
          null,
          "because は「〜だから」と理由を表します。「〜のとき」は when です。",
          "if は「もし〜なら」と条件を表します。「〜のとき」は when です。",
          "that は「〜ということ」を表します。「〜のとき」は when です。",
        ],
      },
      {
        id: "j2de2-conjunction-2",
        question: "I couldn't go out ___ it was raining hard.（雨が激しく降っていたので外出できなかった）",
        choices: ["when", "because", "if", "that"],
        answerIndex: 1,
        explanation:
          "「〜だから・〜なので」と理由を表すのは because です。",
        choiceHints: [
          "when は「〜のとき」です。理由を表すのは because です。",
          null,
          "if は「もし〜なら」です。理由を表すのは because です。",
          "that は「〜ということ」です。理由を表すのは because です。",
        ],
      },
      {
        id: "j2de2-conjunction-3",
        question: "___ it rains tomorrow, we will stay home.（もし明日雨なら、家にいよう）",
        choices: ["When", "That", "If", "Because"],
        answerIndex: 2,
        explanation:
          "「もし〜なら」と条件を表すのは if です。",
        choiceHints: [
          "when は「〜のとき」です。「もし〜なら」は if です。",
          "that は「〜ということ」です。条件を表すのは if です。",
          null,
          "because は「〜だから」です。条件を表すのは if です。",
        ],
      },
      {
        id: "j2de2-conjunction-4",
        question: "I think ___ he is right.（私は彼が正しいと思う）",
        choices: ["when", "if", "that", "because"],
        answerIndex: 2,
        explanation:
          "think のあとで「〜ということ」を表すのは接続詞 that です。この that は省略することもできます。",
        choiceHints: [
          "when は「〜のとき」です。think のあとで「〜ということ」は that です。",
          "if は「もし〜なら」です。ここでは「〜ということ」の that を使います。",
          null,
          "because は「〜だから」です。ここでは「〜ということ」の that を使います。",
        ],
      },
      {
        id: "j2de2-conjunction-5",
        question: "If you ___ tired, you should rest.（もしつかれているなら、休んだほうがいい）",
        choices: ["are", "will be", "were", "be"],
        answerIndex: 0,
        explanation:
          "if が導く文の中では、これからのことでも現在形を使うのがルールです。主語 you には are を使います。",
        choiceHints: [
          null,
          "if の文の中では will を使いません。現在形 are にします。",
          "were は過去形です。ここは現在形 are を使います。",
          "主語 you には be動詞の be ではなく are を使います。If you are tired とします。",
        ],
      },
      {
        id: "j2de2-conjunction-6",
        question: "I know ___ this is a difficult question.（私はこれが難しい問題だと知っている）",
        choices: ["because", "when", "that", "if"],
        answerIndex: 2,
        explanation:
          "know のあとで「〜ということ」を表すのは接続詞 that です。",
        choiceHints: [
          "because は「〜だから」です。「〜ということ」を表すのは that です。",
          "when は「〜のとき」です。「〜ということ」を表すのは that です。",
          null,
          "if は「もし〜なら」です。ここでは「〜ということ」の that を使います。",
        ],
      },
      {
        id: "j2de2-conjunction-7",
        question: "Wash your hands ___ you eat lunch.（昼食を食べるとき、手を洗いなさい）",
        choices: ["that", "because", "when", "of"],
        answerIndex: 2,
        explanation:
          "「〜するとき」と時を表すのは when です。",
        choiceHints: [
          "that は「〜ということ」です。「〜するとき」は when です。",
          "because は「〜だから」です。「〜するとき」は when です。",
          null,
          "of は接続詞ではありません。「〜するとき」は when を使います。",
        ],
      },
      {
        id: "j2de2-conjunction-8",
        question: "He was happy ___ he won the game.（試合に勝ったので彼はうれしかった）",
        choices: ["because", "if", "that", "when"],
        answerIndex: 0,
        explanation:
          "「〜だから・〜なので」と理由を表すのは because です。",
        choiceHints: [
          null,
          "if は「もし〜なら」です。理由を表すのは because です。",
          "that は「〜ということ」です。理由を表すのは because です。",
          "ここでは理由を表すので when（〜のとき）より because が自然です。",
        ],
      },
    ],
  },

  // ================================================================
  // 比較（比較級・最上級・as 〜 as・more/most・不規則 good-better-best）
  // ================================================================
  {
    id: "j2de2-comparison",
    subject: "english",
    grade: "中2",
    title: "比較（比較級・最上級・as 〜 as）",
    lesson:
      "2つを比べて「〜より…だ」は比較級、3つ以上で「いちばん…だ」は最上級を使います。短い語は -er / -est（old→older→oldest）、長い語は more / most（difficult→more difficult→most difficult）をつけます。good / well は better / best、many / much は more / most と不規則に変化します。〈as + 原級 + as〉は「〜と同じくらい…」を表します。",
    items: [
      {
        id: "j2de2-comparison-1",
        question: "My brother is ___ than me.（私の兄は私より年上だ）",
        choices: ["old", "older", "oldest", "more old"],
        answerIndex: 1,
        explanation:
          "2つを比べて「〜より年上」は比較級です。old は短い語なので -er をつけて older にします。than とセットで使います。",
        choiceHints: [
          "than があるので比較級にします。old ではなく older です。",
          null,
          "oldest は最上級（いちばん年上）です。2つを比べるときは比較級 older です。",
          "old は短い語なので more はつけません。-er をつけて older にします。",
        ],
      },
      {
        id: "j2de2-comparison-2",
        question: "This is the ___ room in this house.（これはこの家でいちばん大きい部屋だ）",
        choices: ["large", "larger", "largest", "most large"],
        answerIndex: 2,
        explanation:
          "「いちばん大きい」は最上級です。large は -st をつけて largest にします。the をつけるのがふつうです。",
        choiceHints: [
          "the と in this house があるので最上級にします。large ではなく largest です。",
          "larger は比較級（〜より大きい）です。「いちばん」は最上級 largest です。",
          null,
          "large は短めの語なので most はつけません。-st をつけて largest にします。",
        ],
      },
      {
        id: "j2de2-comparison-3",
        question: "This question is ___ than that one.（この問題はあの問題より難しい）",
        choices: ["difficult", "difficulter", "more difficult", "most difficult"],
        answerIndex: 2,
        explanation:
          "difficult は長い語なので、比較級は more をつけて more difficult にします。-er はつけません。",
        choiceHints: [
          "than があるので比較級にします。more difficult とします。",
          "長い語には -er をつけません。more difficult が正しい形です。",
          null,
          "most difficult は最上級です。2つを比べるときは more difficult です。",
        ],
      },
      {
        id: "j2de2-comparison-4",
        question: "English is the ___ subject of all for me.（私にとって英語はすべての中でいちばん大切な教科だ）",
        choices: ["importanter", "more important", "most important", "important"],
        answerIndex: 2,
        explanation:
          "important は長い語なので、最上級は most をつけて most important にします。the of all があるので最上級です。",
        choiceHints: [
          "important に -er はつけません。最上級は most important です。",
          "more important は比較級です。「いちばん」は最上級 most important です。",
          null,
          "the と of all があるので最上級にします。important ではなく most important です。",
        ],
      },
      {
        id: "j2de2-comparison-5",
        question: "This bag is as ___ as that one.（このかばんはあのかばんと同じくらい大きい）",
        choices: ["big", "bigger", "biggest", "more big"],
        answerIndex: 0,
        explanation:
          "〈as + 原級 + as〉は「〜と同じくらい…」を表します。as と as の間は比較級ではなく原級（もとの形）の big にします。",
        choiceHints: [
          null,
          "as 〜 as の間は原級（もとの形）にします。bigger ではなく big です。",
          "biggest は最上級です。as 〜 as の間は原級 big です。",
          "big は短い語で more はつけません。as 〜 as の間は原級 big です。",
        ],
      },
      {
        id: "j2de2-comparison-6",
        question: "Her idea is ___ than mine.（彼女の考えは私のより良い）",
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
      {
        id: "j2de2-comparison-7",
        question: "Tom studies the ___ in his class.（トムはクラスでいちばん熱心に勉強する）",
        choices: ["hard", "harder", "hardest", "most hard"],
        answerIndex: 2,
        explanation:
          "「いちばん熱心に」は最上級です。hard は短い語なので -est をつけて hardest にします。",
        choiceHints: [
          "the があるので最上級にします。hard ではなく hardest です。",
          "harder は比較級です。「いちばん」は最上級 hardest です。",
          null,
          "hard は短い語なので most はつけません。-est をつけて hardest にします。",
        ],
      },
      {
        id: "j2de2-comparison-8",
        question: "I have ___ books than my sister.（私は姉より多くの本を持っている）",
        choices: ["many", "much", "more", "most"],
        answerIndex: 2,
        explanation:
          "many は不規則に変化する語で、比較級は more です。than があるので比較級 more books にします。",
        choiceHints: [
          "than があるので比較級にします。many ではなく more です。",
          "much は数えられない名詞に使います。books の比較級は more です。",
          null,
          "most は最上級（いちばん多い）です。than があるので比較級 more です。",
        ],
      },
    ],
  },

  // ================================================================
  // 受動態（be + 過去分詞 / by 〜）
  // ================================================================
  {
    id: "j2de2-passive",
    subject: "english",
    grade: "中2",
    title: "受動態（be + 過去分詞）",
    lesson:
      "「〜される・〜されている」と受け身を表すのが受動態です。〈be動詞 + 過去分詞〉で作ります。be動詞は主語と時（現在・過去）に合わせます。「〜によって」と動作をする人を示すときは by を使います。過去分詞は規則動詞なら -ed（use→used）、不規則動詞は形が変わります（write→written, speak→spoken, make→made）。",
    items: [
      {
        id: "j2de2-passive-1",
        question: "This letter ___ written by Tom.（この手紙はトムによって書かれた）",
        choices: ["is", "was", "did", "does"],
        answerIndex: 1,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。過去の「書かれた」なので be動詞は was を使い、was written となります。",
        choiceHints: [
          "「書かれた」は過去のことなので現在の is ではなく was を使います。",
          null,
          "did は一般動詞の過去に使います。受動態には be動詞 was を使います。",
          "does は現在形の助動詞です。受動態には be動詞を使い was written とします。",
        ],
      },
      {
        id: "j2de2-passive-2",
        question: "English ___ spoken in many countries.（英語は多くの国で話されている）",
        choices: ["is", "does", "has", "do"],
        answerIndex: 0,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。現在の「話されている」なので be動詞 is を使い、is spoken となります。",
        choiceHints: [
          null,
          "does は現在形の助動詞です。受動態には be動詞 is を使います。",
          "has は完了形などに使います。受動態には be動詞 is を使い is spoken とします。",
          "do は現在形の助動詞です。受動態には be動詞 is を使います。",
        ],
      },
      {
        id: "j2de2-passive-3",
        question: "This room is cleaned ___ my mother every day.（この部屋は毎日、母によってそうじされる）",
        choices: ["with", "of", "by", "in"],
        answerIndex: 2,
        explanation:
          "受動態で「〜によって」と動作をする人を示すときは by を使います。",
        choiceHints: [
          "with は「〜を使って」の意味です。動作をする人を示すのは by です。",
          "of は「〜の」の意味です。動作をする人を示すのは by です。",
          null,
          "in は「〜の中で」の意味です。動作をする人を示すのは by です。",
        ],
      },
      {
        id: "j2de2-passive-4",
        question: "The car was ___ in Japan.（その車は日本で作られた）",
        choices: ["make", "makes", "made", "making"],
        answerIndex: 2,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。make の過去分詞は made なので was made となります。",
        choiceHints: [
          "was のあとは過去分詞にします。make ではなく made です。",
          "makes は現在形です。受動態は過去分詞 made を使います。",
          null,
          "making は -ing 形です。受動態は過去分詞 made を使います。",
        ],
      },
      {
        id: "j2de2-passive-5",
        question: "These books are ___ by many people.（これらの本は多くの人に読まれている）",
        choices: ["read", "reads", "reading", "to read"],
        answerIndex: 0,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。read の過去分詞は read（形は同じ）なので are read となります。",
        choiceHints: [
          null,
          "reads は現在形です。受動態は過去分詞を使います。read の過去分詞は read です。",
          "reading は -ing 形です。受動態は過去分詞 read を使います。",
          "to read は不定詞です。受動態は過去分詞 read を使います。",
        ],
      },
      {
        id: "j2de2-passive-6",
        question: "「この歌は世界中で愛されている」を表す英文はどれ？",
        choices: [
          "This song is loved all over the world.",
          "This song loves all over the world.",
          "This song is love all over the world.",
          "This song loved all over the world.",
        ],
        answerIndex: 0,
        explanation:
          "「愛されている」は受動態〈be動詞 + 過去分詞〉です。is loved となります。",
        choiceHints: [
          null,
          "これでは「歌が（何かを）愛する」という能動の意味になります。受動態は is loved です。",
          "is のあとは過去分詞にします。love ではなく loved です。",
          "be動詞がないと受動態になりません。is loved とします。",
        ],
      },
      {
        id: "j2de2-passive-7",
        question: "The window was ___ by the boy.（その窓は少年によって割られた）",
        choices: ["break", "broke", "broken", "breaking"],
        answerIndex: 2,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。break の過去分詞は broken なので was broken となります。",
        choiceHints: [
          "was のあとは過去分詞にします。break ではなく broken です。",
          "broke は過去形です。受動態は過去分詞 broken を使います。",
          null,
          "breaking は -ing 形です。受動態は過去分詞 broken を使います。",
        ],
      },
      {
        id: "j2de2-passive-8",
        question: "These pictures ___ taken in Okinawa.（これらの写真は沖縄で撮られた）",
        choices: ["was", "were", "is", "does"],
        answerIndex: 1,
        explanation:
          "主語 These pictures は複数で過去の受動態なので be動詞は were を使い、were taken となります。",
        choiceHints: [
          "was は単数に使います。複数の主語には were を使います。",
          null,
          "is は現在の単数です。過去で複数なので were です。",
          "does は現在形の助動詞です。受動態には be動詞 were を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // There is / There are
  // ================================================================
  {
    id: "j2de2-there-is",
    subject: "english",
    grade: "中2",
    title: "There is / There are（〜がある）",
    lesson:
      "「〜がある・〜がいる」を表すには There is / There are を使います。あとの名詞が単数なら There is、複数なら There are にします。過去は There was / There were です。否定は There is not (isn't)、疑問は Is there 〜? / Are there 〜? で表します。数えられない名詞（water など）には There is を使います。",
    items: [
      {
        id: "j2de2-there-is-1",
        question: "There ___ a cat on the sofa.（ソファの上にネコが1匹いる）",
        choices: ["is", "are", "have", "has"],
        answerIndex: 0,
        explanation:
          "あとの名詞 a cat が単数なので There is を使います。",
        choiceHints: [
          null,
          "are は複数の名詞のときに使います。a cat（単数）には is を使います。",
          "「〜がある」は There is/are で表します。have は使いません。",
          "「〜がある」は There is/are で表します。has は使いません。",
        ],
      },
      {
        id: "j2de2-there-is-2",
        question: "There ___ some books on the desk.（机の上に何冊かの本がある）",
        choices: ["is", "are", "was", "has"],
        answerIndex: 1,
        explanation:
          "あとの名詞 some books が複数なので There are を使います。",
        choiceHints: [
          "is は単数の名詞のときに使います。some books（複数）には are を使います。",
          null,
          "was は過去の単数に使います。複数の現在なので are です。",
          "「〜がある」は There is/are で表します。has は使いません。",
        ],
      },
      {
        id: "j2de2-there-is-3",
        question: "There ___ many people in the park yesterday.（昨日、公園にはたくさんの人がいた）",
        choices: ["is", "are", "were", "was"],
        answerIndex: 2,
        explanation:
          "「昨日いた」という過去で、many people は複数なので There were を使います。",
        choiceHints: [
          "is は現在の単数に使います。過去で複数なので were です。",
          "are は現在です。yesterday があるので過去の were です。",
          null,
          "was は過去の単数に使います。many people（複数）には were を使います。",
        ],
      },
      {
        id: "j2de2-there-is-4",
        question: "「テーブルの上に卵はありますか」を表す英文はどれ？",
        choices: [
          "Are there any eggs on the table?",
          "Is there any eggs on the table?",
          "There are any eggs on the table?",
          "Do there any eggs on the table?",
        ],
        answerIndex: 0,
        explanation:
          "There are の疑問文は Are を there の前に出します。eggs は複数なので Are there 〜? となります。",
        choiceHints: [
          null,
          "eggs（複数）には Are を使います。Are there any eggs 〜? が正しい形です。",
          "疑問文は Are を there の前に出します。ふつうの語順のままでは疑問文になりません。",
          "There の疑問文に do は使いません。Are there 〜? とします。",
        ],
      },
      {
        id: "j2de2-there-is-5",
        question: "There ___ any milk in the bottle.（びんには牛乳が入っていない）",
        choices: ["isn't", "aren't", "don't", "doesn't"],
        answerIndex: 0,
        explanation:
          "milk は数えられない名詞なので There is を使い、否定は There isn't になります。",
        choiceHints: [
          null,
          "aren't は複数のときに使います。milk（数えられない）には isn't を使います。",
          "don't は一般動詞の否定です。There の否定は isn't を使います。",
          "doesn't は一般動詞の否定です。There の否定は isn't を使います。",
        ],
      },
      {
        id: "j2de2-there-is-6",
        question: "There ___ a big tree near my house.（私の家の近くに大きな木が1本あった）",
        choices: ["is", "are", "was", "were"],
        answerIndex: 2,
        explanation:
          "過去で、a big tree は単数なので There was を使います。",
        choiceHints: [
          "「あった」という過去なので is ではなく was を使います。",
          "are は現在の複数です。過去の単数なので was です。",
          null,
          "were は過去の複数に使います。a big tree（単数）には was を使います。",
        ],
      },
      {
        id: "j2de2-there-is-7",
        question: "There ___ four seasons in Japan.（日本には四季がある）",
        choices: ["is", "are", "has", "was"],
        answerIndex: 1,
        explanation:
          "あとの名詞 four seasons が複数なので There are を使います。",
        choiceHints: [
          "is は単数の名詞のときに使います。four seasons（複数）には are を使います。",
          null,
          "「〜がある」は There is/are で表します。has は使いません。",
          "was は過去です。現在の複数なので are です。",
        ],
      },
      {
        id: "j2de2-there-is-8",
        question: "There ___ a lot of snow last winter.（この前の冬はたくさんの雪が降った）",
        choices: ["is", "are", "was", "were"],
        answerIndex: 2,
        explanation:
          "snow は数えられない名詞で、過去のことなので There was を使います。",
        choiceHints: [
          "「あった」という過去なので is ではなく was を使います。",
          "are は現在の複数です。snow は数えられない名詞なので are は使いません。",
          null,
          "were は過去の複数に使います。snow（数えられない）には was を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // 文型（give/tell/show + 人 + 物、call/make + O + C、look/become + 形容詞）
  // ================================================================
  {
    id: "j2de2-sentence-pattern",
    subject: "english",
    grade: "中2",
    title: "文型（give 型・call 型・look 型）",
    lesson:
      "動詞の後ろの形にはいくつか型があります。give / tell / show + 人 + 物「（人）に（物）を〜する」（give me a book）。call / make + O + C「OをCと呼ぶ・OをCにする」（call me Ken）。look / become / get + 形容詞「〜に見える・〜になる」（look happy）。それぞれ後ろにくる語の並びに注意します。",
    items: [
      {
        id: "j2de2-sentence-pattern-1",
        question: "My father gave ___ a nice watch.（父は私にすてきな時計をくれた）",
        choices: ["I", "me", "my", "mine"],
        answerIndex: 1,
        explanation:
          "give + 人 + 物の形で、「人」には目的格が入ります。「私に」は me です。",
        choiceHints: [
          "I は主語に使う形です。「私に」は目的格の me を使います。",
          null,
          "my は「私の」で、うしろに名詞が必要です。「私に」は me です。",
          "mine は「私のもの」です。「私に」は me です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-2",
        question: "Please tell ___ the way to the station.（駅への道を私に教えてください）",
        choices: ["to me", "me", "for me", "my"],
        answerIndex: 1,
        explanation:
          "tell + 人 + 物の形では、人のところに前置詞なしで目的格を置きます。tell me となります。",
        choiceHints: [
          "この語順では to はいりません。tell me the way とします。",
          null,
          "この語順では for はいりません。tell me the way とします。",
          "my は「私の」です。「私に」は目的格の me です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-3",
        question: "We call ___ Ken.（私たちは彼をケンと呼ぶ）",
        choices: ["he", "his", "him", "he is"],
        answerIndex: 2,
        explanation:
          "call + O + C の形で、O（呼ばれる人）には目的格が入ります。「彼を」は him です。",
        choiceHints: [
          "he は主語に使う形です。「彼を」は目的格の him を使います。",
          "his は「彼の／彼のもの」です。「彼を」は him です。",
          null,
          "call のあとに he is は続きません。「彼を」は him です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-4",
        question: "The news made us ___.（その知らせは私たちを幸せにした）",
        choices: ["happy", "happily", "happiness", "to happy"],
        answerIndex: 0,
        explanation:
          "make + O + C の形で、C には形容詞が入ります。made us happy で「私たちを幸せにした」を表します。",
        choiceHints: [
          null,
          "happily は副詞です。ここは形容詞 happy を使います。",
          "happiness は名詞（幸福）です。ここは形容詞 happy を使います。",
          "to happy とはいいません。ここは形容詞 happy です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-5",
        question: "You look ___ today.（あなたは今日、疲れて見える）",
        choices: ["tired", "tiredly", "to tired", "tiring you"],
        answerIndex: 0,
        explanation:
          "look + 形容詞で「〜に見える」を表します。look tired で「疲れて見える」となります。",
        choiceHints: [
          null,
          "tiredly という形は使いません。look のあとは形容詞 tired です。",
          "to tired とはいいません。look のあとは形容詞 tired です。",
          "look のあとは形容詞 tired を置きます。tiring you とはしません。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-6",
        question: "He became a famous ___ .（彼は有名な歌手になった）",
        choices: ["sing", "sang", "singer", "singing"],
        answerIndex: 2,
        explanation:
          "become + 名詞で「〜になる」を表します。ここは「歌手」という名詞 singer が入ります。",
        choiceHints: [
          "sing は動詞（歌う）です。「歌手」という名詞は singer です。",
          "sang は sing の過去形です。「歌手」という名詞は singer です。",
          null,
          "singing は動名詞・-ing 形です。「歌手」という名詞は singer です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-7",
        question: "Ms. Green teaches ___ English.（グリーン先生は私たちに英語を教える）",
        choices: ["we", "us", "our", "ours"],
        answerIndex: 1,
        explanation:
          "teach + 人 + 物の形で、「人」には目的格が入ります。「私たちに」は us です。",
        choiceHints: [
          "we は主語に使う形です。「私たちに」は目的格の us を使います。",
          null,
          "our は「私たちの」で、うしろに名詞が必要です。「私たちに」は us です。",
          "ours は「私たちのもの」です。「私たちに」は us です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-8",
        question: "This song always makes me ___.（この歌はいつも私を悲しくさせる）",
        choices: ["sad", "sadly", "sadness", "to sad"],
        answerIndex: 0,
        explanation:
          "make + O + C の形で、C には形容詞が入ります。makes me sad で「私を悲しくさせる」を表します。",
        choiceHints: [
          null,
          "sadly は副詞です。ここは形容詞 sad を使います。",
          "sadness は名詞（悲しみ）です。ここは形容詞 sad を使います。",
          "to sad とはいいません。ここは形容詞 sad です。",
        ],
      },
    ],
  },

  // ================================================================
  // 疑問詞 + to（how to / what to など）
  // ================================================================
  {
    id: "j2de2-wh-to",
    subject: "english",
    grade: "中2",
    title: "疑問詞 + to（how to など）",
    lesson:
      "〈疑問詞 + to + 動詞の原形〉で「〜すべきか」を表します。how to 〜（〜のしかた・どう〜すべきか）、what to 〜（何を〜すべきか）、where to 〜（どこで〜すべきか）、when to 〜（いつ〜すべきか）などがあります。know や tell などの動詞のあとでよく使います。to のあとは原形です。",
    items: [
      {
        id: "j2de2-wh-to-1",
        question: "I know how ___ this computer.（私はこのコンピューターの使い方を知っている）",
        choices: ["use", "to use", "using", "used"],
        answerIndex: 1,
        explanation:
          "「〜のしかた」は how to + 原形で表します。how to use となります。",
        choiceHints: [
          "how のあとは to をつけます。use ではなく to use です。",
          null,
          "how to のあとは原形です。using ではなく to use です。",
          "how to のあとは原形です。used ではなく to use です。",
        ],
      },
      {
        id: "j2de2-wh-to-2",
        question: "Please tell me ___ to do next.（次に何をすべきか私に教えてください）",
        choices: ["how", "what", "where", "when"],
        answerIndex: 1,
        explanation:
          "「何を〜すべきか」は what to + 原形で表します。what to do となります。",
        choiceHints: [
          "how to do は「どうやってするか」です。「何をすべきか」は what to do です。",
          null,
          "where to do は「どこですべきか」です。「何をすべきか」は what to do です。",
          "when to do は「いつすべきか」です。「何をすべきか」は what to do です。",
        ],
      },
      {
        id: "j2de2-wh-to-3",
        question: "I didn't know ___ to go.（私はどこへ行くべきかわからなかった）",
        choices: ["what", "how", "where", "who"],
        answerIndex: 2,
        explanation:
          "「どこへ〜すべきか」は where to + 原形で表します。where to go となります。",
        choiceHints: [
          "what to go とはふつういいません。「どこへ行くべきか」は where to go です。",
          "how to go は「どうやって行くか」です。「どこへ行くべきか」は where to go です。",
          null,
          "who は「だれ」です。「どこへ」は where を使います。",
        ],
      },
      {
        id: "j2de2-wh-to-4",
        question: "She told me when ___ start.（彼女はいつ始めるべきか私に教えてくれた）",
        choices: ["to", "for", "at", "of"],
        answerIndex: 0,
        explanation:
          "「いつ〜すべきか」は when to + 原形で表します。when to start となります。",
        choiceHints: [
          null,
          "when のあとは for ではなく to をつけます。when to start です。",
          "when のあとは at ではなく to をつけます。when to start です。",
          "when のあとは of ではなく to をつけます。when to start です。",
        ],
      },
      {
        id: "j2de2-wh-to-5",
        question: "Do you know how ___ to the station?（駅への行き方を知っていますか）",
        choices: ["get", "to get", "getting", "gets"],
        answerIndex: 1,
        explanation:
          "「〜のしかた・行き方」は how to + 原形で表します。how to get となります。",
        choiceHints: [
          "how のあとは to をつけます。get ではなく to get です。",
          null,
          "how to のあとは原形です。getting ではなく to get です。",
          "how to のあとは原形です。gets ではなく to get です。",
        ],
      },
      {
        id: "j2de2-wh-to-6",
        question: "I'm thinking about what ___ for lunch.（私は昼食に何を食べるべきか考えている）",
        choices: ["eat", "eating", "to eat", "ate"],
        answerIndex: 2,
        explanation:
          "「何を〜すべきか」は what to + 原形で表します。what to eat となります。",
        choiceHints: [
          "what のあとは to をつけます。eat ではなく to eat です。",
          "what のあとは -ing ではなく to + 原形です。to eat が正しい形です。",
          null,
          "what to のあとは原形です。ate ではなく to eat です。",
        ],
      },
      {
        id: "j2de2-wh-to-7",
        question: "Can you tell me how ___ to the museum?（博物館への行き方を教えてくれますか）",
        choices: ["get", "to get", "getting", "gets"],
        answerIndex: 1,
        explanation:
          "「〜のしかた・行き方」は how to + 原形で表します。how to get となります。",
        choiceHints: [
          "how のあとは to をつけます。get ではなく to get です。",
          null,
          "how to のあとは原形です。getting ではなく to get です。",
          "how to のあとは原形です。gets ではなく to get です。",
        ],
      },
      {
        id: "j2de2-wh-to-8",
        question: "I couldn't decide ___ to buy.（私は何を買うべきか決められなかった）",
        choices: ["how", "what", "when", "why"],
        answerIndex: 1,
        explanation:
          "「何を〜すべきか」は what to + 原形で表します。what to buy となります。",
        choiceHints: [
          "how to buy は「どうやって買うか」です。「何を買うべきか」は what to buy です。",
          null,
          "when to buy は「いつ買うべきか」です。「何を買うべきか」は what to buy です。",
          "why のあとに to はふつう続きません。「何を」は what を使います。",
        ],
      },
    ],
  },
];
