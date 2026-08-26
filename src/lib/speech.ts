/**
 * Web Speech API の薄いラッパ（クライアント専用）
 *
 * Phase 2「低学年向けの音声補助＋UX」で使う。
 * - TTS: `speechSynthesis` で日本語(ja-JP)読み上げ。低学年向けに少しゆっくり。
 * - STT: `SpeechRecognition`/`webkitSpeechRecognition` で1回分の音声認識。
 *
 * 外部依存は増やさない。SSR で `window` を触らないよう、すべての呼び出しは
 * ブラウザ実行時(effect/イベント)からのみ行う前提。各関数はフィーチャー
 * ディテクションで安全に振る舞い、非対応環境ではクラッシュせず no-op になる。
 */

// ---- 型（Web Speech は lib.dom に無い環境もあるため緩めに定義） ----

type MinimalSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

/** ブラウザから SpeechRecognition コンストラクタを取得（非対応なら null） */
function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---- TTS（読み上げ） ----

/** 読み上げ（TTS）に対応しているか */
export function isTtsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * テキストを日本語(ja-JP)で読み上げる。
 * 低学年向けに少しゆっくり(rate 0.9 既定)。話す前に既存の発話をcancelする。
 */
export function speak(
  text: string,
  opts?: { rate?: number; onEnd?: () => void },
): void {
  if (!isTtsSupported()) return;
  const trimmed = text?.trim();
  if (!trimmed) return;

  try {
    // 話す前に既存の発話を止める（重複読み上げ防止）
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(trimmed);
    utter.lang = "ja-JP";
    utter.rate = opts?.rate ?? 0.9;

    // ja-JP の音声があれば優先的に割り当てる
    const jaVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang?.toLowerCase().startsWith("ja"));
    if (jaVoice) utter.voice = jaVoice;

    if (opts?.onEnd) {
      utter.onend = () => opts.onEnd?.();
      // エラー時も「終了」として扱い、UIの録音/読み上げ状態を戻せるようにする
      utter.onerror = () => opts.onEnd?.();
    }

    window.speechSynthesis.speak(utter);
  } catch {
    // 読み上げに失敗しても致命的ではないので握りつぶす
    opts?.onEnd?.();
  }
}

/** 読み上げを止める */
export function stopSpeaking(): void {
  if (!isTtsSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // no-op
  }
}

// ---- STT（音声入力） ----

/** 音声認識(STT)に対応しているか */
export function isSttSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

/**
 * 1回分の音声認識(ja-JP)を開始し、停止関数を返す。
 * - onResult: 認識できた文字列を渡す
 * - onError:  エラー時に呼ばれる
 * - onEnd:    録音終了時に呼ばれる（成功/失敗どちらでも）
 * 非対応なら何もせず noop を返す。
 */
export function listenOnce(opts?: {
  onResult: (text: string) => void;
  onError?: (e: any) => void;
  onEnd?: () => void;
}): () => void {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return () => {};

  let recognition: MinimalSpeechRecognition;
  try {
    recognition = new Ctor();
  } catch (e) {
    opts?.onError?.(e);
    opts?.onEnd?.();
    return () => {};
  }

  recognition.lang = "ja-JP";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    try {
      const transcript = event?.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) opts?.onResult?.(transcript);
    } catch (e) {
      opts?.onError?.(e);
    }
  };

  recognition.onerror = (event: any) => {
    opts?.onError?.(event);
  };

  recognition.onend = () => {
    opts?.onEnd?.();
  };

  try {
    recognition.start();
  } catch (e) {
    // すでに開始済みなどで start が投げることがある
    opts?.onError?.(e);
    opts?.onEnd?.();
    return () => {};
  }

  // 停止関数（呼ぶと録音を止める）
  return () => {
    try {
      recognition.stop();
    } catch {
      // no-op
    }
  };
}
