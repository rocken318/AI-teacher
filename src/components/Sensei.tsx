import styles from "./Sensei.module.css";

export type SenseiMood = "idle" | "greet" | "happy" | "think" | "oops";

/**
 * マスコット「フクロウ先生」（craft版）。
 *
 * ※ 現在アプリ本体では未使用（休眠）。将来キャラを本採用するときに使う。
 *   - 本体は温かいクリーム色、テーマ主色 rgb(var(--c-primary)) は帽子/めがね/本のアクセントのみ
 *     （＝学齢モードでアクセント色が変わる）。単色ブロブを避けた“デザインされた”方向。
 *   - mood で表情＋モーション（浮遊/弾む+きらきら/汗/点々）。軽量SVG＋CSSのみ・外部依存なし。
 *   - message を渡すと ふきだし。prefers-reduced-motion で静止。
 */
export function Sensei({
  mood = "idle",
  size = 120,
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

  const acc = "rgb(var(--c-primary))"; // テーマ主色（アクセント）

  const mouth =
    mood === "happy"
      ? '<path d="M90 119 Q100 133 110 119 Q100 126 90 119 Z" fill="#a8683d" stroke="#7a5a3a" stroke-width="1.6"/>'
      : mood === "oops"
        ? '<path d="M92 124 Q97 118 102 124 Q107 130 112 124" fill="none" stroke="#7a5a3a" stroke-width="2.2" stroke-linecap="round"/>'
        : mood === "think"
          ? '<circle cx="100" cy="123" r="3.2" fill="none" stroke="#7a5a3a" stroke-width="2.2"/>'
          : '<path d="M92 120 Q100 127 108 120" fill="none" stroke="#7a5a3a" stroke-width="2.4" stroke-linecap="round"/>';

  const happyEyes = mood === "happy";

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
          height={(size * 210) / 200}
          viewBox="0 0 200 210"
          role="img"
          aria-label="フクロウ先生"
          fill="none"
        >
          <defs>
            <linearGradient id="s-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f2e1c6" />
              <stop offset="1" stopColor="#e3cba4" />
            </linearGradient>
            <linearGradient id="s-belly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fdf6ea" />
              <stop offset="1" stopColor="#f6e9d4" />
            </linearGradient>
            <radialGradient id="s-disc" cx="50%" cy="40%" r="70%">
              <stop offset="0" stopColor="#fdf7ec" />
              <stop offset="1" stopColor="#f3e6cf" />
            </radialGradient>
          </defs>

          <ellipse cx="100" cy="192" rx="50" ry="8" fill="rgba(40,32,20,.12)" />
          {/* 足 */}
          <g fill="none" stroke="#c9822f" strokeWidth="3" strokeLinecap="round">
            <path d="M84 184 l-6 8 M84 184 l0 9 M84 184 l6 8" />
            <path d="M116 184 l-6 8 M116 184 l0 9 M116 184 l6 8" />
          </g>
          {/* 耳の羽 */}
          <path d="M60 66 Q54 44 70 50 Q66 60 74 70 Z" fill="#d9bd93" />
          <path d="M140 66 Q146 44 130 50 Q134 60 126 70 Z" fill="#d9bd93" />
          {/* からだ */}
          <path
            d="M100 46 C58 46 40 82 40 122 C40 164 66 186 100 186 C134 186 160 164 160 122 C160 82 142 46 100 46 Z"
            fill="url(#s-body)"
          />
          {/* 羽 */}
          <path d="M44 108 C34 120 36 150 52 166 C48 140 50 122 58 110 Z" fill="#d7ba8f" />
          <path d="M156 108 C166 120 164 150 148 166 C152 140 150 122 142 110 Z" fill="#d7ba8f" />
          {/* おなか */}
          <ellipse cx="100" cy="132" rx="33" ry="42" fill="url(#s-belly)" />
          {/* 顔の面 */}
          <path
            d="M100 58 C70 58 55 78 55 100 C55 116 74 126 100 126 C126 126 145 116 145 100 C145 78 130 58 100 58 Z"
            fill="url(#s-disc)"
          />
          <line x1="100" y1="64" x2="100" y2="120" stroke="#e7d6bd" strokeWidth="1.5" />
          {/* ほっぺ */}
          <circle cx="60" cy="110" r="7" fill="#f4a6a0" opacity=".55" />
          <circle cx="140" cy="110" r="7" fill="#f4a6a0" opacity=".55" />
          {/* 目 */}
          {happyEyes ? (
            <g fill="none" stroke="#3a2f28" strokeWidth="5" strokeLinecap="round">
              <path d="M64 92 Q78 80 92 92" />
              <path d="M108 92 Q122 80 136 92" />
            </g>
          ) : (
            <g>
              <circle cx="78" cy="94" r="17" fill="#fffdf8" stroke="#e7d6bd" strokeWidth="1.5" />
              <circle cx="122" cy="94" r="17" fill="#fffdf8" stroke="#e7d6bd" strokeWidth="1.5" />
              <circle cx="80" cy="96" r="9.5" fill="#3a2f28" />
              <circle cx="120" cy="96" r="9.5" fill="#3a2f28" />
              <circle cx="77" cy="92" r="3.4" fill="#fff" />
              <circle cx="117" cy="92" r="3.4" fill="#fff" />
            </g>
          )}
          {/* めがね（テーマ色） */}
          <g fill="none" stroke={acc} strokeWidth="3">
            <circle cx="78" cy="94" r="20" />
            <circle cx="122" cy="94" r="20" />
            <path d="M98 94 q2 -3 4 0" />
            <path d="M58 92 l-9 -3" />
            <path d="M142 92 l9 -3" />
          </g>
          {/* くちばし */}
          <path d="M100 108 L94 116 Q100 121 106 116 Z" fill="#efa043" stroke="#d1832c" strokeWidth="1" />
          {/* 口（表情） */}
          <g dangerouslySetInnerHTML={{ __html: mouth }} />
          {/* 学士帽（テーマ色） */}
          <g>
            <path d="M64 52 Q100 40 136 52 Q100 62 64 52 Z" fill={acc} opacity=".25" />
            <path d="M70 46 L100 38 L130 46 L100 54 Z" fill={acc} />
            <circle cx="100" cy="46" r="3" fill="#efb958" />
            <path d="M100 46 Q126 48 126 62" fill="none" stroke="#efb958" strokeWidth="2" />
            <path d="M126 62 l-3 10 l3 2 l3 -2 z" fill="#efb958" />
          </g>
          {/* 本（テーマ色） */}
          <g transform="rotate(-12 150 150)">
            <rect x="138" y="140" width="26" height="18" rx="2" fill={acc} />
            <rect x="141" y="142" width="22" height="14" rx="1.5" fill="#fdf6ea" />
            <line x1="152" y1="142" x2="152" y2="156" stroke="#e7d6bd" strokeWidth="1.4" />
          </g>

          {/* mood 追加演出 */}
          {mood === "happy" && (
            <g fill={acc}>
              <path className={styles.sparkle} d="M26 66 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
              <path
                className={styles.sparkle}
                style={{ animationDelay: "0.3s" }}
                d="M172 74 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"
              />
            </g>
          )}
          {mood === "oops" && (
            <path className={styles.sweat} d="M150 78 q5 8 0 12 q-5 -4 0 -12z" fill="#7cc6ff" />
          )}
        </svg>
      </div>

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
