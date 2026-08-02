/**
 * Star glyph catalogue — six forms, all drawn in one 32-unit box so they can
 * be swapped by name at any size. Extracted from the star catalogue design.
 *
 * `accent: true` layers take the accent colour; everything else takes the
 * base colour. `minSize` is the smallest px size the form still reads at.
 */

export type StarName = 'sirius' | 'airy' | 'atlas' | 'nova' | 'kepler' | 'lyra';

export interface StarLayer {
  d: string;
  /** stroked instead of filled */
  stroke?: boolean;
  width?: number;
  accent?: boolean;
  opacity?: number;
  transform?: string;
}

export interface StarGlyph {
  label: string;
  note: string;
  minSize: number;
  layers: StarLayer[];
}

export const STAR_VIEWBOX = 32;

export const STAR_GLYPHS: Record<StarName, StarGlyph> = {
  sirius: {
    label: "Sirius",
    note: "Four bowed needles with a bright core. The default node star.",
    minSize: 8,
    layers: [
      { d: "M16.00 0.40Q17.73 11.82 17.77 14.23Q20.18 14.27 31.60 16.00Q20.18 17.73 17.77 17.77Q17.73 20.18 16.00 31.60Q14.27 20.18 14.23 17.77Q11.82 17.73 0.40 16.00Q11.82 14.27 14.23 14.23Q14.27 11.82 16.00 0.40Z" },
      { d: "M16 14.00A2 2 0 1 0 16 18.00A2 2 0 1 0 16 14.00Z" },
    ],
  },
  airy: {
    label: "Airy",
    note: "A defocused disc — no points. Softest of the set.",
    minSize: 5,
    layers: [
      { d: "M16 2.00A14 14 0 1 0 16 30.00A14 14 0 1 0 16 2.00Z", accent: true, opacity: 0.12 },
      { d: "M16 7.00A9 9 0 1 0 16 25.00A9 9 0 1 0 16 7.00Z", opacity: 0.14 },
      { d: "M16 11.00A5 5 0 1 0 16 21.00A5 5 0 1 0 16 11.00Z", opacity: 0.4 },
      { d: "M16 13.70A2.3 2.3 0 1 0 16 18.30A2.3 2.3 0 1 0 16 13.70Z" },
    ],
  },
  atlas: {
    label: "Atlas",
    note: "Core and ring. Chart notation rather than decoration.",
    minSize: 10,
    layers: [
      { d: "M16 4.40A11.6 11.6 0 1 0 16 27.60A11.6 11.6 0 1 0 16 4.40Z", stroke: true, width: 1.35, opacity: 0.41 },
      { d: "M16 12.90A3.1 3.1 0 1 0 16 19.10A3.1 3.1 0 1 0 16 12.90Z" },
    ],
  },
  nova: {
    label: "Nova",
    note: "Core inside two rings. Emphasis — scroll cue, active states.",
    minSize: 12,
    layers: [
      { d: "M16 2.60A13.4 13.4 0 1 0 16 29.40A13.4 13.4 0 1 0 16 2.60Z", stroke: true, width: 1, opacity: 0.15 },
      { d: "M16 7.60A8.4 8.4 0 1 0 16 24.40A8.4 8.4 0 1 0 16 7.60Z", stroke: true, width: 1.2, opacity: 0.33 },
      { d: "M16 13.20A2.8 2.8 0 1 0 16 18.80A2.8 2.8 0 1 0 16 13.20Z" },
    ],
  },
  kepler: {
    label: "Kepler",
    note: "A tilted orbit with its planet. Ties to the planetarium.",
    minSize: 16,
    layers: [
      { d: "M1.60 16A14.4 5.5 0 1 0 30.40 16A14.4 5.5 0 1 0 1.60 16Z", stroke: true, width: 1.2, opacity: 0.36, transform: "rotate(-22 16 16)" },
      { d: "M30.4 14.50A1.5 1.5 0 1 0 30.4 17.50A1.5 1.5 0 1 0 30.4 14.50Z", accent: true, transform: "rotate(-22 16 16)" },
      { d: "M16 13.00A3 3 0 1 0 16 19.00A3 3 0 1 0 16 13.00Z" },
    ],
  },
  lyra: {
    label: "Lyra",
    note: "Sirius needles inside an Airy disc. What the projects chart renders.",
    minSize: 8,
    layers: [
      { d: "M16 3.00A13 13 0 1 0 16 29.00A13 13 0 1 0 16 3.00Z", accent: true, opacity: 0.13 },
      { d: "M16 9.40A6.6 6.6 0 1 0 16 22.60A6.6 6.6 0 1 0 16 9.40Z", opacity: 0.14 },
      { d: "M16.00 0.60Q17.70 11.89 17.70 14.30Q20.11 14.30 31.40 16.00Q20.11 17.70 17.70 17.70Q17.70 20.11 16.00 31.40Q14.30 20.11 14.30 17.70Q11.89 17.70 0.60 16.00Q11.89 14.30 14.30 14.30Q14.30 11.89 16.00 0.60Z" },
      { d: "M16 14.00A2 2 0 1 0 16 18.00A2 2 0 1 0 16 14.00Z" },
    ],
  },
};

export const STAR_NAMES = Object.keys(STAR_GLYPHS) as StarName[];
