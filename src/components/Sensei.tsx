import styles from "./Sensei.module.css";

export type SenseiMood = "idle" | "greet" | "happy" | "think" | "oops";

/**
 * やさしい先生マスコット「せんせい」。
 * - テーマ主色（rgb(var(--c-primary))）で描くので、学齢モードで色も変わる。
 * - mood で表情とモーションが変化：idle/greet/happy/think/oops。
 * - message を渡すと ふきだし を表示。軽量な SVG＋CSS のみ（外部依存なし）。
 */
export function Sensei({
  mood = "idle",
  size = 96,
  message,
  className = "",
}: {
  mood?: SenseiMood;
  size?: number;
  message?: string;
  className?: string;
}) {
  const bodyAnim =
    mood === "happy"
      ? styles.happy
      : mood === "oops"
        ? styles.oops
        : styles.wrap;

  // 口の形（表情）
  const mouth =
    mood === "happy"
      ? "M48 84 Q60 98 72 84 Q60 92 48 84 Z"
      : mood === "oops"
        ? "M50 88 Q56 82 62 88 Q68 94 74 88"
        : mood === "think"
          ? "M56 88 Q60 90 64 88"
          : "M50 86 Q60 94 70 86"; // idle / greet：やさしい笑み

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {message && (
        <div className="relative mb-2 max-w-[15rem] rounded-2xl border border-line bg-white/90 px-4 py-2 text-center text-[13px] font-bold leading-snug text-ink shadow-soft">
          {message}
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-line bg-white/90" />
        </div>
      )}

      <div className={`${bodyAnim} ${mood === "think" ? styles.think : ""}`}>
        <svg
          width={size}
          height={size * 1.12}
          viewBox="0 0 120 134"
          role="img"
          aria-label="AI先生のキャラクター"
          fill="none"
        >
          {/* かげ */}
          <ellipse cx="60" cy="126" rx="30" ry="5" fill="rgb(var(--c-ink) / 0.10)" />

          {/* 学士帽（先生らしさ） */}
          <g stroke="rgb(var(--c-ink))" strokeWidth="2" strokeLinejoin="round">
            <path d="M60 12 L92 24 L60 36 L28 24 Z" fill="rgb(var(--c-ink))" />
            <path d="M46 30 L46 40 Q60 47 74 40 L74 30" fill="rgb(var(--c-ink))" />
            <line x1="92" y1="24" x2="92" y2="40" />
            <circle cx="92" cy="42" r="3" fill="rgb(var(--c-accent))" stroke="none" />
          </g>

          {/* からだ */}
          <ellipse cx="60" cy="80" rx="40" ry="42" fill="rgb(var(--c-primary))" />
          {/* おなか（明るく） */}
          <ellipse cx="60" cy="88" rx="25" ry="27" fill="rgb(var(--c-paper))" />

          {/* 手（あいさつで振る） */}
          <g className={mood === "greet" ? styles.wave : ""}>
            <circle cx="98" cy="86" r="9" fill="rgb(var(--c-primary))" />
          </g>
          <circle cx="22" cy="86" r="9" fill="rgb(var(--c-primary))" />

          {/* ほっぺ */}
          <circle cx="34" cy="80" r="6" fill="#ff9db0" opacity="0.8" />
          <circle cx="86" cy="80" r="6" fill="#ff9db0" opacity="0.8" />

          {/* 目（白目＋ひとみ）＋まぶた（まばたき） */}
          <g>
            <circle cx="47" cy="68" r="11" fill="#fff" stroke="rgb(var(--c-ink))" strokeWidth="2" />
            <circle cx="73" cy="68" r="11" fill="#fff" stroke="rgb(var(--c-ink))" strokeWidth="2" />
            <circle cx="49" cy="70" r="4.5" fill="rgb(var(--c-ink))" />
            <circle cx="71" cy="70" r="4.5" fill="rgb(var(--c-ink))" />
            <circle cx="47.5" cy="68" r="1.6" fill="#fff" />
            <circle cx="73.5" cy="68" r="1.6" fill="#fff" />
            {/* まぶた（body色で目をふさぐ） */}
            <ellipse className={styles.lid} cx="47" cy="68" rx="12" ry="12" fill="rgb(var(--c-primary))" />
            <ellipse className={styles.lid} cx="73" cy="68" rx="12" ry="12" fill="rgb(var(--c-primary))" />
          </g>

          {/* めがね（先生っぽく） */}
          <g stroke="rgb(var(--c-ink))" strokeWidth="2" fill="none" opacity="0.9">
            <line x1="58" y1="66" x2="62" y2="66" />
          </g>

          {/* 口 */}
          <path d={mouth} fill={mood === "happy" ? "rgb(var(--c-ink))" : "none"} stroke="rgb(var(--c-ink))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

          {/* うれしい：きらきら */}
          {mood === "happy" && (
            <g fill="rgb(var(--c-accent))">
              <path className={styles.sparkle} d="M18 44 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
              <path className={styles.sparkle} style={{ animationDelay: "0.3s" }} d="M100 50 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
            </g>
          )}

          {/* おっと：汗 */}
          {mood === "oops" && (
            <path className={styles.sweat} d="M92 52 q4 6 0 9 q-4 -3 0 -9 z" fill="#7cc6ff" />
          )}
        </svg>
      </div>

      {/* かんがえ中：点々 */}
      {mood === "think" && (
        <div className={`${styles.dots} mt-1 flex gap-1`} aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" />
          <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" />
          <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" />
        </div>
      )}
    </div>
  );
}
