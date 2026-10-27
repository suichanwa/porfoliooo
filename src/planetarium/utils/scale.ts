const EARTH_RADIUS_KM = 6371;
const BASE_RADIUS = 0.5;
const MIN_RADIUS = 0.05;

export const scalePlanetRadius = (
  radiusKm: number,
  isMoon: boolean = false,
  parentRadiusKm?: number
) => {
  if (isMoon) {
    const parentR = parentRadiusKm
      ? Math.cbrt(parentRadiusKm / EARTH_RADIUS_KM) * BASE_RADIUS
      : BASE_RADIUS;
    if (parentRadiusKm && parentRadiusKm < 2000 && radiusKm > 400) {
      // Binary dwarf companion (e.g. Pluto-Charon): maintain true binary visual proportion
      return parentR * (radiusKm / parentRadiusKm);
    }
    const rawMoonR = Math.max(0.035, (radiusKm / EARTH_RADIUS_KM) * BASE_RADIUS * 0.75);
    const clampedR = Math.min(0.11, Math.max(0.035, rawMoonR));
    return Math.min(clampedR, parentR * 0.28);
  }
  const scaled = Math.cbrt(radiusKm / EARTH_RADIUS_KM) * BASE_RADIUS;
  return Math.max(MIN_RADIUS, scaled);
};
