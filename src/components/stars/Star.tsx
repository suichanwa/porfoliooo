import type { CSSProperties } from "react";
import { STAR_GLYPHS, STAR_VIEWBOX, type StarName } from "./starGlyphs";

interface StarProps {
  name?: StarName;
  /** Rendered box in px. */
  size?: number;
  /** Base colour for the fills. */
  color?: string;
  /** Colour for accent layers (Airy/Lyra halo, Kepler's planet). */
  accent?: string;
  /** Soft bloom behind the glyph. */
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Leave unset for decorative stars — they stay aria-hidden. */
  title?: string;
}

export default function Star({
  name = "sirius",
  size = 16,
  color = "#f4f7ff",
  accent = "#5e9fff",
  glow = false,
  className,
  style,
  title,
}: StarProps) {
  const glyph = STAR_GLYPHS[name];

  return (
    <svg
      viewBox={`0 0 ${STAR_VIEWBOX} ${STAR_VIEWBOX}`}
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{
        display: "block",
        overflow: "visible",
        filter: glow ? `drop-shadow(0 0 ${Math.round(size / 4)}px ${accent}55)` : undefined,
        ...style,
      }}
    >
      {glyph.layers.map((layer, i) => {
        const paint = layer.accent ? accent : color;
        return (
          <path
            key={i}
            d={layer.d}
            transform={layer.transform}
            opacity={layer.opacity}
            fill={layer.stroke ? "none" : paint}
            stroke={layer.stroke ? paint : undefined}
            strokeWidth={layer.width}
          />
        );
      })}
    </svg>
  );
}
