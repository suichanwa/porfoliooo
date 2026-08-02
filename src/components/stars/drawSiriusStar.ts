/**
 * Sirius glyph — four bowed needles + bright core.
 *
 * Drop-in replacement for `drawRoundedFivePointStar` in
 * src/hooks/useStarfieldCanvas.ts (line ~30). Same signature, so the single
 * call site needs only a rename. This is the same form the projects chart
 * now draws for its nodes (S·02 Sirius / S·09 Lyra in the star catalogue),
 * so the site-wide starfield and the chart speak one language.
 *
 * Tuning: R is the tip radius, `inner` the waist, `bow` how far the edges
 * pull toward the centre (1 = straight spikes, 0.5 = needles).
 */
export const drawSiriusStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) => {
  const R = radius * 1.9;
  const inner = R * 0.16;
  const bow = 0.5;
  const rotation = -Math.PI / 2;
  const step = Math.PI / 2;
  const ctrl = ((R + inner) / 2) * bow;

  const at = (angle: number, r: number): [number, number] => [
    Math.cos(angle) * r,
    Math.sin(angle) * r,
  ];

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(...at(rotation, R));

  for (let index = 0; index < 4; index += 1) {
    const a = rotation + index * step;
    const valley = a + step / 2;
    const next = a + step;
    ctx.quadraticCurveTo(...at((a + valley) / 2, ctrl), ...at(valley, inner));
    ctx.quadraticCurveTo(...at((valley + next) / 2, ctrl), ...at(next, R));
  }

  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // Bright core keeps the glyph legible once R drops under ~4px.
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(0.35, radius * 0.34), 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
};
