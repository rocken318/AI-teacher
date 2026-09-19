// 中2英語 追加問題バンク B（english_j2d_more_b）。
// 既存 english_j2d.ts と同じ単元 id を使い、items を合体させる（各+7問で計15問）。
// authored（文法的一意性を確認済み）。生成AIは事実を作らない。
// このファイルは index.ts・english_j2d.ts を一切編集しない。追加専用。

import type { QuizUnit } from "@/lib/quiz/types";

export const ENGLISH_J2D_MORE_B: QuizUnit[] = [
  // ================================================================
  // 接続詞（when / if / that / because）— 追加7問
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
        id: "j2de2-conjunction-m1",
        question: "Please call me ___ you arrive at the station.（駅に着いたら電話してください）",
        choices: ["when", "if", "that", "because"],
        answerIndex: 0,
        explanation:
          "「〜したとき・〜したら」と時を表すのは when です。「駅に着いたら電話して」という時の節なので when を使います。if は「もし〜かどうかわからない」という不確かな条件に使います。",
        choiceHints: [
          null,
          "if は「もし〜なら（かもしれない）」と不確かな条件を表します。到着したときに電話してほしい、という時の節なので when です。",
          "that は「〜ということ」です。「〜したとき・〜したら」は when です。",
          "because は「〜だから」と理由を表します。「〜したら（電話して）」は時を表す when です。",
        ],
      },
      {
        id: "j2de2-conjunction-m2",
        question: "She stayed home from school ___ she had a cold.（彼女は風邪をひいていたので学校を休んだ）",
        choices: ["when", "if", "because", "that"],
        answerIndex: 2,
        explanation:
          "「〜だから・〜なので」と理由を表すのは because です。「風邪をひいていた」ことが学校を休んだ理由です。",
        choiceHints: [
          "when は「〜のとき」です。ここは理由を表す because です。",
          "if は「もし〜なら」です。ここは理由を表す because です。",
          null,
          "that は「〜ということ」です。理由を表すのは because です。",
        ],
      },
      {
        id: "j2de2-conjunction-m3",
        question: "___ you have time, please help me.（もし時間があれば、手伝ってください）",
        choices: ["Because", "When", "That", "If"],
        answerIndex: 3,
        explanation:
          "「もし〜なら」と条件を表すのは if です。",
        choiceHints: [
          "Because は「〜だから」と理由を表します。「もし〜なら」は If です。",
          "When は「〜のとき」です。「もし〜なら」は If です。",
          "That は「〜ということ」です。条件を表すのは If です。",
          null,
        ],
      },
      {
        id: "j2de2-conjunction-m4",
        question: "We all know ___ the earth goes around the sun.（地球が太陽のまわりを回ることは誰もが知っている）",
        choices: ["when", "if", "because", "that"],
        answerIndex: 3,
        explanation:
          "know のあとで「〜ということ（事実）」を表すのは接続詞 that です。確かな事実を述べるときには that を使い、if/whether（〜かどうか）は使いません。この that は省略することもできます。",
        choiceHints: [
          "when は「〜のとき」です。know のあとで「〜ということ」は that です。",
          "if は「〜かどうか」と不確かな内容に使います。確かな事実を述べるここでは that を使います。",
          "because は「〜だから」です。ここでは「〜ということ」の that を使います。",
          null,
        ],
      },
      {
        id: "j2de2-conjunction-m5",
        question: "If it ___ sunny tomorrow, we will go to the park.（もし明日晴れなら、公園に行こう）",
        choices: ["is", "will be", "was", "were"],
        answerIndex: 0,
        explanation:
          "if が導く文の中では、これからのことでも現在形を使うのがルールです。主語 it には is を使います。",
        choiceHints: [
          null,
          "if の文の中では will を使いません。現在形 is にします。",
          "was は過去形です。ここは現在形 is を使います。",
          "were は過去形（または仮定法）です。ここは現在形 is を使います。",
        ],
      },
      {
        id: "j2de2-conjunction-m6",
        question: "I was listening to music ___ he called me.（彼が電話してきたとき、私は音楽を聞いていた）",
        choices: ["because", "when", "if", "that"],
        answerIndex: 1,
        explanation:
          "「〜したとき」と時を表すのは when です。「彼が電話してきたとき」という時の節が続いています。",
        choiceHints: [
          "because は「〜だから」と理由を表します。「〜したとき」は when です。",
          null,
          "if は「もし〜なら」と条件を表します。「〜したとき」は when です。",
          "that は「〜ということ」です。「〜したとき」は when です。",
        ],
      },
      {
        id: "j2de2-conjunction-m7",
        question: "I hope ___ you will get better soon.（あなたがすぐによくなることを願っています）",
        choices: ["when", "if", "because", "that"],
        answerIndex: 3,
        explanation:
          "hope のあとで「〜ということ（を願う）」を表すのは接続詞 that です。この that は省略することもできます。",
        choiceHints: [
          "when は「〜のとき」です。hope のあとで「〜ということ」は that です。",
          "if は「もし〜なら」です。ここでは「〜ということ」の that を使います。",
          "because は「〜だから」です。ここでは「〜ということ」の that を使います。",
          null,
        ],
      },
    ],
  },

  // ================================================================
  // 比較（比較級・最上級・as 〜 as）— 追加7問
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
        id: "j2de2-comparison-m1",
        question: "This road is ___ than that one.（この道はあの道より長い）",
        choices: ["long", "longer", "longest", "more long"],
        answerIndex: 1,
        explanation:
          "than があるので比較級です。long は短い語なので -er をつけて longer にします。",
        choiceHints: [
          "than があるので比較級にします。long ではなく longer です。",
          null,
          "longest は最上級（いちばん長い）です。2つを比べるときは比較級 longer です。",
          "long は短い語なので more はつけません。-er をつけて longer にします。",
        ],
      },
      {
        id: "j2de2-comparison-m2",
        question: "She runs the ___ of all.（彼女は全員の中でいちばん速く走る）",
        choices: ["fast", "faster", "fastest", "most fast"],
        answerIndex: 2,
        explanation:
          "「いちばん速く」は最上級です。fast は短い語なので -est をつけて fastest にします。the と of all があるので最上級です。",
        choiceHints: [
          "the と of all があるので最上級にします。fast ではなく fastest です。",
          "faster は比較級（〜より速い）です。「いちばん」は最上級 fastest です。",
          null,
          "fast は短い語なので most はつけません。-est をつけて fastest にします。",
        ],
      },
      {
        id: "j2de2-comparison-m3",
        question: "This movie is ___ than that one.（この映画はあの映画よりおもしろい）",
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
        id: "j2de2-comparison-m4",
        question: "Ken is the ___ boy in our class.（ケンはクラスでいちばん背が高い男子だ）",
        choices: ["tall", "taller", "tallest", "most tall"],
        answerIndex: 2,
        explanation:
          "「いちばん背が高い」は最上級です。tall は短い語なので -est をつけて tallest にします。the と in our class があるので最上級です。",
        choiceHints: [
          "the と in our class があるので最上級にします。tall ではなく tallest です。",
          "taller は比較級（〜より背が高い）です。「いちばん」は最上級 tallest です。",
          null,
          "tall は短い語なので most はつけません。-est をつけて tallest にします。",
        ],
      },
      {
        id: "j2de2-comparison-m5",
        question: "I can swim as ___ as my brother.（私は兄と同じくらい速く泳げる）",
        choices: ["fast", "faster", "fastest", "more fast"],
        answerIndex: 0,
        explanation:
          "〈as + 原級 + as〉は「〜と同じくらい…」を表します。as と as の間は原級（もとの形）の fast にします。",
        choiceHints: [
          null,
          "as 〜 as の間は原級（もとの形）にします。faster ではなく fast です。",
          "fastest は最上級です。as 〜 as の間は原級 fast です。",
          "fast は短い語で more はつけません。as 〜 as の間は原級 fast です。",
        ],
      },
      {
        id: "j2de2-comparison-m6",
        question: "This year's weather is ___ than last year's.（今年の天気は去年より悪い）",
        choices: ["bad", "more bad", "worse", "worst"],
        answerIndex: 2,
        explanation:
          "bad は不規則に変化する語で、比較級は worse です。more bad や badder とはしません。",
        choiceHints: [
          "than があるので比較級にします。bad ではなく worse です。",
          "bad に more はつけません。比較級は worse です。",
          null,
          "worst は最上級（いちばん悪い）です。than があるので比較級 worse です。",
        ],
      },
      {
        id: "j2de2-comparison-m7",
        question: "He has ___ money than I do.（彼は私より多くのお金を持っている）",
        choices: ["many", "much", "more", "most"],
        answerIndex: 2,
        explanation:
          "much は不規則に変化する語で、比較級は more です。than があるので比較級 more にします。money は数えられない名詞なので much の比較級 more を使います。",
        choiceHints: [
          "many は数えられる名詞に使います。money（数えられない）の比較級は more です。",
          "than があるので比較級にします。much ではなく more です。",
          null,
          "most は最上級（いちばん多い）です。than があるので比較級 more です。",
        ],
      },
    ],
  },

  // ================================================================
  // 受動態（be + 過去分詞 / by 〜）— 追加7問
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
        id: "j2de2-passive-m1",
        question: "This building was ___ 100 years ago.（この建物は100年前に建てられた）",
        choices: ["build", "builds", "built", "building"],
        answerIndex: 2,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。build の過去分詞は built なので was built となります。",
        choiceHints: [
          "was のあとは過去分詞にします。build ではなく built です。",
          "builds は現在形です。受動態は過去分詞 built を使います。",
          null,
          "building は -ing 形です。受動態は過去分詞 built を使います。",
        ],
      },
      {
        id: "j2de2-passive-m2",
        question: "French ___ in this school.（この学校ではフランス語が教えられている）",
        choices: ["is taught", "is teach", "teaches", "was taught"],
        answerIndex: 0,
        explanation:
          "「教えられている」という現在の受動態なので is taught となります。teach の過去分詞は taught です。",
        choiceHints: [
          null,
          "is のあとは過去分詞にします。teach ではなく taught です。",
          "teaches は能動態の現在形です。「教えられている」は受動態 is taught です。",
          "was taught は過去の受動態です。今の状態なので現在の is taught を使います。",
        ],
      },
      {
        id: "j2de2-passive-m3",
        question: "「この橋は多くの人に知られている」を表す英文はどれ？",
        choices: [
          "This bridge is known to many people.",
          "This bridge is know to many people.",
          "This bridge was known to many people.",
          "This bridge knows many people.",
        ],
        answerIndex: 0,
        explanation:
          "「知られている」という現在の受動態は is known です。know の過去分詞は known で、「〜に知られている」は be known to 〜 と表します。",
        choiceHints: [
          null,
          "is のあとは過去分詞にします。know ではなく known です。",
          "was known は過去の受動態（知られていた）です。今の状態なので is known です。",
          "これでは「橋が多くの人を知る」という能動の意味になります。受動態は is known です。",
        ],
      },
      {
        id: "j2de2-passive-m4",
        question: "This novel was ___ by a famous author.（この小説は有名な作家によって書かれた）",
        choices: ["write", "wrote", "writing", "written"],
        answerIndex: 3,
        explanation:
          "受動態は〈be動詞 + 過去分詞〉です。write の過去分詞は written なので was written となります。",
        choiceHints: [
          "was のあとは過去分詞にします。write ではなく written です。",
          "wrote は過去形です。受動態は過去分詞 written を使います。",
          "writing は -ing 形です。受動態は過去分詞 written を使います。",
          null,
        ],
      },
      {
        id: "j2de2-passive-m5",
        question: "「その店では帽子が売られていますか」を表す英文はどれ？",
        choices: [
          "Is hats sold at the store?",
          "Are hats sold at the store?",
          "Are hats sell at the store?",
          "Do hats sold at the store?",
        ],
        answerIndex: 1,
        explanation:
          "受動態の疑問文は be動詞を主語の前に出します。hats は複数なので Are hats sold 〜? となります。sell の過去分詞は sold です。",
        choiceHints: [
          "hats（複数）には Is ではなく Are を使います。Are hats sold 〜? が正しい形です。",
          null,
          "Are のあとは過去分詞にします。sell ではなく sold です。",
          "受動態の疑問文に do は使いません。Are hats sold 〜? とします。",
        ],
      },
      {
        id: "j2de2-passive-m6",
        question: "These songs ___ by young people.（これらの歌は若者に愛されている）",
        choices: ["is loved", "are loved", "loves", "loved"],
        answerIndex: 1,
        explanation:
          "主語 These songs が複数で現在の受動態なので are loved となります。",
        choiceHints: [
          "is は単数に使います。複数の主語には are を使います。are loved です。",
          null,
          "loves は能動態の現在形です。「愛されている」は受動態 are loved です。",
          "be動詞がないと受動態になりません。are loved とします。",
        ],
      },
      {
        id: "j2de2-passive-m7",
        question: "The movie was not ___ by many people.（その映画は多くの人には見られなかった）",
        choices: ["see", "saw", "seen", "seeing"],
        answerIndex: 2,
        explanation:
          "受動態の否定は be動詞 + not + 過去分詞です。see の過去分詞は seen なので was not seen となります。",
        choiceHints: [
          "was not のあとは過去分詞にします。see ではなく seen です。",
          "saw は過去形です。受動態は過去分詞 seen を使います。",
          null,
          "seeing は -ing 形です。受動態は過去分詞 seen を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // There is / There are — 追加7問
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
        id: "j2de2-there-is-m1",
        question: "There ___ two dogs in the garden.（庭に犬が2匹いる）",
        choices: ["is", "are", "was", "has"],
        answerIndex: 1,
        explanation:
          "あとの名詞 two dogs が複数なので There are を使います。",
        choiceHints: [
          "is は単数の名詞のときに使います。two dogs（複数）には are を使います。",
          null,
          "was は過去の単数です。複数の現在なので are です。",
          "「〜がある」は There is/are で表します。has は使いません。",
        ],
      },
      {
        id: "j2de2-there-is-m2",
        question: "There ___ a hospital near my school last year.（去年、学校の近くに病院があった）",
        choices: ["is", "are", "was", "were"],
        answerIndex: 2,
        explanation:
          "「去年あった」という過去で、a hospital は単数なので There was を使います。",
        choiceHints: [
          "「あった」という過去なので is ではなく was を使います。",
          "are は現在の複数です。過去の単数なので was です。",
          null,
          "were は過去の複数に使います。a hospital（単数）には was を使います。",
        ],
      },
      {
        id: "j2de2-there-is-m3",
        question: "___ there a post office near here?（この近くに郵便局はありますか）",
        choices: ["Do", "Does", "Is", "Are"],
        answerIndex: 2,
        explanation:
          "There is の疑問文は Is を there の前に出します。a post office は単数なので Is there 〜? となります。",
        choiceHints: [
          "There の疑問文に do は使いません。Is there 〜? とします。",
          "There の疑問文に does は使いません。Is there 〜? とします。",
          null,
          "Are は複数のときに使います。a post office（単数）には Is を使います。",
        ],
      },
      {
        id: "j2de2-there-is-m4",
        question: "There ___ any water in the glass.（グラスに水が入っていない）",
        choices: ["aren't", "isn't", "don't", "doesn't"],
        answerIndex: 1,
        explanation:
          "water は数えられない名詞なので There is を使い、否定は There isn't になります。",
        choiceHints: [
          "aren't は複数のときに使います。water（数えられない）には isn't を使います。",
          null,
          "don't は一般動詞の否定です。There の否定は isn't を使います。",
          "doesn't は一般動詞の否定です。There の否定は isn't を使います。",
        ],
      },
      {
        id: "j2de2-there-is-m5",
        question: "There ___ five students in the room then.（そのとき部屋に生徒が5人いた）",
        choices: ["is", "are", "was", "were"],
        answerIndex: 3,
        explanation:
          "「そのときいた」という過去で、five students は複数なので There were を使います。",
        choiceHints: [
          "is は現在の単数です。過去で複数なので were です。",
          "are は現在の複数です。then があるので過去の were です。",
          "was は過去の単数です。five students（複数）には were を使います。",
          null,
        ],
      },
      {
        id: "j2de2-there-is-m6",
        question: "「公園にベンチがいくつありますか」を表す英文はどれ？",
        choices: [
          "How many benches are there in the park?",
          "How many benches is there in the park?",
          "How many benches there are in the park?",
          "How much benches are there in the park?",
        ],
        answerIndex: 0,
        explanation:
          "「いくつ〜がありますか」は How many + 複数名詞 + are there 〜? で表します。benches は複数なので are there を使います。",
        choiceHints: [
          null,
          "benches（複数）には is ではなく are を使います。How many benches are there 〜? です。",
          "疑問文は are を there の前に出します。ふつうの語順のままでは疑問文になりません。",
          "bench は数えられる名詞なので how much ではなく how many を使います。",
        ],
      },
      {
        id: "j2de2-there-is-m7",
        question: "There ___ a lot of rice in the bowl.（どんぶりにご飯がたくさんある）",
        choices: ["is", "are", "were", "have"],
        answerIndex: 0,
        explanation:
          "rice は数えられない名詞なので There is を使います。",
        choiceHints: [
          null,
          "are は複数のときに使います。rice（数えられない）には is を使います。",
          "were は過去の複数に使います。今のことで数えられない名詞なので is です。",
          "「〜がある」は There is/are で表します。have は使いません。",
        ],
      },
    ],
  },

  // ================================================================
  // 文型（give 型・call 型・look 型）— 追加7問
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
        id: "j2de2-sentence-pattern-m1",
        question: "She showed ___ her photos.（彼女は私に自分の写真を見せてくれた）",
        choices: ["I", "me", "my", "mine"],
        answerIndex: 1,
        explanation:
          "show + 人 + 物の形で、「人」には目的格が入ります。「私に」は me です。",
        choiceHints: [
          "I は主語に使う形です。「私に」は目的格の me を使います。",
          null,
          "my は「私の」で、うしろに名詞が必要です。「私に」は me です。",
          "mine は「私のもの」です。「私に」は me です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-m2",
        question: "They sent ___ a birthday card.（彼らは彼女に誕生日カードを送った）",
        choices: ["she", "her", "hers", "herself"],
        answerIndex: 1,
        explanation:
          "send + 人 + 物の形で、「人」には目的格が入ります。「彼女に」は her です。",
        choiceHints: [
          "she は主語に使う形です。「彼女に」は目的格の her を使います。",
          null,
          "hers は「彼女のもの」です。「彼女に」は her です。",
          "herself は再帰代名詞です。「彼女に」は目的格の her です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-m3",
        question: "Please call ___ Tom.（私のことをトムと呼んでください）",
        choices: ["I", "my", "me", "mine"],
        answerIndex: 2,
        explanation:
          "call + O + C の形で、O（呼ばれる人）には目的格が入ります。「私を」は me です。",
        choiceHints: [
          "I は主語に使う形です。「私を」は目的格の me を使います。",
          "my は「私の」です。「私を」は目的格の me です。",
          null,
          "mine は「私のもの」です。「私を」は me です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-m4",
        question: "The exercise made her ___.（その運動は彼女を強くした）",
        choices: ["strong", "strongly", "strength", "to strong"],
        answerIndex: 0,
        explanation:
          "make + O + C の形で、C には形容詞が入ります。made her strong で「彼女を強くした」を表します。",
        choiceHints: [
          null,
          "strongly は副詞です。ここは形容詞 strong を使います。",
          "strength は名詞（力・強さ）です。ここは形容詞 strong を使います。",
          "to strong とはいいません。ここは形容詞 strong です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-m5",
        question: "She got ___ when she heard the music.（彼女は音楽を聞いて元気になった）",
        choices: ["energetic", "energetically", "energy", "to energetic"],
        answerIndex: 0,
        explanation:
          "get + 形容詞で「〜になる」を表します。got energetic で「元気になった」となります。",
        choiceHints: [
          null,
          "energetically は副詞です。get のあとは形容詞 energetic です。",
          "energy は名詞（エネルギー）です。get のあとは形容詞 energetic です。",
          "to energetic とはいいません。get のあとは形容詞 energetic です。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-m6",
        question: "My father gave a book ___ me.（父は私に本を一冊くれた）",
        choices: ["to", "for", "of", "with"],
        answerIndex: 0,
        explanation:
          "give + 物 + to + 人 の語順（書き換え形）では「人」のまえに to を置きます。gave a book to me となります。",
        choiceHints: [
          null,
          "for を使うのは buy/cook/make など「相手のために作る」動詞の書き換えです。give の書き換えは to を使います。",
          "of は「〜の」の意味です。give の書き換えは to を使います。",
          "with は「〜といっしょに」の意味です。give の書き換えは to を使います。",
        ],
      },
      {
        id: "j2de2-sentence-pattern-m7",
        question: "That music sounds ___.（あの音楽は悲しそうに聞こえる）",
        choices: ["sad", "sadly", "sadness", "sadder"],
        answerIndex: 0,
        explanation:
          "sound + 形容詞で「〜に聞こえる・〜のように聞こえる」を表します。sounds sad で「悲しそうに聞こえる」となります。",
        choiceHints: [
          null,
          "sadly は副詞です。sound のあとは形容詞 sad を使います。",
          "sadness は名詞（悲しみ）です。sound のあとは形容詞 sad を使います。",
          "sadder は比較級です。sound のあとは原級の形容詞 sad を使います。",
        ],
      },
    ],
  },

  // ================================================================
  // 疑問詞 + to（how to など）— 追加7問
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
        id: "j2de2-wh-to-m1",
        question: "He taught me how ___ a bike.（彼は私に自転車の乗り方を教えてくれた）",
        choices: ["ride", "to ride", "riding", "rode"],
        answerIndex: 1,
        explanation:
          "「〜のしかた」は how to + 原形で表します。how to ride となります。",
        choiceHints: [
          "how のあとは to をつけます。ride ではなく to ride です。",
          null,
          "how to のあとは原形です。riding ではなく to ride です。",
          "how to のあとは原形です。rode ではなく to ride です。",
        ],
      },
      {
        id: "j2de2-wh-to-m2",
        question: "I don't know what ___ in this situation.（私はこの状況で何をすべきかわからない）",
        choices: ["do", "to do", "doing", "did"],
        answerIndex: 1,
        explanation:
          "「何を〜すべきか」は what to + 原形で表します。what to do となります。",
        choiceHints: [
          "what のあとは to をつけます。do ではなく to do です。",
          null,
          "what to のあとは原形です。doing ではなく to do です。",
          "what to のあとは原形です。did ではなく to do です。",
        ],
      },
      {
        id: "j2de2-wh-to-m3",
        question: "She didn't know where ___ her keys.（彼女は鍵をどこに置くべきかわからなかった）",
        choices: ["put", "to put", "putting", "puts"],
        answerIndex: 1,
        explanation:
          "「どこに〜すべきか」は where to + 原形で表します。where to put となります。",
        choiceHints: [
          "where のあとは to をつけます。put ではなく to put です。",
          null,
          "where to のあとは原形です。putting ではなく to put です。",
          "where to のあとは原形です。puts ではなく to put です。",
        ],
      },
      {
        id: "j2de2-wh-to-m4",
        question: "We learned how ___ a traditional dish.（私たちは伝統料理の作り方を学んだ）",
        choices: ["make", "to make", "making", "made"],
        answerIndex: 1,
        explanation:
          "「〜のしかた・作り方」は how to + 原形で表します。how to make となります。",
        choiceHints: [
          "how のあとは to をつけます。make ではなく to make です。",
          null,
          "how to のあとは原形です。making ではなく to make です。",
          "how to のあとは原形です。made ではなく to make です。",
        ],
      },
      {
        id: "j2de2-wh-to-m5",
        question: "「彼はいつ出発すべきか迷っていた」を表す英文はどれ？",
        choices: [
          "He was wondering when to leave.",
          "He was wondering when leaving.",
          "He was wondering when to leaving.",
          "He was wondering when leave.",
        ],
        answerIndex: 0,
        explanation:
          "「いつ〜すべきか」は when to + 原形で表します。when to leave となります。",
        choiceHints: [
          null,
          "when のあとは to + 原形にします。leaving ではなく to leave です。",
          "to のあとは原形にします。to leaving ではなく to leave です。",
          "when のあとは to をつけます。leave ではなく to leave です。",
        ],
      },
      {
        id: "j2de2-wh-to-m6",
        question: "I'm not sure ___ to answer this question.（この問題にどう答えるべきかわからない）",
        choices: ["how", "what", "where", "when"],
        answerIndex: 0,
        explanation:
          "「どう〜すべきか・〜のしかた」は how to + 原形で表します。how to answer となります。",
        choiceHints: [
          null,
          "what to answer は「何を答えるべきか」です。「どう答えるべきか」は how to answer です。",
          "where to answer は「どこで答えるべきか」です。「どう答えるべきか」は how です。",
          "when to answer は「いつ答えるべきか」です。「どう答えるべきか」は how です。",
        ],
      },
      {
        id: "j2de2-wh-to-m7",
        question: "Could you show me ___ to fill in this form?（この用紙にどう記入するか教えてもらえますか）",
        choices: ["how", "what", "where", "when"],
        answerIndex: 0,
        explanation:
          "「どのように〜すべきか・〜のしかた」は how to + 原形で表します。how to fill in となります。",
        choiceHints: [
          null,
          "what to fill in は「何を記入すべきか」です。「どう記入するか」は how to fill in です。",
          "where to fill in は「どこに記入すべきか」です。「どのように」は how です。",
          "when to fill in は「いつ記入すべきか」です。「どのように」は how です。",
        ],
      },
    ],
  },
];
