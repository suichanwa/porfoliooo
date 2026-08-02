# Star glyphs

Six forms from the catalogue: **Sirius, Airy, Atlas, Nova, Kepler, Lyra**.
All drawn in one 32-unit box, so anything can swap them by name at any size.

## Files

| File | Use |
| --- | --- |
| `starGlyphs.ts` | Path data + types. The catalogue itself — don't import this directly. |
| `StarAPI.ts` | The actual entry point: `getStar`, `isStarName`, `listStars`, `pickStarBySeed`, ... |
| `Star.tsx` | React component (`<Star name="lyra" size={20} />`). |
| `Star.astro` | Same component for `.astro` pages. |
| `drawSiriusStar.ts` | Canvas version of Sirius for the starfield hook. |
| `src/assets/stars/*.svg` | Standalone files for `<img>`, favicons, OG art — not used by the components above. |

Lives in `src/components/stars/`; the standalone SVGs live in `src/assets/stars/`.

## Usage

```tsx
import Star from "@/components/stars/Star";

<Star name="lyra" size={22} glow />
<Star name="nova" size={14} accent="#c792ea" />
<Star name="sirius" size={10} color="rgba(167,179,198,.9)" />
```

Two colours drive everything: `color` for the fills, `accent` for the halo
layers (Airy, Lyra) and Kepler's planet. Defaults are `#f4f7ff` / `#5e9fff`.

## Where each one earns its place

| Glyph | Reads down to | Suggested use |
| --- | --- | --- |
| **Sirius** | 8px | Default star — nodes, inline marks, the starfield canvas. |
| **Lyra** | 8px | Sirius inside an Airy disc. Project nodes in the chart (already live). |
| **Airy** | 5px | Ambient/background stars, anywhere points would be noisy. |
| **Atlas** | 10px | Marker states — visited, pinned, "you are here". |
| **Nova** | 12px | Emphasis: scroll cue, active nav, section anchors. |
| **Kepler** | 16px | Planetarium links and headers only — it needs room. |

Below its listed size a glyph doesn't fail loudly, it just goes mushy. Airy and
Sirius are the two safe at any size.

## Starfield canvas

`drawSiriusStar.ts` is a drop-in replacement for `drawRoundedFivePointStar` in
`src/hooks/useStarfieldCanvas.ts` (~line 30) — same signature, so the one call
site needs only a rename. That swap is what keeps the background starfield and
the project nodes speaking the same form; without it the page mixes a 5-point
star with the 4-point node star.
