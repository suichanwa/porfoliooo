/**
 * Public interface to the star glyph catalogue. `starGlyphs.ts` stays pure
 * data — this is the layer everything else should actually import from, so
 * new glyphs only ever need to be added in one place (the catalogue) and
 * this file's guarantees keep holding for free.
 */
import {
  STAR_GLYPHS,
  STAR_NAMES,
  STAR_VIEWBOX,
  type StarGlyph,
  type StarLayer,
  type StarName,
} from "./starGlyphs";

export type { StarGlyph, StarLayer, StarName };
export { STAR_VIEWBOX };

export const DEFAULT_STAR: StarName = "sirius";

/** Runtime type guard — use before trusting a name from outside TS (CMS data, a URL param, GitHub metadata, ...). */
export function isStarName(value: unknown): value is StarName {
  return typeof value === "string" && (STAR_NAMES as string[]).includes(value);
}

/**
 * Safe glyph lookup. Falls back to `DEFAULT_STAR` for an unknown name
 * instead of throwing, so a bad value never takes a whole page down —
 * it just warns in dev.
 */
export function getStar(name: StarName | (string & {}) | undefined | null): StarGlyph {
  if (isStarName(name)) return STAR_GLYPHS[name];
  if (name != null && import.meta.env?.DEV) {
    console.warn(`[StarAPI] Unknown star "${name}", falling back to "${DEFAULT_STAR}".`);
  }
  return STAR_GLYPHS[DEFAULT_STAR];
}

export interface StarCatalogEntry extends StarGlyph {
  name: StarName;
}

/** All glyphs as a flat, iterable list — for pickers, catalogues, docs pages. */
export function listStars(): StarCatalogEntry[] {
  return STAR_NAMES.map((name) => ({ name, ...STAR_GLYPHS[name] }));
}

/** Smallest px size the glyph still reads at (see README). */
export function getMinSize(name: StarName): number {
  return STAR_GLYPHS[name].minSize;
}

/** Whether a glyph is legible at the given render size. */
export function meetsMinSize(name: StarName, size: number): boolean {
  return size >= getMinSize(name);
}

/** Deterministic round-robin pick — same index always yields the same star. */
export function pickStarByIndex(index: number): StarName {
  return STAR_NAMES[((index % STAR_NAMES.length) + STAR_NAMES.length) % STAR_NAMES.length];
}

/**
 * Deterministic pick from an arbitrary string (a project id, a title, ...).
 * Same input always yields the same star — no state to store, no randomness
 * to reseed, stable across rebuilds.
 */
export function pickStarBySeed(seed: string): StarName {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return pickStarByIndex(hash);
}
